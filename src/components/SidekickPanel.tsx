'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSession } from '@/contexts/SessionContext'
import { MarkdownContent } from '@/components/ui/markdown'
import { Textarea } from '@/components/ui/textarea'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STARTER_MESSAGE: Message = {
  role: 'assistant',
  content: 'I can help outline discovery questions, summarize objections, or flag overpromising risks. What would you like guidance on?'
}

export function SidekickPanel({ role }: { role: string }) {
  const { session, currentRound } = useSession()
  const [messages, setMessages] = useState<Message[]>([STARTER_MESSAGE])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [queriesRemaining, setQueriesRemaining] = useState(6)
  const [isListening, setIsListening] = useState(false)
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel()
      }
    }
  }, [])

  const toggleListening = () => {
    if (typeof window === 'undefined') return
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Voice input is not supported in this browser.' }
      ])
      return
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || ''
      setDraft((prev) => (prev ? `${prev} ${transcript}` : transcript))
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    setIsListening(true)
    recognition.start()
  }

  const sendMessage = async () => {
    if (!draft.trim() || loading) return

    const userMessage: Message = { role: 'user', content: draft }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setDraft('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session?.id,
          round_number: currentRound?.round_number,
          query: draft,
          history: nextMessages
        })
      })

      const data = await response.json()

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${data.error}` }
        ])
      } else if (data.limit_reached) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.response }
        ])
        setQueriesRemaining(0)
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.response }
        ])
        setQueriesRemaining(data.remaining_queries)
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <Card className="bg-white/90 h-full overflow-hidden flex flex-col">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-skywash-700" />
            <h3 className="text-base font-semibold">Sidekick</h3>
          </div>
          <Badge tone="signal">{queriesRemaining} left</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  message.role === 'assistant'
                    ? 'bg-ink-50 text-ink-800'
                    : 'bg-ink-900 text-white'
                }`}
              >
                {message.role === 'assistant' ? (
                  <MarkdownContent content={message.content} />
                ) : (
                  <div>{message.content}</div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl bg-ink-50 px-4 py-3 text-sm text-ink-600">
                Thinking...
              </div>
            </div>
          )}
          <div ref={scrollAnchorRef} />
        </div>
        <div className="shrink-0 rounded-2xl border border-ink-100 bg-white px-3 py-3">
          <Textarea
            rows={3}
            placeholder="Ask the Sidekick for outline guidance..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || queriesRemaining === 0}
            className="border-0 p-0 focus-visible:ring-0"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-ink-500">
            <span>Enter to send • Shift+Enter for new line</span>
            <div className="flex items-center gap-2">
              <Button
                variant={isListening ? 'secondary' : 'outline'}
                size="sm"
                onClick={toggleListening}
                disabled={loading || queriesRemaining === 0}
                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              >
                {isListening ? (
                  <>
                    <Mic className="mr-2 h-4 w-4 animate-pulse" />
                    Listening
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Voice
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={sendMessage}
                disabled={loading || queriesRemaining === 0 || !draft.trim()}
              >
                <Send className="mr-2 h-4 w-4" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
