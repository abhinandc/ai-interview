import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    const normalized = String(email || "").trim().toLowerCase()

    if (!normalized) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const { data: candidates, error: candidateError } = await supabaseAdmin
      .from("candidates")
      .select("id,name,email,applied_at")
      .ilike("email", normalized)
      .order("applied_at", { ascending: false, nullsFirst: false })
      .limit(25)

    if (candidateError) throw candidateError

    if (!candidates?.length) {
      return NextResponse.json(
        { error: "No active interview found for this email." },
        { status: 404 }
      )
    }

    const candidateIds = candidates.map((candidate) => candidate.id)

    const { data: sessions, error: sessionError } = await supabaseAdmin
      .from("interview_sessions")
      .select("id,status,created_at,candidate_id")
      .in("candidate_id", candidateIds)
      .in("status", ["scheduled", "live", "paused"])
      .order("created_at", { ascending: false })
      .limit(25)

    if (sessionError) throw sessionError

    const liveSession = sessions?.[0]

    if (!liveSession) {
      return NextResponse.json(
        { error: "No scheduled or live session is currently available." },
        { status: 404 }
      )
    }

    const matchedCandidate = candidates.find((candidate) => candidate.id === liveSession.candidate_id) ?? candidates[0]

    return NextResponse.json({
      session_id: liveSession.id,
      status: liveSession.status,
      candidate_name: matchedCandidate.name,
      candidate_email: matchedCandidate.email,
      redirect_url: `/candidate/${liveSession.id}`
    })
  } catch (error: any) {
    console.error("Candidate access error:", error)
    return NextResponse.json({ error: error.message || "Unable to access session" }, { status: 500 })
  }
}
