"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function TestPage() {
  const router = useRouter()
  const [candidateName, setCandidateName] = useState("Jane Doe")
  const [role, setRole] = useState("Account Executive")
  const [level, setLevel] = useState("mid")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createSession = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_name: candidateName, role, level })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to create session")
      }

      // Fix redirect reliability: direct router navigation with no timeout
      router.push(`/candidate/${data.session.id}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

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
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="mid">Mid</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={createSession} disabled={loading || !candidateName || !role} className="w-full">
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
