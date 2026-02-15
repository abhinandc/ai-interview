'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  BadgeCheck,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  ShieldAlert,
  Sparkles,
  Wand2
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GatePanel } from '@/components/GatePanel'
import { ContributionGraph } from '@/components/ui/smoothui/contribution-graph'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SessionProvider, useSession } from '@/contexts/SessionContext'
import { getRoleWidgetTemplate, normalizeRoleWidgetConfig, roleWidgetFamilies } from '@/lib/role-widget-templates'
import { ThemeToggle } from '@/components/theme-toggle'

type TranscriptEntry = {
  speaker: string
  content: string
  time: string
}

type ActionEntry = {
  action: string
  detail?: string
  time: string
}

function normalizeRedFlags(redFlags: any) {
  if (!redFlags) return []
  if (Array.isArray(redFlags)) {
    return redFlags.map((flag) => ({
      label: flag.label || flag.type || 'Red flag',
      detail: flag.detail || flag.description
    }))
  }
  if (typeof redFlags === 'object') {
    return Object.entries(redFlags).map(([label, detail]) => ({
      label,
      detail: typeof detail === 'string' ? detail : undefined
    }))
  }
  return []
}

function normalizeFollowups(followups: any) {
  if (!followups) return []
  if (Array.isArray(followups)) return followups.map(String)
  if (typeof followups === 'string') return [followups]
  return []
}

function deriveFollowupsFromDimensions(dimensions: Array<{ label: string; score: number; max?: number }>) {
  return dimensions
    .filter((dimension) => dimension.score < 15)
    .slice(0, 4)
    .map((dimension) => `Probe ${dimension.label} with a targeted follow-up.`)
}

function buildGateData(scores: any[]) {
  if (!scores || scores.length === 0) {
    return {
      overall: 0,
      confidence: 0,
      dimensions: [],
      redFlags: [],
      followups: []
    }
  }

  const latest = scores[0] as any

  if (latest.overall_score !== undefined || latest.dimension_scores) {
    const dimensionScores = latest.dimension_scores || {}
    const dimensions = Object.entries(dimensionScores).map(([label, score]) => ({
      label,
      score: Number(score) || 0,
      max: 100
    }))

    const followups = normalizeFollowups(latest.recommended_followups || latest.followups)
    const derived = followups.length === 0 ? deriveFollowupsFromDimensions(dimensions) : followups

    return {
      overall: Number(latest.overall_score) || 0,
      confidence: Number(latest.confidence) || 0,
      dimensions,
      redFlags: normalizeRedFlags(latest.red_flags),
      followups: derived
    }
  }

  const dimensionRows = scores.filter((row: any) => row.dimension && row.score !== undefined).slice(0, 10)

  const maxPerDimension = 30
  const avgScore =
    dimensionRows.reduce((acc: number, row: any) => acc + Number(row.score || 0), 0) /
    Math.max(1, dimensionRows.length)
  const overall = Math.round((avgScore / maxPerDimension) * 100)
  const confidence =
    dimensionRows.reduce((acc: number, row: any) => acc + Number(row.confidence || 0), 0) /
    Math.max(1, dimensionRows.length)

  const dimensions = dimensionRows.map((row: any) => ({
    label: String(row.dimension || '').replace(/_/g, ' '),
    score: Number(row.score) || 0,
    max: maxPerDimension
  }))

  const followups = deriveFollowupsFromDimensions(dimensions)

  return {
    overall,
    confidence,
    dimensions,
    redFlags: [],
    followups
  }
}

function buildTranscript(events: any[]) {
  const entries: TranscriptEntry[] = []

  for (const event of events || []) {
    if (event.event_type === 'prospect_message') {
      const candidateMessage = event.payload?.candidate_message
      const prospectResponse = event.payload?.prospect_response
      const time = new Date(event.created_at).toLocaleTimeString()

      if (candidateMessage && candidateMessage !== '__start__') {
        entries.push({
          speaker: 'Candidate',
          content: candidateMessage,
          time
        })
      }

      if (prospectResponse) {
        entries.push({
          speaker: 'Prospect',
          content: prospectResponse,
          time
        })
      }
    }
  }

  return entries.reverse()
}

function buildActionLog(events: any[]) {
  const actions: ActionEntry[] = []
  const included = new Set([
    'round_started',
    'round_completed',
    'artifact_submitted',
    'scoring_completed',
    'interviewer_action',
    'candidate_action',
    'magic_link_issued'
  ])

  for (const event of events || []) {
    if (!included.has(event.event_type)) continue

    const time = new Date(event.created_at).toLocaleTimeString()
    const roundNumber = event.payload?.round_number
    const detail =
      event.event_type === 'interviewer_action'
        ? event.payload?.action_type
        : event.event_type === 'candidate_action'
          ? event.payload?.message || event.payload?.action
          : event.payload?.artifact_type || event.payload?.action || roundNumber

    const label =
      event.event_type === 'round_started'
        ? `Round ${roundNumber} started`
        : event.event_type === 'round_completed'
          ? `Round ${roundNumber} completed`
          : event.event_type === 'candidate_action'
            ? 'Candidate message'
            : event.event_type.replace(/_/g, ' ')

    actions.push({
      action: label,
      detail: detail ? String(detail) : undefined,
      time
    })
  }

  return actions
}

function resolveResumeUrl(artifacts: any[]) {
  for (const artifact of artifacts || []) {
    const metadata = artifact?.metadata || {}
    const candidateUrl =
      metadata.resume_url || metadata.pdf_url || metadata.file_url || metadata.document_url || artifact?.url

    if (typeof candidateUrl === 'string' && candidateUrl.toLowerCase().includes('.pdf')) {
      return candidateUrl
    }
  }

  return null
}

function InterviewerView() {
  const { session, scopePackage, scores, events, rounds, artifacts, refresh } = useSession()
  const [notes, setNotes] = useState('')
  const [magicLink, setMagicLink] = useState<string | null>(null)
  const [sendLinkState, setSendLinkState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [sendLinkError, setSendLinkError] = useState<string | null>(null)
  const [widgetRoleFamily, setWidgetRoleFamily] = useState<string>('sales')
  const [widgetConfigText, setWidgetConfigText] = useState('')
  const [widgetConfigState, setWidgetConfigState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [widgetConfigError, setWidgetConfigError] = useState<string | null>(null)
  const [actionNotice, setActionNotice] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [resumePreview, setResumePreview] = useState<{
    signedUrl: string
    filename: string | null
    storagePath: string | null
  } | null>(null)
  const [resumePreviewState, setResumePreviewState] = useState<'idle' | 'loading' | 'ready' | 'missing' | 'error'>(
    'idle'
  )
  const [resumePreviewError, setResumePreviewError] = useState<string | null>(null)

  const gateData = useMemo(() => buildGateData(scores as any[]), [scores])
  const transcript = useMemo(() => buildTranscript(events as any[]), [events])
  const actionLog = useMemo(() => buildActionLog(events as any[]), [events])
  const resumeUrl = useMemo(() => resolveResumeUrl(artifacts as any[]), [artifacts])
  const activityData = useMemo(() => {
    const dailyCounts = new Map<string, number>()

    for (const event of (events as any[]) || []) {
      const date = new Date(event.created_at).toISOString().slice(0, 10)
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1)
    }

    return [...dailyCounts.entries()].map(([date, count]) => ({
      date,
      count,
      level: Math.min(4, Math.floor(count / 2))
    }))
  }, [events])

  const roundTimeline = useMemo(() => {
    return (rounds || []).map((round) => {
      const startedAt = round.started_at ? new Date(round.started_at) : null
      const durationMs = (round.duration_minutes || 0) * 60 * 1000
      const endsAt = startedAt ? new Date(startedAt.getTime() + durationMs) : null
      return {
        round_number: round.round_number,
        title: round.title,
        status: round.status || 'pending',
        startedAt,
        endsAt,
        durationMinutes: round.duration_minutes
      }
    })
  }, [rounds])

  // Derive role track even when session is temporarily null so hooks stay stable.
  const roleTrack = (session as any)?.job?.track || 'sales'

  // Important: keep hooks unconditional. The session is null on initial render; returning early
  // before calling `useEffect` changes hook order once session loads, causing React warnings.
  useEffect(() => {
    const configured = (scopePackage as any)?.simulation_payloads?.role_widget_config
    const roleFamily = configured?.role_family || roleTrack
    const lanes = normalizeRoleWidgetConfig(configured?.lanes)
    const resolved = lanes.length > 0 ? lanes : getRoleWidgetTemplate(roleFamily)
    setWidgetRoleFamily(roleFamily)
    setWidgetConfigText(JSON.stringify(resolved, null, 2))
  }, [scopePackage, roleTrack])

  useEffect(() => {
    if (!actionNotice) return
    const timeout = setTimeout(() => setActionNotice(null), 2600)
    return () => clearTimeout(timeout)
  }, [actionNotice])

  const fetchResumePreview = async (sessionId: string) => {
    setResumePreviewState('loading')
    setResumePreviewError(null)
    try {
      const response = await fetch(`/api/session/${sessionId}/resume`)
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load resume preview.')
      }

      if (data?.signed_url) {
        setResumePreview({
          signedUrl: data.signed_url,
          filename: data?.filename ?? null,
          storagePath: data?.storage_path ?? null
        })
        setResumePreviewState('ready')
        return
      }

      setResumePreview(null)
      setResumePreviewState('missing')
    } catch (error: any) {
      setResumePreview(null)
      setResumePreviewState('error')
      setResumePreviewError(error?.message || 'Failed to load resume preview.')
    }
  }

  useEffect(() => {
    if (!session?.id) return
    void fetchResumePreview(session.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id])

  if (!session) return null

  const candidateName = (session as any).candidate?.name || 'Candidate'
  const candidateEmail = (session as any).candidate?.email || ''
  const jobTitle = (session as any).job?.title || 'Role'
  const jobLevel = (session as any).job?.level_band || 'mid'

  const sendAction = async (action_type: string, payload?: Record<string, any>) => {
    const response = await fetch('/api/interviewer/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session.id,
        action_type,
        payload
      })
    })

    let data: any = null
    try {
      data = await response.json()
    } catch {
      data = null
    }

    if (!response.ok) {
      setActionNotice({ kind: 'error', message: data?.error || `Action failed: ${action_type}` })
      return { ok: false, data }
    }

    setActionNotice({ kind: 'success', message: `Action applied: ${action_type.replace(/_/g, ' ')}` })
    await refresh()
    return { ok: true, data }
  }

  const sendDecision = async (decision: 'proceed' | 'caution' | 'stop') => {
    await sendAction('gate_decision', { decision })

    if (decision === 'caution') {
      await refresh()
      return
    }

    if (decision === 'stop') {
      await fetch(`/api/session/${session.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'aborted', reason: 'interviewer_stop' })
      })
      await refresh()
      return
    }

    const activeRound = (rounds || []).find((round) => round.status === 'active')
    const nextRound = (rounds || []).find((round) => round.status === 'pending')

    if (activeRound) {
      await fetch('/api/round/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          round_number: activeRound.round_number
        })
      })
    }

    if (nextRound) {
      await fetch('/api/round/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          round_number: nextRound.round_number
        })
      })
    }

    await refresh()
  }

  const sendCandidateLink = async () => {
    setSendLinkState('sending')
    setSendLinkError(null)

    try {
      const response = await fetch('/api/interviewer/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.id })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate candidate access link.')
      }

      setMagicLink(data.action_link)
      setSendLinkState('sent')
      await refresh()
    } catch (error: any) {
      setSendLinkState('error')
      setSendLinkError(error?.message || 'Failed to send candidate link.')
    }
  }

  const copyMagicLink = async () => {
    if (!magicLink) return
    await navigator.clipboard.writeText(magicLink)
  }

  const loadRoleWidgetTemplate = () => {
    const template = getRoleWidgetTemplate(widgetRoleFamily)
    setWidgetConfigText(JSON.stringify(template, null, 2))
    setWidgetConfigState('idle')
    setWidgetConfigError(null)
  }

  const saveRoleWidgetConfig = async () => {
    if (!widgetConfigText.trim()) return
    setWidgetConfigState('saving')
    setWidgetConfigError(null)

    try {
      const parsed = JSON.parse(widgetConfigText)
      const normalized = normalizeRoleWidgetConfig(parsed)
      if (normalized.length === 0) {
        throw new Error('Widget config requires at least one lane with steps.')
      }

      await sendAction('role_widget_config', {
        role_family: widgetRoleFamily,
        lanes: normalized
      })

      setWidgetConfigText(JSON.stringify(normalized, null, 2))
      setWidgetConfigState('saved')
    } catch (error: any) {
      setWidgetConfigState('error')
      setWidgetConfigError(error?.message || 'Invalid widget config JSON.')
    }
  }

  const statusVariant =
    session.status === 'live' ? 'default' : session.status === 'completed' ? 'secondary' : 'outline'

  const setSessionStatus = async (status: 'completed' | 'aborted', reason?: string) => {
    const response = await fetch(`/api/session/${session.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason: reason || null })
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setActionNotice({ kind: 'error', message: data?.error || 'Failed to update session status.' })
      return
    }

    setActionNotice({ kind: 'success', message: `Session marked ${status}.` })
    await refresh()
  }

  const resolvedResumeUrl = resumePreview?.signedUrl || resumeUrl

  return (
    <main className="surface-grid min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/interviewer">
                <ArrowLeft className="h-4 w-4" />
                Sessions
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">Home</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin">Admin</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/about-oneorigin">About</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="https://www.oneorigin.us/" target="_blank" rel="noreferrer">
                Website
              </a>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => void setSessionStatus('completed', 'interviewer_complete')}>
              Mark Completed
            </Button>
            <Button size="sm" variant="destructive" onClick={() => void setSessionStatus('aborted', 'interviewer_abort')}>
              Abort Session
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <div className="grid w-full gap-6 lg:grid-cols-[1.15fr,1fr]">
        <section className="space-y-6">
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Interviewer Console</p>
                  <h1 className="text-2xl font-semibold">{candidateName}</h1>
                </div>
                <Badge variant={statusVariant} className="capitalize">
                  {session.status}
                </Badge>
              </div>
              <CardDescription>
                {jobTitle} | Level {jobLevel} | {candidateEmail || 'No candidate email on file'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={sendCandidateLink} disabled={sendLinkState === 'sending'}>
                  {sendLinkState === 'sending' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  Send Candidate Link
                </Button>
                <Button size="sm" variant="outline" onClick={() => sendAction('inject_curveball')}>
                  <Sparkles className="h-4 w-4" />
                  Inject Curveball
                </Button>
                <Button size="sm" variant="outline" onClick={() => sendAction('switch_persona')}>
                  <Wand2 className="h-4 w-4" />
                  Switch Persona
                </Button>
                <Button size="sm" variant="outline" onClick={() => sendAction('end_round')}>
                  <Clock3 className="h-4 w-4" />
                  End Round
                </Button>
              </div>

              {actionNotice && (
                <div
                  className={
                    actionNotice.kind === 'error'
                      ? 'rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'
                      : 'rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300'
                  }
                >
                  {actionNotice.message}
                </div>
              )}

              {sendLinkState === 'error' && (
                <p className="text-sm text-destructive">{sendLinkError || 'Unable to generate candidate link.'}</p>
              )}

              {magicLink && (
                <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Live magic link generated and logged.</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input value={magicLink} readOnly className="font-mono text-xs" />
                    <Button size="sm" variant="outline" onClick={copyMagicLink}>
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={magicLink} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Live Transcript</CardTitle>
              <CardDescription>Conversation and candidate statements in chronological order.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {transcript.length === 0 && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                  Transcript will populate after the conversation starts.
                </div>
              )}
              {transcript.map((entry, index) => (
                <div key={`${entry.time}-${index}`} className="rounded-lg border bg-muted/20 p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{entry.speaker}</span>
                    <span>{entry.time}</span>
                  </div>
                  <p className="mt-2 text-sm">{entry.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Round Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {roundTimeline.length === 0 && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                  No rounds are loaded for this session.
                </div>
              )}
              {roundTimeline.map((round) => {
                const roundStatusVariant =
                  round.status === 'active' ? 'default' : round.status === 'completed' ? 'secondary' : 'outline'

                return (
                  <div key={round.round_number} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">
                        Round {round.round_number}: {round.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {round.startedAt
                          ? `${round.startedAt.toLocaleTimeString()} to ${round.endsAt?.toLocaleTimeString()}`
                          : `Duration: ${round.durationMinutes} min`}
                      </p>
                    </div>
                    <Badge variant={roundStatusVariant}>{round.status}</Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Candidate Action Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {actionLog.length === 0 && <p className="text-sm text-muted-foreground">Waiting for actions...</p>}
              {actionLog.map((entry, index) => (
                <div key={`${entry.time}-${index}`} className="grid grid-cols-[1fr,1fr,auto] items-center gap-2 text-sm">
                  <span>{entry.action}</span>
                  <span className="truncate text-muted-foreground">{entry.detail || '-'}</span>
                  <span className="text-xs text-muted-foreground">{entry.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hiring Manager Activity Map</CardTitle>
              <CardDescription>Heatmap view of session event intensity.</CardDescription>
            </CardHeader>
            <CardContent>
              <ContributionGraph data={activityData} showLegend year={new Date().getFullYear()} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                Quick Resume View
              </CardTitle>
              <CardDescription>
                Preview the uploaded resume PDF for this candidate. No hardcoded resume content is shown.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  {resumePreviewState === 'loading'
                    ? 'Loading resume preview...'
                    : resumePreviewState === 'ready'
                      ? resumePreview?.filename || 'Resume PDF'
                      : resumePreviewState === 'missing'
                        ? 'No resume uploaded for this candidate.'
                        : resumePreviewState === 'error'
                          ? resumePreviewError || 'Unable to load resume preview.'
                          : ''}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => void fetchResumePreview(session.id)}>
                    Refresh
                  </Button>
                  {resolvedResumeUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={resolvedResumeUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-3 overflow-hidden rounded-lg border">
                {resolvedResumeUrl ? (
                  <iframe src={resolvedResumeUrl} title="Candidate resume preview" className="h-[640px] w-full" />
                ) : (
                  <div className="flex h-[240px] items-center justify-center bg-muted/20 p-6 text-sm text-muted-foreground">
                    Resume PDF not available yet. Upload a resume to the `resumes` storage bucket and set
                    `candidates.resume_storage_path`, or attach a PDF artifact to this session.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Role Widget Configuration</CardTitle>
              <CardDescription>
                Hiring manager configurable flows for candidate-side role widgets. Saved config streams live to candidate view.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Role family</p>
                <Select value={widgetRoleFamily} onValueChange={setWidgetRoleFamily}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role family" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleWidgetFamilies.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={loadRoleWidgetTemplate}>
                  Load Recommended Template
                </Button>
                <Button size="sm" onClick={saveRoleWidgetConfig} disabled={widgetConfigState === 'saving'}>
                  {widgetConfigState === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save Role Widget Config
                </Button>
              </div>

              <Textarea
                rows={12}
                value={widgetConfigText}
                onChange={(event) => setWidgetConfigText(event.target.value)}
                placeholder='[{"id":"lane-1","title":"Lane","subtitle":"flow","steps":[{"id":"step-1","label":"Task","eta":"06s"}]}]'
                className="font-mono text-xs"
              />

              {widgetConfigState === 'saved' && (
                <p className="text-xs text-emerald-600">Role widget configuration saved.</p>
              )}
              {widgetConfigError && (
                <p className="text-xs text-destructive">{widgetConfigError}</p>
              )}
            </CardContent>
          </Card>

          <GatePanel
            overall={gateData.overall}
            confidence={gateData.confidence}
            dimensions={gateData.dimensions}
            redFlags={gateData.redFlags}
            followups={gateData.followups}
            onDecision={sendDecision}
            onAction={(action) => {
              if (action === 'escalate') {
                void sendAction('escalate_difficulty')
              }
            }}
            onAddFollowup={async (followup) => {
              await sendAction('manual_followup', { followup })
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Interviewer Notes</CardTitle>
              <CardDescription>Saved to session action logs when submitted.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={6}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Capture context for final recommendation, concern areas, and decision rationale..."
              />
              <Button
                variant="secondary"
                onClick={async () => {
                  if (!notes.trim()) return
                  await sendAction('interviewer_note', { note: notes })
                  setNotes('')
                }}
              >
                <BadgeCheck className="h-4 w-4" />
                Save Note
              </Button>
              <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                <ShieldAlert className="mb-2 h-4 w-4" />
                All interviewer actions, notes, and magic-link events are logged for audit and post-assessment review.
              </div>
            </CardContent>
          </Card>
        </aside>
        </div>
      </div>
    </main>
  )
}

export default function InterviewerSessionPage() {
  const params = useParams()
  const sessionId = params.sessionId as string

  return (
    <SessionProvider sessionId={sessionId}>
      <InterviewerView />
    </SessionProvider>
  )
}
