'use client'

import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface RedFlagEntry {
  label: string;
  detail?: string;
  source?: string;
  severity?: 'critical' | 'warning';
  auto_stop?: boolean;
  created_at?: string;
}

export interface GatePanelProps {
  overall?: number;
  confidence?: number;
  dimensions?: Array<{ label: string; score: number; max?: number }>;
  redFlags?: RedFlagEntry[];
  truthLog?: Array<{ dimension: string; quote: string; line?: number }>;
  followups?: string[];
}

export function GatePanel({
  overall,
  confidence,
  dimensions,
  redFlags,
  truthLog,
  followups
}: GatePanelProps) {
  const resolved = {
    overall: overall ?? 0,
    confidence: confidence ?? 0,
    dimensions: dimensions ?? [],
    redFlags: redFlags ?? [],
    truthLog: truthLog ?? [],
    followups: followups ?? []
  };
  return (
    <Card className="bg-white/90">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">Gate Panel</h2>
          <Badge tone="sky">Live scoring</Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-3xl font-semibold text-ink-900">{resolved.overall}</div>
          <div className="text-sm text-ink-500">Overall score</div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-500">
            <span>Confidence</span>
            <span>{resolved.confidence.toFixed(2)}</span>
          </div>
          <Progress value={resolved.confidence * 100} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          {resolved.dimensions.map((dimension) => (
            <div key={dimension.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{dimension.label}</span>
                <span className="font-semibold">{dimension.score}</span>
              </div>
              <Progress value={(dimension.score / (dimension.max || 30)) * 100} />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">Red Flags</p>
            {resolved.redFlags.length > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                resolved.redFlags.some(f => f.severity === 'critical')
                  ? 'bg-red-200 text-red-800'
                  : 'bg-signal-200 text-signal-800'
              }`}>
                {resolved.redFlags.length}
              </span>
            )}
          </div>
          {resolved.redFlags.length === 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              No red flags detected.
            </div>
          )}
          <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
            {resolved.redFlags.map((flag, index) => {
              const isCritical = flag.severity === 'critical'
              return (
                <div
                  key={`${flag.label}-${index}`}
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    isCritical
                      ? 'border-red-400 bg-red-50 animate-pulse'
                      : 'border-signal-200 bg-signal-100'
                  }`}
                >
                  <div className={`flex items-center gap-2 font-semibold ${
                    isCritical ? 'text-red-700' : 'text-signal-800'
                  }`}>
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {flag.label}
                    {flag.auto_stop && (
                      <span className="ml-auto rounded-full bg-red-200 px-2 py-0.5 text-[10px] font-semibold text-red-800">
                        AUTO-STOP
                      </span>
                    )}
                  </div>
                  {flag.detail && (
                    <p className={`mt-1 text-xs ${isCritical ? 'text-red-600' : 'text-signal-800'}`}>
                      {flag.detail}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    {flag.source && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        flag.source === 'interviewer'
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-ink-100 text-ink-600'
                      }`}>
                        {flag.source === 'interviewer' ? 'Interviewer' : 'System'}
                      </span>
                    )}
                    {flag.created_at && (
                      <span className="text-[10px] text-ink-400">
                        {new Date(flag.created_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">
            TruthLog Evidence
          </p>
          {resolved.truthLog.length === 0 && (
            <div className="rounded-2xl bg-ink-50 px-4 py-3 text-sm text-ink-500">
              Evidence quotes will appear after scoring.
            </div>
          )}
          {resolved.truthLog.map((entry, index) => (
            <div
              key={`${entry.dimension}-${index}`}
              className="rounded-2xl border border-ink-100 bg-white px-4 py-3 text-sm"
            >
              <div className="text-xs font-semibold text-ink-500">{entry.dimension}</div>
              <p className="mt-2 text-ink-800">"{entry.quote}"</p>
              {entry.line !== undefined && entry.line !== null && (
                <p className="mt-1 text-xs text-ink-400">Line {entry.line}</p>
              )}
            </div>
          ))}
        </div>

        {resolved.followups.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">
              Suggested Follow-ups
            </p>
            {resolved.followups.map((q, i) => (
              <div key={i} className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                {q}
              </div>
            ))}
          </div>
        )}

      </CardContent>
    </Card>
  );
}
