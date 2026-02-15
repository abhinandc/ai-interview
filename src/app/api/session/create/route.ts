import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { candidate_name, role, level, track, difficulty } = await request.json()

    // Validate inputs
    if (!candidate_name || !role || !level) {
      return NextResponse.json(
        { error: 'Missing required fields: candidate_name, role, level' },
        { status: 400 }
      )
    }

    // Default track to 'sales' if not provided
    const jobTrack = track || 'sales'
    // Default difficulty to 3 if not provided
    const voiceDifficulty = difficulty || 3

    // Step 1: Create job profile
    const { data: jobProfile, error: jobError } = await supabaseAdmin
      .from('job_profiles')
      .insert({
        job_id: `temp_${Date.now()}`,
        title: role,
        location: 'Remote',
        level_band: level.toLowerCase() as 'junior' | 'mid' | 'senior',
        track: jobTrack as 'sales' | 'agentic_eng' | 'fullstack' | 'marketing' | 'implementation' | 'HR' | 'security'
      })
      .select()
      .single()

    if (jobError) throw jobError

    // Step 2: Create candidate
    const { data: candidate, error: candidateError } = await supabaseAdmin
      .from('candidates')
      .insert({
        rippling_candidate_id: `temp_${Date.now()}`,
        name: candidate_name,
        email: `${candidate_name.toLowerCase().replace(/\s+/g, '.')}@temp.com`,
        job_id: jobProfile.job_id,
        status: 'live_scheduled'
      })
      .select()
      .single()

    if (candidateError) throw candidateError

    // Step 3: Create session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('interview_sessions')
      .insert({
        candidate_id: candidate.id,
        job_id: jobProfile.id,
        session_type: 'live',
        status: 'scheduled',
        scheduled_at: new Date().toISOString()
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    // Define rounds for Sales role (stored in scope package)
    const salesRounds = [
      {
        round_number: 1,
        round_type: 'voice-realtime' as const,
        title: 'Round 1: Live Voice Call with AI Prospect',
        prompt: 'Conduct a live voice discovery call with an AI prospect. Ask discovery questions, handle objections, demonstrate value, and close for next steps.',
        duration_minutes: 12,
        status: 'pending' as const,
        config: {
          persona_id: null, // Will use default persona in API
          scenario_id: null, // Will use default scenario
          initial_difficulty: voiceDifficulty, // 1-5 scale
          allow_curveballs: false, // For Day 2, no curveballs yet
          voice: 'sage' // OpenAI voice
        }
      },
      {
        round_number: 2,
        round_type: 'email' as const,
        title: 'Round 2: Negotiation via Email Thread',
        prompt: 'Respond to the prospect\'s email objections. Maintain professional tone, protect margins, and demonstrate strong negotiation posture.',
        duration_minutes: 15,
        status: 'pending' as const,
        config: {
          thread_depth: 2,
          initial_objection: 'discount_request',
          escalation_objection: 'timeline_pressure'
        }
      },
      {
        round_number: 3,
        round_type: 'text' as const,
        title: 'Round 3: Follow-up Discipline',
        prompt: 'Write an internal handoff note summarizing the deal status, key commitments, and next steps for the account team.',
        duration_minutes: 5,
        status: 'pending' as const,
        config: {
          optional: true
        }
      }
    ]

    // Step 4: Create scope package with round plan
    const { data: scopePackage, error: scopeError } = await supabaseAdmin
      .from('interview_scope_packages')
      .insert({
        session_id: session.id,
        generated_at: new Date().toISOString(),
        track: jobTrack,
        round_plan: salesRounds,
        question_set: {}
      })
      .select()
      .single()

    if (scopeError) throw scopeError

    // Step 5: Log session creation event
    await supabaseAdmin.from('live_events').insert({
      session_id: session.id,
      event_type: 'session_created',
      payload: {
        candidate_id: candidate.id,
        job_id: jobProfile.id,
        track: jobTrack
      }
    })

    return NextResponse.json({
      session: {
        ...session,
        candidate,
        job: jobProfile,
        currentRound: 1
      },
      scopePackage,
      rounds: salesRounds
    })
  } catch (error: any) {
    console.error('Session creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
