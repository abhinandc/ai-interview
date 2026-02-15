"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import {
  CheckCircle2,
  CircleDashed,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Workflow
} from "lucide-react"
import { SessionProvider, useSession } from "@/contexts/SessionContext"
import { TaskSurface } from "@/components/TaskSurface"
import { SidekickPanel } from "@/components/SidekickPanel"
import { RoleFlowHub } from "@/components/role-flow-hub"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

function CandidateWorkspace() {
  const { session, scopePackage, rounds, currentRound, loading } = useSession()
  const [timeLeft, setTimeLeft] = useState(0)
  const [endAt, setEndAt] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const autoSubmitFired = useRef(false)

  useEffect(() => {
    const autoStartRound = async () => {
      if (
        session?.status === "scheduled" &&
        currentRound?.status === "pending" &&
        currentRound.round_number === 1
      ) {
        const response = await fetch("/api/round/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: session.id, round_number: 1 })
        })

        if (response.ok) {
          const updatedRound = await response.json()
          const durationMinutes = Number(updatedRound?.duration_minutes || currentRound.duration_minutes || 0)
          const startedAt = updatedRound?.started_at
            ? new Date(updatedRound.started_at).getTime()
            : Date.now()

          const nextEndAt = startedAt + durationMinutes * 60 * 1000
          setEndAt(nextEndAt)
          setTimeLeft(Math.max(0, Math.ceil((nextEndAt - Date.now()) / 1000)))
          autoSubmitFired.current = false
        }
      }
    }

    void autoStartRound()
  }, [session?.id, session?.status, currentRound?.round_number, currentRound?.status, currentRound?.duration_minutes])

  useEffect(() => {
    if (currentRound?.status === "active") {
      const durationMinutes = Number(currentRound.duration_minutes || 0)
      const startedAt = currentRound.started_at
        ? new Date(currentRound.started_at).getTime()
        : Date.now()
      const nextEndAt = startedAt + durationMinutes * 60 * 1000
      setEndAt(nextEndAt)
      setTimeLeft(Math.max(0, Math.ceil((nextEndAt - Date.now()) / 1000)))
      autoSubmitFired.current = false
    }
  }, [currentRound?.round_number, currentRound?.status, currentRound?.duration_minutes, currentRound?.started_at])

  useEffect(() => {
    if (!endAt) return

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining === 0 && currentRound && !autoSubmitFired.current) {
        autoSubmitFired.current = true
        void handleSubmit(true)
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [endAt, currentRound?.round_number])

  const handleSubmit = async (auto = false) => {
    if (!session || !currentRound || submitting) return
    setSubmitting(true)

    await fetch("/api/round/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: session.id,
        round_number: currentRound.round_number
      })
    })

    const nextRound = rounds.find((round) => round.round_number === currentRound.round_number + 1)

    if (nextRound) {
      await fetch("/api/round/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.id,
          round_number: nextRound.round_number
        })
      })
    }

    setSubmitting(false)

    if (auto) {
      setTimeLeft(0)
    }
  }

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }, [timeLeft])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CircleDashed className="h-4 w-4 animate-spin" />
          Loading candidate workspace...
        </div>
      </main>
    )
  }

  if (!session || !currentRound) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Session unavailable</CardTitle>
            <CardDescription>
              No active session was found. Return to candidate login and re-enter using your invite email.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  const currentRoundNumber = currentRound.round_number || 1
  const progress = ((currentRoundNumber - 1) / Math.max(rounds.length, 1)) * 100

  const candidateName = (session as any).candidate?.name || "Candidate"
  const roleName = (session as any).job?.title || "Assessment"
  const roleTrack = (session as any).job?.track || "sales"
  const configuredRoleWidgets = (scopePackage as any)?.simulation_payloads?.role_widget_config?.lanes
  const configuredRoleFamily = (scopePackage as any)?.simulation_payloads?.role_widget_config?.role_family || roleTrack

  return (
    <main className="surface-grid min-h-screen px-5 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-[1880px] space-y-7">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">OneOrigin Candidate Workspace</p>
            <h1 className="text-4xl font-semibold leading-tight tracking-[-0.01em] md:text-5xl">{roleName}</h1>
            <p className="text-sm tracking-[0.01em] text-muted-foreground">{candidateName}</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">{session.status}</Badge>
            <ThemeToggle />
          </div>
        </header>

        <div className="grid gap-7 xl:grid-cols-[360px_minmax(0,1fr)] 2xl:gap-10">
          <aside className="order-2 xl:order-none">
            <RoleFlowHub lanes={configuredRoleWidgets} roleFamily={configuredRoleFamily} />
          </aside>

          <section className="order-1 xl:order-none">
            <Card className="glass-surface relative overflow-hidden rounded-[28px] border-0 bg-transparent shadow-none">
              <div className="glass-glow" aria-hidden="true" />

              <CardHeader className="relative z-10 space-y-6 p-7 md:p-10">
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div className="space-y-3">
                    <CardDescription className="uppercase tracking-[0.2em]">Center Canvas</CardDescription>
                    <CardTitle className="text-3xl leading-[1.1] tracking-tight md:text-5xl">
                      Round {String(currentRoundNumber).padStart(2, "0")}
                      <span className="text-muted-foreground"> / {String(rounds.length).padStart(2, "0")}</span>
                    </CardTitle>
                    <p className="max-w-3xl text-sm leading-7 tracking-[0.01em] text-muted-foreground md:text-base">
                      {currentRound.title}
                    </p>
                  </div>

                  <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/60 bg-background/40 px-5 py-4 text-right backdrop-blur">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Progress</p>
                      <p className="text-4xl font-bold leading-none tracking-tight">{Math.round(progress)}%</p>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-primary/10 px-5 py-4 text-right backdrop-blur">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Time</p>
                      <p className="text-4xl font-bold leading-none tracking-tight text-primary md:text-5xl">{formattedTime}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Live session completion</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-border/60 bg-background/35 p-4 backdrop-blur">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Flow</p>
                    <p className="mt-1 flex items-center gap-1 text-sm font-medium">
                      <Workflow className="h-4 w-4 text-primary" /> Agentic widgets active
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/35 p-4 backdrop-blur">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Integrity</p>
                    <p className="mt-1 flex items-center gap-1 text-sm font-medium">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" /> Policy tracking on
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/35 p-4 backdrop-blur">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Assist</p>
                    <p className="mt-1 flex items-center gap-1 text-sm font-medium">
                      <Sparkles className="h-4 w-4 text-amber-500" /> Astra ready at edge
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative z-10 px-7 pb-6 md:px-10">
                <div className="rounded-2xl border border-border/60 bg-background/35 p-6 backdrop-blur md:p-8">
                  <TaskSurface round={currentRound} />
                </div>
              </CardContent>

              <CardFooter className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-7 pb-7 md:px-10 md:pb-10">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TimerReset className="h-4 w-4" />
                  Responses are evaluated live and auto-submitted when timer expires.
                </div>

                <Button onClick={() => handleSubmit(false)} disabled={submitting} size="lg" className="min-w-44 rounded-2xl">
                  <CheckCircle2 className="h-4 w-4" />
                  {submitting ? "Submitting..." : "Submit & Next"}
                </Button>
              </CardFooter>

              <div className="glass-highlight" aria-hidden="true" />
              <div className="glass-inner-shadow" aria-hidden="true" />
            </Card>
          </section>
        </div>
      </div>

      <SidekickPanel role={roleName} />
    </main>
  )
}

export default function CandidatePage() {
  const params = useParams()
  const sessionId = params.sessionId as string

  return (
    <SessionProvider sessionId={sessionId}>
      <CandidateWorkspace />
    </SessionProvider>
  )
}
