"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import { WebPerformancePage } from "@/components/uitripled/web-performance-page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type ScoreRow = {
  overall_score: number
  confidence: number
  recommendation?: "proceed" | "caution" | "stop"
}

type SessionPayload = {
  session?: { candidate?: { name?: string }; job?: { title?: string } }
  scores?: ScoreRow[]
}

export default function CandidateSummaryPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [payload, setPayload] = useState<SessionPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const response = await fetch(`/api/session/${sessionId}`)
      if (response.ok) {
        setPayload(await response.json())
      }
      setLoading(false)
    }

    if (sessionId) void load()
  }, [sessionId])

  const latestScore = payload?.scores?.[0]
  const confidencePct = Math.round((latestScore?.confidence || 0) * 100)
  const recommendation = useMemo(() => {
    const rec = latestScore?.recommendation
    if (rec === "proceed") return "Proceed"
    if (rec === "caution") return "Caution"
    if (rec === "stop") return "Stop"
    return "Pending"
  }, [latestScore?.recommendation])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading feedback summary...
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen">
      <section className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8">
        <div className="space-y-5">
          <Badge variant="outline">Candidate Feedback Summary</Badge>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Post-interview feedback for {payload?.session?.candidate?.name || "candidate"}
          </h1>
          <p className="text-muted-foreground">
            Role: {payload?.session?.job?.title || "Role"} | This summary is generated from your live assessment telemetry.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Overall score</p>
              <p className="text-5xl font-extrabold">{latestScore?.overall_score ?? "--"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Confidence</p>
              <p className="text-5xl font-extrabold">{confidencePct}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Recommendation</p>
              <p className="flex items-center gap-2 text-3xl font-extrabold">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                {recommendation}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/about-oneorigin">
              About OneOrigin
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/logout">Exit Experience</Link>
          </Button>
        </div>
      </section>

      <WebPerformancePage />
    </div>
  )
}

