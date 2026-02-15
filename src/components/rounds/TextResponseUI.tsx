'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useSession } from '@/contexts/SessionContext'
import type { Round } from '@/lib/types/database'

export function TextResponseUI({ round }: { round: Round }) {
  const { session } = useSession()
  const [response, setResponse] = useState('')

  const handleChange = async (value: string) => {
    setResponse(value)

    if (value.length > 0 && session) {
      await fetch('/api/artifact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          round_number: round.round_number,
          artifact_type: 'text_response',
          content: value,
          metadata: {
            draft: true,
            word_count: value.split(/\s+/).filter(Boolean).length
          }
        })
      })
    }
  }

  if (!session) return null

  const wordCount = response.split(/\s+/).filter(Boolean).length
  const status = wordCount < 50 ? 'Needs more detail' : wordCount < 200 ? 'Good depth' : 'Comprehensive'

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Internal Handoff Note</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={14}
            placeholder="Write your internal handoff note: deal summary, commitments, risks, and next steps."
            value={response}
            onChange={(event) => handleChange(event.target.value)}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Word count: {wordCount}</p>
            <Badge variant={wordCount < 50 ? 'outline' : 'secondary'}>{status}</Badge>
          </div>
        </CardContent>
      </Card>

      {round.config?.optional && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Optional round. Completing it strengthens evidence for follow-up rigor and ownership.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Deal status and context</li>
            <li>Key commitments made during the interview</li>
            <li>Risks and open questions</li>
            <li>Next steps with owners and timelines</li>
            <li>Cross-functional handoff dependencies</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
