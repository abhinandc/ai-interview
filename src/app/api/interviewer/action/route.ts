import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import crypto from 'crypto'
import { fetchScopePackage, getActiveRoundNumber, emitRedFlag, forceStopSession } from '@/lib/db/helpers'

export async function POST(request: Request) {
  try {
    const { session_id, action_type, payload } = await request.json()

    if (!session_id || !action_type) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id, action_type' },
        { status: 400 }
      )
    }

    if (action_type === 'manual_followup' && payload?.followup) {
      let roundNumber = payload?.round_number ?? payload?.target_round ?? null

      if (!roundNumber) {
        try {
          const scopePackage = await fetchScopePackage(session_id)
          roundNumber = getActiveRoundNumber(scopePackage?.round_plan || [])
        } catch { /* proceed without round number */ }
      }

      const questionId = crypto.randomUUID()

      if (roundNumber) {
        await supabaseAdmin.from('live_events').insert({
          session_id,
          event_type: 'followup_question',
          actor: 'interviewer',
          payload: {
            round_number: roundNumber,
            question_id: questionId,
            question: payload.followup,
            source: 'manual'
          }
        })
      }

      await supabaseAdmin.from('live_events').insert({
        session_id,
        event_type: 'interviewer_action',
        actor: 'interviewer',
        payload: {
          action_type,
          ...payload,
          question_id: questionId,
          round_number: roundNumber ?? payload?.round_number ?? null,
          target_round: payload?.target_round ?? roundNumber ?? null
        }
      })

      const { data: scores } = await supabaseAdmin
        .from('scores')
        .select('*')
        .eq('session_id', session_id)
        .order('created_at', { ascending: false })
        .limit(1)

      const latest = scores?.[0]
      if (latest) {
        const existing = Array.isArray(latest.recommended_followups)
          ? latest.recommended_followups
          : []
        const updated = [...existing, String(payload.followup)]

        await supabaseAdmin
          .from('scores')
          .update({ recommended_followups: updated })
          .eq('id', latest.id)
      }
    }

    if (action_type !== 'manual_followup') {
      await supabaseAdmin.from('live_events').insert({
        session_id,
        event_type: 'interviewer_action',
        actor: 'interviewer',
        payload: {
          action_type,
          ...payload
        }
      })
    }

    if (action_type === 'escalate_difficulty') {
      const roundNumber = payload?.round_number ?? payload?.target_round ?? null
      if (roundNumber) {
        await supabaseAdmin.from('live_events').insert({
          session_id,
          event_type: 'difficulty_escalation',
          actor: 'interviewer',
          payload: {
            round_number: roundNumber,
            level: payload?.level || 'L3',
            source: payload?.source || 'interviewer'
          }
        })
      }
    }

    // Flag red flag: interviewer manually flags a concern
    if (action_type === 'flag_red_flag') {
      const { flag_type, description, severity } = payload || {}
      let roundNumber = payload?.round_number ?? null

      if (!roundNumber) {
        try {
          const scopePackage = await fetchScopePackage(session_id)
          roundNumber = getActiveRoundNumber(scopePackage?.round_plan || [])
        } catch { /* proceed without round number */ }
      }

      await emitRedFlag(session_id, {
        flag_type: flag_type || 'custom',
        severity: severity || 'warning',
        description: description || 'Flagged by interviewer',
        auto_stop: severity === 'critical',
        round_number: roundNumber,
        actor: 'interviewer',
      })

      if (severity === 'critical') {
        await forceStopSession(
          session_id,
          `Critical red flag: ${description || flag_type || 'interviewer observation'}`,
          'interviewer'
        )
      }
    }

    // Override score: interviewer can correct the AI-generated score
    if (action_type === 'override_score') {
      const { round, overall_score, dimension_scores, recommendation, reason } = payload || {}
      if (typeof round === 'number') {
        // Fetch latest score for this round
        const { data: scores } = await supabaseAdmin
          .from('scores')
          .select('*')
          .eq('session_id', session_id)
          .eq('round', round)
          .order('created_at', { ascending: false })
          .limit(1)

        const latest = scores?.[0]
        if (latest) {
          const updates: Record<string, any> = {
            overridden_by: 'interviewer',
            override_reason: reason || 'Interviewer override'
          }
          if (typeof overall_score === 'number') updates.overall_score = overall_score
          if (dimension_scores) updates.dimension_scores = dimension_scores
          if (recommendation) updates.recommendation = recommendation

          await supabaseAdmin
            .from('scores')
            .update(updates)
            .eq('id', latest.id)

          await supabaseAdmin.from('live_events').insert({
            session_id,
            event_type: 'score_override',
            actor: 'interviewer',
            payload: {
              round,
              previous_score: latest.overall_score,
              new_score: overall_score ?? latest.overall_score,
              previous_recommendation: latest.recommendation,
              new_recommendation: recommendation ?? latest.recommendation,
              reason: reason || 'Interviewer override'
            }
          })
        }
      }
    }

    // Override recommendation: quick action to change proceed/caution/stop
    if (action_type === 'override_recommendation') {
      const { round, recommendation, reason } = payload || {}
      if (typeof round === 'number' && recommendation) {
        const { data: scores } = await supabaseAdmin
          .from('scores')
          .select('*')
          .eq('session_id', session_id)
          .eq('round', round)
          .order('created_at', { ascending: false })
          .limit(1)

        const latest = scores?.[0]
        if (latest) {
          await supabaseAdmin
            .from('scores')
            .update({ recommendation })
            .eq('id', latest.id)

          await supabaseAdmin.from('live_events').insert({
            session_id,
            event_type: 'recommendation_override',
            actor: 'interviewer',
            payload: {
              round,
              previous: latest.recommendation,
              new: recommendation,
              reason: reason || 'Interviewer override'
            }
          })
        }
      }
    }

    // Force advance: skip current round and start next
    if (action_type === 'force_advance') {
      try {
        const scopePackage = await fetchScopePackage(session_id)
        const roundPlan = (scopePackage.round_plan || []) as Array<Record<string, any>>
        const activeIndex = roundPlan.findIndex((r: any) => r.status === 'active')

        if (activeIndex >= 0) {
          roundPlan[activeIndex].status = 'completed'
          roundPlan[activeIndex].completed_at = new Date().toISOString()

          const nextIndex = roundPlan.findIndex((r: any, i: number) => i > activeIndex && r.status === 'pending')
          if (nextIndex >= 0) {
            roundPlan[nextIndex].status = 'active'
            roundPlan[nextIndex].started_at = new Date().toISOString()
          }

          await supabaseAdmin
            .from('interview_scope_packages')
            .update({ round_plan: roundPlan })
            .eq('id', scopePackage.id)

          await supabaseAdmin.from('live_events').insert({
            session_id,
            event_type: 'round_force_advanced',
            actor: 'interviewer',
            payload: {
              skipped_round: roundPlan[activeIndex].round_number,
              next_round: nextIndex >= 0 ? roundPlan[nextIndex].round_number : null,
              reason: payload?.reason || 'Interviewer force advance'
            }
          })
        }
      } catch (e) {
        console.error('Force advance error:', e)
      }
    }

    // Force stop: end the entire session immediately
    if (action_type === 'force_stop') {
      await forceStopSession(
        session_id,
        payload?.reason || 'Interviewer force stop',
        'interviewer'
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Interviewer action error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
