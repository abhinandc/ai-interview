import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'
import type { Round, Track } from '@/lib/types/database'

function resolveTrack(inputTrack: unknown, role: string): Track {
  const normalizedTrack = String(inputTrack || '').toLowerCase().trim()
  const normalizedRole = String(role || '').toLowerCase()
  const validTracks: Track[] = ['sales', 'agentic_eng', 'fullstack', 'marketing', 'implementation', 'HR', 'security']

  if (validTracks.includes(normalizedTrack as Track)) {
    return normalizedTrack as Track
  }

  if (/(engineer|developer|full.?stack|agentic|platform|backend|frontend|software)/i.test(normalizedRole)) {
    return 'agentic_eng'
  }
  if (/(marketing|growth|campaign|content|brand)/i.test(normalizedRole)) {
    return 'marketing'
  }
  if (/(implementation|customer|success|solutions|support)/i.test(normalizedRole)) {
    return 'implementation'
  }
  if (/(people ops|people|hr|human resources|talent ops)/i.test(normalizedRole)) {
    return 'HR'
  }

  return 'sales'
}

function buildRoundPlan(track: Track): Round[] {
  if (track === 'agentic_eng' || track === 'fullstack') {
    return [
      {
        round_number: 1,
        round_type: 'code',
        title: 'Round 1: Build + Test Rotating Feature',
        prompt: 'Implement a constrained feature, provide decomposition, a verification checklist, and at least two tests.',
        duration_minutes: 20,
        status: 'pending',
        config: { required_tests: 2, include_checklist: true }
      },
      {
        round_number: 2,
        round_type: 'code',
        title: 'Round 2: Code Review Trap + Cascade',
        prompt: 'Review AI-generated code, identify hidden issues, propose fixes, and predict downstream impact.',
        duration_minutes: 20,
        status: 'pending',
        config: { inject_cascade: true }
      },
      {
        round_number: 3,
        round_type: 'text',
        title: 'Round 3: Systems Thinking',
        prompt: 'Explain how you would evaluate this feature in production: metrics, rollback, monitoring, and regression plan.',
        duration_minutes: 8,
        status: 'pending',
        config: { optional: true }
      }
    ]
  }

  if (track === 'marketing') {
    return [
      {
        round_number: 1,
        round_type: 'text',
        title: 'Round 1: Campaign Design Under Constraints',
        prompt: 'Create ICP, message pillars, two-week experiment plan, channels, cadence, and measurable metrics.',
        duration_minutes: 15,
        status: 'pending',
        config: {}
      },
      {
        round_number: 2,
        round_type: 'text',
        title: 'Round 2: Content + Distribution Workflow',
        prompt: 'Design AI-assisted workflow from research to QA and distribution with quality gates.',
        duration_minutes: 12,
        status: 'pending',
        config: {}
      }
    ]
  }

  if (track === 'implementation') {
    return [
      {
        round_number: 1,
        round_type: 'email',
        title: 'Round 1: Customer Anxiety Email',
        prompt: 'Respond with calm accountability, clear next steps, and realistic commitments.',
        duration_minutes: 10,
        status: 'pending',
        config: {}
      },
      {
        round_number: 2,
        round_type: 'text',
        title: 'Round 2: Integration + Internal Alignment',
        prompt: 'Ask internal clarifying questions, synthesize details, and craft accurate customer response.',
        duration_minutes: 18,
        status: 'pending',
        config: {}
      }
    ]
  }

  if (track === 'HR') {
    return [
      {
        round_number: 1,
        round_type: 'text',
        title: 'Round 1: Sensitive Employee Query',
        prompt: 'Draft a high-discretion response with clarity and policy-safe language.',
        duration_minutes: 10,
        status: 'pending',
        config: {}
      },
      {
        round_number: 2,
        round_type: 'text',
        title: 'Round 2: Onboarding Checklist + Cadence',
        prompt: 'Create a structured onboarding checklist with timeline and follow-up rhythm.',
        duration_minutes: 12,
        status: 'pending',
        config: {}
      }
    ]
  }

  return [
    {
      round_number: 1,
      round_type: 'voice',
      title: 'Round 1: Live Persona Sell',
      prompt: 'Conduct a discovery call with a prospect. Ask at least 5 discovery questions, quantify value, and handle objections professionally.',
      duration_minutes: 12,
      status: 'pending',
      config: {
        persona: 'skeptical_buyer',
        required_questions: 5,
        required_objections: 3,
        curveballs: ['budget_cut', 'security_concern', 'timeline_mismatch']
      }
    },
    {
      round_number: 2,
      round_type: 'email',
      title: 'Round 2: Negotiation via Email Thread',
      prompt: 'Respond to the prospect\'s email objections. Maintain professional tone, protect margins, and demonstrate strong negotiation posture.',
      duration_minutes: 15,
      status: 'pending',
      config: {
        thread_depth: 2,
        initial_objection: 'discount_request',
        escalation_objection: 'timeline_pressure'
      }
    },
    {
      round_number: 3,
      round_type: 'text',
      title: 'Round 3: Follow-up Discipline',
      prompt: 'Write an internal handoff note summarizing the deal status, key commitments, and next steps for the account team.',
      duration_minutes: 5,
      status: 'pending',
      config: {
        optional: true
      }
    }
  ]
}

export async function POST(request: Request) {
  try {
    const { candidate_name, role, level, track } = await request.json()
    const resolvedTrack = resolveTrack(track, role)
    const roundPlan = buildRoundPlan(resolvedTrack)

    // Validate inputs
    if (!candidate_name || !role || !level) {
      return NextResponse.json(
        { error: 'Missing required fields: candidate_name, role, level' },
        { status: 400 }
      )
    }

    // Step 1: Create job profile
    const { data: jobProfile, error: jobError } = await supabaseAdmin
      .from('job_profiles')
      .insert({
        job_id: `temp_${Date.now()}`,
        title: role,
        location: 'Remote',
        level_band: level.toLowerCase() as 'junior' | 'mid' | 'senior',
        track: resolvedTrack,
        role_success_criteria: `Role-aligned criteria for ${resolvedTrack}`,
        must_have_flags: [],
        disqualifiers: [],
        gating_thresholds: { proceed: 70, caution: 50, stop: 30 }
      })
      .select()
      .single()

    if (jobError) throw jobError

    // Step 2: Create canonical job row for legacy candidate foreign key compatibility
    const { data: canonicalJob, error: canonicalJobError } = await supabaseAdmin
      .from('jobs')
      .insert({
        job_id: jobProfile.job_id,
        job_title: role,
        location: 'Remote'
      })
      .select()
      .single()

    if (canonicalJobError) throw canonicalJobError

    // Step 3: Create candidate
    const { data: candidate, error: candidateError } = await supabaseAdmin
      .from('candidates')
      .insert({
        hash_id: randomUUID(),
        rippling_candidate_id: `temp_${Date.now()}`,
        name: candidate_name,
        email: `${candidate_name.toLowerCase().replace(/\s+/g, '.')}@temp.com`,
        job_id: canonicalJob.id,
        applied_at: new Date().toISOString(),
        status: 'live_scheduled'
      })
      .select()
      .single()

    if (candidateError) throw candidateError

    // Step 4: Create session
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

    // Step 5: Create scope package with round plan
    const { data: scopePackage, error: scopeError } = await supabaseAdmin
      .from('interview_scope_packages')
      .insert({
        session_id: session.id,
        generated_at: new Date().toISOString(),
        track: resolvedTrack,
        round_plan: roundPlan,
        question_set: {},
        simulation_payloads: {
          role_widget_config: {
            role_family: resolvedTrack,
            lanes: []
          }
        },
        rubric_version: '1.0',
        models_used: ['gpt-4o'],
        approved_by: null
      })
      .select()
      .single()

    if (scopeError) throw scopeError

    // Step 6: Log session creation event
    await supabaseAdmin.from('live_events').insert({
      session_id: session.id,
      event_type: 'session_created',
      payload: {
        candidate_id: candidate.id,
        job_id: jobProfile.id,
        track: resolvedTrack
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
      rounds: roundPlan
    })
  } catch (error: any) {
    console.error('Session creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
