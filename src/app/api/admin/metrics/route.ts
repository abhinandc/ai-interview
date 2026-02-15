import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/require-admin"

function average(nums: number[]) {
  if (!nums.length) return 0
  return nums.reduce((acc, value) => acc + value, 0) / nums.length
}

export async function GET(request: Request) {
  try {
    const gate = await requireAdmin(request)
    if (!gate.ok) return gate.response

    const [sessionsRes, scoresRes, eventsRes] = await Promise.all([
      supabaseAdmin.from("interview_sessions").select("id,status,created_at"),
      supabaseAdmin.from("scores").select("overall_score,confidence,created_at"),
      supabaseAdmin
        .from("live_events")
        .select("event_type,created_at,payload,session_id")
        .order("created_at", { ascending: false })
        .limit(500)
    ])

    if (sessionsRes.error) throw sessionsRes.error
    if (scoresRes.error) throw scoresRes.error
    if (eventsRes.error) throw eventsRes.error

    const sessions = sessionsRes.data || []
    const scores = scoresRes.data || []
    const events = eventsRes.data || []

    const live = sessions.filter((session) => session.status === "live").length
    const completed = sessions.filter((session) => session.status === "completed").length
    const aborted = sessions.filter((session) => session.status === "aborted").length

    const overallScores = scores.map((score) => Number(score.overall_score || 0))
    const confidences = scores.map((score) => Number(score.confidence || 0))

    const sidekickEvents = events.filter((event) => event.event_type === "sidekick_query")
    const tokensUsed = sidekickEvents.reduce((acc, event) => {
      return acc + Number((event.payload as any)?.tokens_used || 0)
    }, 0)

    const promptLengths = sidekickEvents
      .map((event) => Number((event.payload as any)?.query_length || 0))
      .filter((value) => value > 0)

    const eventTypeCounts = new Map<string, number>()
    for (const event of events) {
      eventTypeCounts.set(event.event_type, (eventTypeCounts.get(event.event_type) || 0) + 1)
    }

    const topEventTypes = [...eventTypeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([event_type, count]) => ({ event_type, count }))

    return NextResponse.json({
      totals: {
        sessions: sessions.length,
        live,
        completed,
        aborted,
        avg_overall_score: Number(average(overallScores).toFixed(2)),
        avg_confidence: Number(average(confidences).toFixed(2)),
        sidekick_queries: sidekickEvents.length,
        sidekick_tokens: tokensUsed,
        avg_prompt_length: Number(average(promptLengths).toFixed(2))
      },
      top_event_types: topEventTypes,
      recent_events: events.slice(0, 120)
    })
  } catch (error: any) {
    console.error("Admin metrics error:", error)
    return NextResponse.json({ error: error.message || "Failed to load metrics" }, { status: 500 })
  }
}
