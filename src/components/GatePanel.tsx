import { AlertTriangle, CheckCircle2, Slash, ShieldAlert, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"

export interface GatePanelProps {
  overall?: number
  confidence?: number
  dimensions?: Array<{ label: string; score: number; max?: number }>
  redFlags?: Array<{ label: string; detail?: string }>
  followups?: string[]
  onDecision?: (decision: "proceed" | "caution" | "stop") => void
  onAction?: (action: "escalate") => void
  onAddFollowup?: (followup: string) => void
}

export function GatePanel({
  overall,
  confidence,
  dimensions,
  redFlags,
  followups,
  onDecision,
  onAction,
  onAddFollowup
}: GatePanelProps) {
  const resolved = {
    overall: overall ?? 0,
    confidence: confidence ?? 0,
    dimensions: dimensions ?? [],
    redFlags: redFlags ?? [],
    followups: followups ?? []
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Gate Panel
            </CardTitle>
            <CardDescription>Live scoring, risks, and interviewer controls.</CardDescription>
          </div>
          <Badge variant="secondary">0-100</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Overall score</p>
            <p className="mt-1 text-3xl font-semibold">{resolved.overall}</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">Confidence</p>
            <p className="mt-1 text-3xl font-semibold">{Math.round(resolved.confidence * 100)}%</p>
          </div>
        </div>

        <Progress value={Math.max(0, Math.min(100, resolved.overall))} />
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Dimension Scores</p>
          {resolved.dimensions.length === 0 && (
            <p className="text-sm text-muted-foreground">No scores yet.</p>
          )}
          {resolved.dimensions.map((dimension) => {
            const max = Number(dimension.max || 30)
            const value = Number(dimension.score || 0)
            return (
              <div key={dimension.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{dimension.label.replace(/_/g, " ")}</span>
                  <span className="font-medium">{value}</span>
                </div>
                <Progress value={(value / max) * 100} />
              </div>
            )
          })}
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Red Flags</p>
          {resolved.redFlags.length === 0 && (
            <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                No critical flags detected
              </div>
            </div>
          )}
          {resolved.redFlags.map((flag) => (
            <div key={flag.label} className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
              <div className="flex items-center gap-2 font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {flag.label}
              </div>
              {flag.detail && <p className="mt-1 text-xs text-muted-foreground">{flag.detail}</p>}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Recommended Follow-ups</p>
          <div className="space-y-2">
            {resolved.followups.length === 0 && (
              <div className="rounded-lg border bg-muted/60 p-3 text-sm text-muted-foreground">
                No follow-up suggestions yet.
              </div>
            )}
            {resolved.followups.map((followup) => (
              <div key={followup} className="rounded-lg border bg-muted/40 p-3 text-sm">
                {followup}
              </div>
            ))}
          </div>

          {onAddFollowup && (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add manual follow-up..."
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return
                  const value = event.currentTarget.value.trim()
                  if (!value) return
                  onAddFollowup(value)
                  event.currentTarget.value = ""
                }}
              />
              <Button
                variant="outline"
                onClick={(event) => {
                  const input = event.currentTarget.previousElementSibling as HTMLInputElement | null
                  const value = input?.value?.trim()
                  if (!value) return
                  onAddFollowup(value)
                  if (input) input.value = ""
                }}
              >
                Add
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" onClick={() => onAction?.("escalate")}>
            <ShieldAlert className="h-4 w-4" />
            Escalate
          </Button>
          <Button variant="secondary" onClick={() => onDecision?.("caution")}>
            <AlertTriangle className="h-4 w-4" />
            Caution
          </Button>
          <Button variant="default" onClick={() => onDecision?.("proceed")}>
            <CheckCircle2 className="h-4 w-4" />
            Proceed
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Button variant="destructive" onClick={() => onDecision?.("stop")}>
            <Slash className="h-4 w-4" />
            Stop
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
