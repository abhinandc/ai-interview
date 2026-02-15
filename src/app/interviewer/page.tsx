'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Loader2 } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type SessionListItem = {
  id: string
  status: string
  candidate?: { name?: string; email?: string }
  job?: { title?: string; level_band?: string }
  created_at?: string
}

export default function InterviewerPage() {
  const [sessions, setSessions] = useState<SessionListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSessions = async () => {
      const response = await fetch('/api/interviewer/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
      setLoading(false)
    }
    void loadSessions()
  }, [])

  return (
    <main className="surface-grid min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Interviewer</p>
            <h1 className="text-2xl font-semibold">Live Assessment Sessions</h1>
            <p className="text-sm text-muted-foreground">Open a live session for transcript, controls, and gate panel.</p>
          </div>
          <div className="flex items-center gap-2">
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
            <ThemeToggle />
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Active and Recent Sessions</CardTitle>
            <CardDescription>Newest sessions appear first.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading sessions...
              </div>
            )}

            {!loading && sessions.length === 0 && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">No sessions found.</div>
            )}

            {sessions.map((session) => {
              const statusVariant =
                session.status === 'live' ? 'default' : session.status === 'completed' ? 'secondary' : 'outline'

              return (
                <Link
                  key={session.id}
                  href={`/interviewer/${session.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition hover:bg-muted/30"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {session.candidate?.name || 'Candidate'} | {session.job?.title || 'Role'}
                      </p>
                      <Badge variant={statusVariant} className="capitalize">
                        {session.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {session.candidate?.email || 'No email'} | Level {session.job?.level_band || 'n/a'}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
