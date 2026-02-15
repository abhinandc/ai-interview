import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Artifact, InterviewSession, Round, Score, Event, InterviewScopePackage } from '@/lib/types/database'

export function useRealtimeSession(sessionId: string) {
  const [session, setSession] = useState<InterviewSession | null>(null)
  const [scopePackage, setScopePackage] = useState<InterviewScopePackage | null>(null)
  const [rounds, setRounds] = useState<Round[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!sessionId) return
    const response = await fetch(`/api/session/${sessionId}`)
    if (response.ok) {
      const data = await response.json()

      setSession(data.session)
      setScopePackage(data.scopePackage)
      setRounds(data.scopePackage?.round_plan || [])
      setScores(data.scores || [])
      setEvents(data.events || [])
      setArtifacts(data.artifacts || [])
    }
    setLoading(false)
  }, [sessionId])

  // Initial fetch + polling fallback (keeps UI live even if realtime is unavailable)
  useEffect(() => {
    if (!sessionId) return
    let cancelled = false

    const tick = async () => {
      if (cancelled) return
      await refresh()
    }

    void tick()

    const interval = setInterval(() => {
      void tick()
    }, 2500)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [sessionId, refresh])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!sessionId) return

    // Subscribe to session updates (interview_sessions table)
    const sessionChannel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interview_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          if (payload.new) {
            setSession(payload.new as InterviewSession)
          }
        }
      )
      .subscribe()

    // Subscribe to scope package updates (contains round_plan)
    const scopeChannel = supabase
      .channel(`scope:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interview_scope_packages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          if (payload.new) {
            const pkg = payload.new as InterviewScopePackage
            setScopePackage(pkg)
            setRounds(pkg.round_plan || [])
          }
        }
      )
      .subscribe()

    // Subscribe to scores updates
    const scoresChannel = supabase
      .channel(`scores:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scores',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          if (payload.new) {
            const nextScore = payload.new as Score
            setScores((prev) => {
              const index = prev.findIndex((s) => s.id === nextScore.id)
              if (index >= 0) {
                const updated = [...prev]
                updated[index] = nextScore
                return updated
              }
              return [...prev, nextScore]
            })
          }
        }
      )
      .subscribe()

    // Subscribe to events (live_events table)
    const eventsChannel = supabase
      .channel(`events:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_events',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          if (payload.new) {
            setEvents((prev) => [payload.new as Event, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      sessionChannel.unsubscribe()
      scopeChannel.unsubscribe()
      scoresChannel.unsubscribe()
      eventsChannel.unsubscribe()
    }
  }, [sessionId])

  return { session, scopePackage, rounds, scores, events, artifacts, loading, refresh }
}
