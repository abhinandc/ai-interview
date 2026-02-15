'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SessionProvider, useSession } from '@/contexts/SessionContext'
import { TaskSurface } from '@/components/TaskSurface'
import { SidekickPanel } from '@/components/SidekickPanel'
import { AlarmClock, AlertTriangle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'

function AutoStopOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm">
      <div className="text-center space-y-4">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-ink-400" />
        <p className="text-lg font-semibold text-ink-900">Session Ending</p>
        <p className="text-sm text-ink-500">Please wait while we wrap up...</p>
      </div>
    </div>
  )
}

function CandidateView() {
  const { session, rounds, currentRound, events, loading } = useSession()
  const [timeLeft, setTimeLeft] = useState(0)
  const [endAt, setEndAt] = useState<number | null>(null)
  const autoSubmitFired = useRef(false)
  const router = useRouter()
  const [followupAnswer, setFollowupAnswer] = useState('')
  const [followupGateRound, setFollowupGateRound] = useState<number | null>(null)
  const [forcedFollowupId, setForcedFollowupId] = useState<string | null>(null)
  const [forcedFollowupQuestion, setForcedFollowupQuestion] = useState<string | null>(null)
  const [serverFollowups, setServerFollowups] = useState<
    Array<{ id: string; question: string; round_number?: number | null; source?: string }>
  >([])
  const [showSidekick, setShowSidekick] = useState(true)
  const [localFollowups, setLocalFollowups] = useState<
    Array<{ question_id: string; question: string; round_number: number }>
  >([])
  const [localAnswers, setLocalAnswers] = useState<
    Array<{ question_id: string; question: string; answer: string; round_number: number }>
  >([])

  const followupThread = useMemo(() => {
    if (!currentRound) return []
    const questions = (events || [])
      .filter(
        (event) =>
          event.event_type === 'followup_question' &&
          (event.payload?.round_number == null ||
            Number(event.payload?.round_number) === currentRound.round_number)
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    const manualQuestions = (events || [])
      .filter(
        (event) =>
          event.event_type === 'interviewer_action' &&
          event.payload?.action_type === 'manual_followup' &&
          event.payload?.followup
      )
      .map((event) => ({
        payload: {
          question_id: event.payload?.question_id,
          question: event.payload?.followup,
          round_number: event.payload?.round_number ?? event.payload?.target_round
        },
        created_at: event.created_at
      }))
      .filter(
        (event) =>
          event.payload?.round_number == null ||
          Number(event.payload?.round_number) === currentRound.round_number
      )

    const answers = (events || [])
      .filter(
        (event) =>
          event.event_type === 'followup_answer' &&
          (event.payload?.round_number == null ||
            Number(event.payload?.round_number) === currentRound.round_number)
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    const localQuestions = localFollowups
      .filter((item) => Number(item.round_number) === currentRound.round_number)
      .map((item) => ({
        payload: {
          question_id: item.question_id,
          question: item.question
        },
        created_at: new Date().toISOString()
      }))

    const serverQuestions = serverFollowups
      .filter(
        (item) =>
          item.round_number == null ||
          Number(item.round_number) === currentRound.round_number
      )
      .map((item) => ({
        payload: {
          question_id: item.id,
          question: item.question
        },
        created_at: new Date().toISOString()
      }))

    const localAnswerEvents = localAnswers
      .filter((item) => Number(item.round_number) === currentRound.round_number)
      .map((item) => ({
        payload: {
          question_id: item.question_id,
          answer: item.answer
        },
        created_at: new Date().toISOString()
      }))

    const allQuestions = [
      ...localQuestions,
      ...serverQuestions,
      ...manualQuestions,
      ...questions
    ].reduce((acc, item) => {
      const id = item.payload?.question_id
      if (!id || acc.some((q) => q.payload?.question_id === id)) return acc
      acc.push(item)
      return acc
    }, [] as Array<{ payload?: Record<string, any>; created_at: string; [key: string]: any }>)

    const allAnswers = [...answers, ...localAnswerEvents]

    const answerMap = new Map<string, string>()
    for (const answer of allAnswers) {
      if (answer.payload?.question_id) {
        answerMap.set(answer.payload.question_id, answer.payload?.answer || '')
      }
    }

    return allQuestions.map((question) => ({
      id: question.payload?.question_id,
      question:
        forcedFollowupId &&
        forcedFollowupQuestion &&
        question.payload?.question_id === forcedFollowupId
          ? forcedFollowupQuestion
          : question.payload?.question || '',
      answered: answerMap.has(question.payload?.question_id),
      answer: answerMap.get(question.payload?.question_id)
    }))
  }, [
    events,
    currentRound,
    localFollowups,
    localAnswers,
    forcedFollowupId,
    forcedFollowupQuestion,
    serverFollowups
  ])

  const autoStopTriggered = useMemo(() => {
    return (events || []).some(
      (e: any) =>
        e.event_type === 'auto_stop_triggered' ||
        e.event_type === 'session_force_stopped'
    )
  }, [events])

  const cautionCount = useMemo(() => {
    return (events || []).filter(
      (e: any) => e.event_type === 'red_flag_detected'
    ).length
  }, [events])

  const pendingFollowup =
    (forcedFollowupId
      ? followupThread.find((item) => item.id === forcedFollowupId && !item.answered)
      : null) ||
    followupThread.find((item) => item.id && !item.answered)
  const hasPendingFollowups = Boolean(pendingFollowup)
  const showFollowups =
    Boolean(followupGateRound && currentRound?.round_number === followupGateRound) ||
    hasPendingFollowups

  useEffect(() => {
    if (!session?.id) return
    const loadThread = async () => {
      try {
        const response = await fetch('/api/followup/thread', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: session.id })
        })
        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data?.thread)) {
            setServerFollowups(data.thread)
          }
        }
      } catch {
        // Best-effort sync.
      }
    }
    loadThread()
  }, [session?.id])

  // Auto-start Round 1 if session is scheduled
  useEffect(() => {
    const autoStartRound = async () => {
      if (
        session?.status === 'scheduled' &&
        currentRound?.status === 'pending' &&
        currentRound.round_number === 1
      ) {
        const response = await fetch('/api/round/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: session.id,
            round_number: 1
          })
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
    autoStartRound()
  }, [session?.id, session?.status, currentRound?.status, currentRound?.round_number, currentRound?.duration_minutes])

  // Initialize timer when round starts
  useEffect(() => {
    if (currentRound?.status === 'active') {
      const durationMinutes = Number(currentRound.duration_minutes || 0)
      const startedAt = currentRound.started_at
        ? new Date(currentRound.started_at).getTime()
        : Date.now()
      const nextEndAt = startedAt + durationMinutes * 60 * 1000
      setEndAt(nextEndAt)
      setTimeLeft(Math.max(0, Math.ceil((nextEndAt - Date.now()) / 1000)))
      autoSubmitFired.current = false
    }
  }, [currentRound?.round_number, currentRound?.status, currentRound?.started_at, currentRound?.duration_minutes])

  // Countdown timer
  useEffect(() => {
    if (!endAt) return

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining === 0 && currentRound && !autoSubmitFired.current) {
        autoSubmitFired.current = true
        handleAutoSubmit()
      }
    }

    tick()
    const timer = setInterval(tick, 1000)

    return () => clearInterval(timer)
  }, [endAt, currentRound?.round_number, hasPendingFollowups])

  const handleAutoSubmit = async () => {
    if (!currentRound || !session) return
    // Complete round when time expires (ignore pending follow-ups)
    await fetch(`/api/round/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session.id,
        round_number: currentRound.round_number
      })
    })

    const nextRound = rounds.find(r => r.round_number === currentRound.round_number + 1)
    if (nextRound) {
      await fetch(`/api/round/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          round_number: nextRound.round_number
        })
      })
      return
    }

    await fetch(`/api/session/${session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    })
  }

  const handleSubmit = async () => {
    if (!currentRound || !session) return
    if (hasPendingFollowups) return

    try {
      const pendingResponse = await fetch('/api/followup/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          round_number: currentRound.round_number
        })
      })
      if (pendingResponse.ok) {
        const data = await pendingResponse.json()
        if (data.pending && data.question_id && data.question) {
          setLocalFollowups((prev) => {
            if (prev.some((item) => item.question_id === data.question_id)) return prev
            return [
              ...prev,
              {
                question_id: data.question_id,
                question: data.question,
                round_number: currentRound.round_number
              }
            ]
          })
          setForcedFollowupId(data.question_id)
          setForcedFollowupQuestion(data.question)
          setFollowupGateRound(currentRound.round_number)
          return
        }
      }
    } catch {
      // Best-effort check; proceed with existing data if it fails.
    }

    try {
      const threadResponse = await fetch('/api/followup/thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.id })
      })
      if (threadResponse.ok) {
        const data = await threadResponse.json()
        const thread = Array.isArray(data?.thread) ? data.thread : []
        const unanswered = thread.filter(
          (item: any) =>
            (item.round_number == null ||
              Number(item.round_number) === currentRound.round_number) &&
            !item.answered
        )
        const manual = unanswered.find((item: any) => item.source === 'manual')
        const pending = manual || unanswered[0]
        if (pending?.id && pending?.question) {
          setLocalFollowups((prev) => {
            if (prev.some((item) => item.question_id === pending.id)) return prev
            return [
              ...prev,
              {
                question_id: pending.id,
                question: pending.question,
                round_number: currentRound.round_number
              }
            ]
          })
          setForcedFollowupId(pending.id)
          setForcedFollowupQuestion(pending.question)
          setFollowupGateRound(currentRound.round_number)
          return
        }
      }
    } catch {
      // Best-effort thread check.
    }

    if (followupThread.length > 0) {
      setFollowupGateRound(currentRound.round_number)
      return
    }

    const followupResponse = await fetch('/api/followup/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session.id,
        round_number: currentRound.round_number
      })
    })

    if (followupResponse.ok) {
      const data = await followupResponse.json()
      if (data.generated) {
        if (data.question_id && data.question) {
          setLocalFollowups((prev) => {
            if (prev.some((item) => item.question_id === data.question_id)) return prev
            return [
              ...prev,
              {
                question_id: data.question_id,
                question: data.question,
                round_number: currentRound.round_number
              }
            ]
          })
        }
        return
      }
    }

    // Complete current round
    await fetch(`/api/round/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session.id,
        round_number: currentRound.round_number
      })
    })

    // Check if there's a next round
    const nextRound = rounds.find(r => r.round_number === currentRound.round_number + 1)
    if (nextRound) {
      // Start next round
      await fetch(`/api/round/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          round_number: nextRound.round_number
        })
      })
    }
  }

  const submitFollowupAnswer = async () => {
    if (!pendingFollowup || !session || !currentRound) return
    if (!followupAnswer.trim()) return

    await fetch('/api/artifact/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session.id,
        round_number: currentRound.round_number,
        artifact_type: 'followup_answer',
        content: followupAnswer.trim(),
        metadata: {
          question_id: pendingFollowup.id,
          question: pendingFollowup.question
        }
      })
    })

    if (pendingFollowup?.id && pendingFollowup.question) {
      setLocalAnswers((prev) => [
        ...prev,
        {
          question_id: pendingFollowup.id,
          question: pendingFollowup.question,
          answer: followupAnswer.trim(),
          round_number: currentRound.round_number
        }
      ])
    }
    if (forcedFollowupId && pendingFollowup?.id === forcedFollowupId) {
      setForcedFollowupId(null)
      setForcedFollowupQuestion(null)
    }
    setFollowupAnswer('')
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-skywash-600 mx-auto" />
          <p className="mt-4 text-sm text-ink-500">Loading session...</p>
        </div>
      </div>
    )
  }

  if (!session || !currentRound) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-ink-900">Session not found</p>
          <p className="mt-2 text-sm text-ink-500">This session may not exist or has ended.</p>
        </div>
      </div>
    )
  }

  if (session.status === 'completed' || session.status === 'aborted') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-ink-900">Session Complete</p>
          <p className="mt-2 text-sm text-ink-500">Thank you for participating. You may now close this window.</p>
        </div>
      </div>
    )
  }

  if (autoStopTriggered) {
    return <AutoStopOverlay />
  }

  // Calculate current round number from active round
  const currentRoundNumber = currentRound?.round_number || 1
  const progress = ((currentRoundNumber - 1) / rounds.length) * 100

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatRoundType = (roundType?: string) => {
    if (!roundType) return 'ROUND'
    if (roundType === 'voice') return 'LIVE CONVERSATION'
    if (roundType === 'mcq') return 'MULTIPLE CHOICE'
    return roundType.toUpperCase()
  }

  // Get candidate and job info from session (added by API)
  const candidateName = (session as any).candidate?.name || 'Candidate'
  const jobTitle = (session as any).job?.title || 'Position'
  const jobLevel = (session as any).job?.level_band || 'mid'
  const candidateInsights = (session as any).candidate_insights || {}
  const interviewLevel = candidateInsights.interview_level

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eef6ff_0%,#f7f7fb_35%,#fefefe_100%)] px-4 py-8 sm:px-6">
      <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[2fr,1fr]">
        <section className="space-y-6">
          {/* Header */}
          <header className="rounded-3xl border border-ink-100 bg-white/90 px-5 py-4 shadow-panel backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
                    {session.status}
                  </span>
                </div>
                <h1 className="font-display text-2xl text-ink-900">{jobTitle}</h1>
                <p className="text-sm text-ink-500">
                  {candidateName} • {interviewLevel || jobLevel}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm shadow-sm">
                  <AlarmClock className="h-4 w-4 text-skywash-600" />
                  <span className="font-semibold text-lg">{formatTime(timeLeft)}</span>
                  <span className="text-ink-500">left</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Progress value={progress} className="flex-1" />
              <span className="rounded-full border border-ink-200 bg-ink-50 px-3 py-1 text-xs text-ink-600">
                {formatRoundType(currentRound.round_type)} • {currentRound.duration_minutes}m
              </span>
            </div>
          </header>

          {/* Caution banner — visible when any red flag is detected */}
          {cautionCount > 0 && !autoStopTriggered && (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-3 animate-in fade-in">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Caution noted</p>
                <p className="text-xs text-amber-700">
                  The interviewer has noted a concern with your response. Please review your answer carefully and ensure accuracy.
                </p>
              </div>
            </div>
          )}

          {/* Task Surface */}
          <Card className="animate-rise-in border-ink-100 bg-white/90 shadow-panel">
            <CardContent className="space-y-6 pt-6">
              {showFollowups && followupThread.length > 0 && (
                <div className="space-y-3 rounded-2xl border border-ink-100 bg-white px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">
                    Follow-up Thread
                  </div>
                  <div className="space-y-3 text-sm">
                    {followupThread.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-ink-50 px-4 py-3">
                        <p className="font-semibold text-ink-900">Q: {item.question}</p>
                        {item.answered ? (
                          <p className="mt-2 text-ink-600">A: {item.answer}</p>
                        ) : (
                          <p className="mt-2 text-ink-500">Awaiting your response.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {showFollowups && hasPendingFollowups && (
                <div className="space-y-3 rounded-2xl border border-skywash-200 bg-skywash-50 px-4 py-4">
                  <div className="text-sm font-semibold text-ink-900">Answer the follow-up</div>
                  <p className="text-sm text-ink-600">{pendingFollowup?.question}</p>
                  <Textarea
                    rows={5}
                    placeholder="Write your response to the follow-up question..."
                    value={followupAnswer}
                    onChange={(e) => setFollowupAnswer(e.target.value)}
                  />
                  <div className="flex items-center gap-3">
                    <Button size="sm" onClick={submitFollowupAnswer} disabled={!followupAnswer.trim()}>
                      Submit follow-up
                    </Button>
                    <span className="text-xs text-ink-500">
                      You must answer follow-ups before proceeding.
                    </span>
                  </div>
                </div>
              )}
              <TaskSurface round={currentRound} events={events} />
              <div className="flex flex-wrap gap-3">
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={session.status !== 'live' || hasPendingFollowups}
                >
                  Submit & Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-ink-500">Auto-submit when the timer ends.</p>
            </CardContent>
          </Card>
        </section>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="flex items-center justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSidekick((prev) => !prev)}
            >
              {showSidekick ? 'Hide Sidekick' : 'Show Sidekick'}
            </Button>
          </div>
          {showSidekick ? (
            <div className="h-[calc(100vh-160px)]">
              <SidekickPanel role={jobTitle} />
            </div>
          ) : (
            <div className="rounded-3xl border border-ink-100 bg-white/80 px-6 py-5 text-sm text-ink-500 shadow-panel">
              I'm your chat assistant — I can help you think through the prompt. Click "Show Sidekick" to open.
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}

export default function CandidatePage() {
  const params = useParams()
  const sessionId = params.sessionId as string

  return (
    <SessionProvider sessionId={sessionId}>
      <CandidateView />
    </SessionProvider>
  )
}
