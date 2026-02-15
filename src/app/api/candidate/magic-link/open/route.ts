import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { session_id, email } = await request.json()

    if (!session_id) {
      return NextResponse.json({ error: 'Missing required field: session_id' }, { status: 400 })
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('interview_sessions')
      .select('id,candidate_id')
      .eq('id', session_id)
      .single()

    if (sessionError) throw sessionError

    const { data: candidate } = await supabaseAdmin
      .from('candidates')
      .select('id,email')
      .eq('id', session.candidate_id)
      .single()

    const normalizedEmail = String(email || candidate?.email || '').trim().toLowerCase()

    await supabaseAdmin.from('live_events').insert({
      session_id,
      event_type: 'magic_link_opened',
      actor: 'candidate',
      payload: {
        candidate_id: session.candidate_id,
        email: normalizedEmail || null,
        opened_at: new Date().toISOString()
      }
    })

    const { error: magicLinkLogError } = await supabaseAdmin.from('magic_link_events').insert({
      session_id,
      candidate_id: session.candidate_id,
      email: normalizedEmail || 'unknown',
      status: 'opened',
      created_at: new Date().toISOString()
    })

    if (magicLinkLogError) {
      console.warn('Magic link open audit insert warning:', magicLinkLogError.message)
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Magic link open event error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to log magic-link open event' }, { status: 500 })
  }
}
