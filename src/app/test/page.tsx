'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

// Role definitions with track and level auto-mapped
const ROLES = [
  // Sales
  { label: 'AI Solutions Account Executive', track: 'sales', level: 'mid' },
  { label: 'Sales Development Representative (SDR/BDR)', track: 'sales', level: 'junior' },
  // Agentic / Full-Stack Engineering
  { label: 'AI Solutions Engineer — Agentic', track: 'agentic_eng', level: 'mid' },
  { label: 'AI Research Intern — Agentic Systems', track: 'agentic_eng', level: 'junior' },
  { label: 'Full-Stack Engineer', track: 'fullstack', level: 'mid' },
  { label: 'Full-Stack Engineer — Growth Automation', track: 'fullstack', level: 'mid' },
  // Marketing
  { label: 'Growth Marketing Manager — AI Products', track: 'marketing', level: 'mid' },
  { label: 'Performance Marketing Specialist', track: 'marketing', level: 'mid' },
  { label: 'Brand Strategist', track: 'marketing', level: 'senior' },
  { label: 'Campaign Ops Lead', track: 'marketing', level: 'senior' },
  // Implementation / Customer Outcomes
  { label: 'AI Solutions Consultant (Techno-Functional Pre-Sales)', track: 'implementation', level: 'mid' },
  { label: 'Client Delivery Lead — AI Enablement', track: 'implementation', level: 'senior' },
  { label: 'Customer Outcomes Manager — AI Launch', track: 'implementation', level: 'mid' },
  // Data Steward
  { label: 'Data Steward — Knowledge & Taxonomy', track: 'data_steward', level: 'mid' },
  { label: 'Data Steward — Retrieval QA', track: 'data_steward', level: 'mid' },
  // People Ops
  { label: 'People Ops Coordinator', track: 'HR', level: 'junior' },
]

// Track display names
const TRACK_NAMES: Record<string, string> = {
  sales: 'Sales',
  agentic_eng: 'Agentic Engineering',
  fullstack: 'Full-Stack Engineering',
  marketing: 'Marketing',
  implementation: 'Implementation',
  data_steward: 'Data Steward',
  HR: 'People Ops',
  security: 'Security'
}

export default function TestPage() {
  const [candidateName, setCandidateName] = useState('Test Megha')
  const [selectedRole, setSelectedRole] = useState(ROLES[0])
  const [difficulty, setDifficulty] = useState(3)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const createSession = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_name: candidateName,
          role: selectedRole.label,
          level: selectedRole.level,
          track: selectedRole.track,
          difficulty
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create session')
      }

      setResult(data)

      // Auto-navigate after 2 seconds
      setTimeout(() => {
        window.location.href = `/candidate/${data.session.id}`
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold mb-4">Create Test Session</h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Candidate Name</label>
            <Input
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Test Megha"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">
              Role
              <span className="ml-2 text-xs text-ink-500">
                (Track: {TRACK_NAMES[selectedRole.track]} | Level: {selectedRole.level})
              </span>
            </label>
            <select
              value={selectedRole.label}
              onChange={(e) => {
                const selected = ROLES.find(r => r.label === e.target.value)
                if (selected) setSelectedRole(selected)
              }}
              className="w-full rounded-2xl border border-ink-100 bg-white px-4 py-2 text-sm text-ink-900 focus:border-skywash-500 focus:outline-none focus:ring-2 focus:ring-skywash-200"
            >
              {Object.entries(TRACK_NAMES).map(([trackKey, trackName]) => {
                const rolesInTrack = ROLES.filter(r => r.track === trackKey)
                if (rolesInTrack.length === 0) return null
                return (
                  <optgroup key={trackKey} label={trackName}>
                    {rolesInTrack.map(r => (
                      <option key={r.label} value={r.label}>
                        {r.label} ({r.level})
                      </option>
                    ))}
                  </optgroup>
                )
              })}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">
              Voice Interview Intensity (Sales track only)
              <span className="ml-2 text-xs text-ink-500">
                ({difficulty}/5 - {difficulty === 1 ? '🟢 Easy' : difficulty === 2 ? '🟡 Mild' : difficulty === 3 ? '🟠 Moderate' : difficulty === 4 ? '🔴 Hard' : '⚫ Adversarial'})
              </span>
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={difficulty}
              onChange={(e) => setDifficulty(parseInt(e.target.value))}
              className="w-full accent-skywash-500"
            />
            <div className="flex justify-between text-xs text-ink-500 mt-1">
              <span>Easy</span>
              <span>Moderate</span>
              <span>Adversarial</span>
            </div>
            <p className="text-xs text-ink-500 mt-1">
              Controls objection difficulty and persona hostility in voice rounds
            </p>
          </div>

          <Button
            onClick={createSession}
            disabled={loading || !candidateName || !selectedRole}
            className="w-full"
          >
            {loading ? 'Creating...' : 'Create Session'}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm space-y-2">
              <p><strong>✅ Session Created!</strong></p>
              <p className="text-xs">Session ID: <code>{result.session.id}</code></p>
              <p className="text-xs">Redirecting to candidate view...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
