'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function TestVoicePage() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createVoiceSession = async () => {
    setCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_name: 'Test Candidate',
          role: 'Sales Rep',
          level: 'mid'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create session')
      }

      const data = await response.json()

      // Navigate to candidate view
      router.push(`/candidate/${data.session.id}`)

    } catch (err: any) {
      setError(err.message)
      setCreating(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-skywash-50 to-white p-6">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-ink-100 bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ink-900">Voice Realtime Test</h1>
          <p className="mt-2 text-sm text-ink-600">
            Create a test session with a voice-realtime round
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={createVoiceSession}
            disabled={creating}
            className="w-full"
            size="lg"
          >
            {creating ? 'Creating Session...' : 'Create Test Session'}
          </Button>

          {error && (
            <div className="rounded-lg bg-signal-50 px-4 py-3">
              <p className="text-sm text-signal-800">{error}</p>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-skywash-50 px-4 py-3 text-sm text-ink-700">
          <p className="font-semibold">This will create:</p>
          <ul className="mt-2 space-y-1 text-xs">
            <li>• Test candidate profile</li>
            <li>• Interview session with voice-realtime round</li>
            <li>• Redirect to candidate view</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
