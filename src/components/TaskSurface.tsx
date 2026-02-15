'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { VoiceCallUI } from '@/components/rounds/VoiceCallUI'
import { EmailThreadUI } from '@/components/rounds/EmailThreadUI'
import { TextResponseUI } from '@/components/rounds/TextResponseUI'
import type { Round } from '@/lib/types/database'

function formatPersonaLabel(value: string) {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return null
  return normalized
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function TaskSurface({ round }: { round: Round }) {
  const config = (round as any)?.config || {}
  const persona = config.persona_override || config.persona
  const injectedCurveballs = Array.isArray(config.injected_curveballs) ? config.injected_curveballs : []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline">{round.round_type.toUpperCase()}</Badge>
        <h2 className="text-xl font-semibold">{round.title}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{round.prompt}</p>

      {(persona || injectedCurveballs.length > 0) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="space-y-3 pt-6">
            {persona ? (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="secondary">Persona</Badge>
                <span className="font-medium">{formatPersonaLabel(persona) || String(persona)}</span>
              </div>
            ) : null}

            {injectedCurveballs.length > 0 ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline">Injected constraints</Badge>
                  <span className="text-muted-foreground">Added live by the interviewer.</span>
                </div>
                <div className="grid gap-2">
                  {injectedCurveballs.slice(-3).map((item: any, index: number) => (
                    <div key={`${item?.key || item?.title || index}`} className="rounded-lg border bg-background/40 p-3">
                      <p className="text-sm font-semibold">
                        {String(injectedCurveballs.length - Math.min(3, injectedCurveballs.length) + index + 1).padStart(2, '0')}.{' '}
                        {item?.title || item?.key || 'Constraint'}
                      </p>
                      {item?.detail ? (
                        <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {round.round_type === 'voice' && <VoiceCallUI round={round} />}
      {round.round_type === 'email' && <EmailThreadUI round={round} />}
      {round.round_type === 'text' && <TextResponseUI round={round} />}
      {round.round_type === 'code' && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Code editor surface is not yet enabled in this build.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
