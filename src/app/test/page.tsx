"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
  const router = useRouter()
  const [candidateName, setCandidateName] = useState('Test Megha')
  const [selectedRole, setSelectedRole] = useState(ROLES[0])
  const [difficulty, setDifficulty] = useState(3)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createSession = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        throw new Error(data.error || "Failed to create session")
      }

      router.push(`/candidate/${data.session.id}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const difficultyLabel =
    difficulty === 1 ? 'Easy' :
    difficulty === 2 ? 'Mild' :
    difficulty === 3 ? 'Moderate' :
    difficulty === 4 ? 'Hard' : 'Adversarial'

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Create Test Session</CardTitle>
            <CardDescription>
              Internal launcher for local testing. On success, candidate route opens immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="candidateName">Candidate Name</Label>
              <Input id="candidateName" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>
                Role
                <span className="ml-2 text-xs text-muted-foreground">
                  (Track: {TRACK_NAMES[selectedRole.track]} | Level: {selectedRole.level})
                </span>
              </Label>
              <Select
                value={selectedRole.label}
                onValueChange={(value) => {
                  const selected = ROLES.find(r => r.label === value)
                  if (selected) setSelectedRole(selected)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRACK_NAMES).map(([trackKey, trackName]) => {
                    const rolesInTrack = ROLES.filter(r => r.track === trackKey)
                    if (rolesInTrack.length === 0) return null
                    return (
                      <SelectGroup key={trackKey}>
                        <SelectLabel>{trackName}</SelectLabel>
                        {rolesInTrack.map(r => (
                          <SelectItem key={r.label} value={r.label}>
                            {r.label} ({r.level})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Difficulty Level
                <span className="ml-2 text-xs text-muted-foreground">
                  ({difficulty}/5 — {difficultyLabel})
                </span>
              </Label>
              <input
                type="range"
                min={1}
                max={5}
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Easy</span>
                <span>Moderate</span>
                <span>Adversarial</span>
              </div>
            </div>

            <Button onClick={createSession} disabled={loading || !candidateName || !selectedRole} className="w-full">
              {loading ? <Loader2 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              {loading ? "Creating session..." : "Create & Open Candidate View"}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Session creation failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
