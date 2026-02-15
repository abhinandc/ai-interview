"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Linkedin, Youtube, Github, Twitter, Sparkles } from "lucide-react"
import { AnimatedQuoteBlock } from "@/components/uitripled/animated-quote-block"
import { ConferenceTicket } from "@/components/uitripled/conference-ticket-shadcnui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type QuoteRow = { id: string; quote: string; author?: string }
type Announcement = { id: string; title: string; detail?: string; cta_label?: string; cta_href?: string }

export default function LogoutPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0)

  useEffect(() => {
    const load = async () => {
      const [quotesResponse, announcementsResponse] = await Promise.all([
        fetch("/api/experience/quotes"),
        fetch("/api/experience/announcements")
      ])

      if (quotesResponse.ok) {
        const data = await quotesResponse.json()
        setQuotes(data.quotes || [])
      }

      if (announcementsResponse.ok) {
        const data = await announcementsResponse.json()
        setAnnouncements(data.announcements || [])
      }
    }

    void load()
  }, [])

  useEffect(() => {
    if (quotes.length <= 1) return
    const interval = setInterval(() => {
      setActiveQuoteIndex((current) => (current + 1) % quotes.length)
    }, 7000)

    return () => clearInterval(interval)
  }, [quotes.length])

  const activeQuote = useMemo(() => quotes[activeQuoteIndex], [quotes, activeQuoteIndex])

  return (
    <main className="surface-grid min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="space-y-2 text-center">
          <Badge variant="outline" className="mx-auto border-primary/40 bg-primary/10">Session Complete</Badge>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Thank you for interviewing with OneOrigin.</h1>
          <p className="text-muted-foreground">Here is what is next in our AI-native journey.</p>
        </header>

        <Card className="border-primary/25 bg-card/85 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-5 w-5 text-primary" />
              Rotating Founder Quote
            </CardTitle>
            <CardDescription>Auto-rotated from the quote feed.</CardDescription>
          </CardHeader>
          <CardContent>
            {activeQuote ? (
              <div className="flex justify-center">
                <AnimatedQuoteBlock quote={activeQuote.quote} author={activeQuote.author || "OneOrigin"} typingSpeed={28} />
              </div>
            ) : (
              <div className="rounded-xl border bg-muted/20 p-6 text-sm text-muted-foreground">
                No quote has been configured yet. Add active rows to <code>experience_quotes</code>.
              </div>
            )}
          </CardContent>
        </Card>

        <section className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Next Announcements</CardTitle>
              <CardDescription>Pulled from the announcements feed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcements.map((item) => (
                <div key={item.id} className="rounded-lg border bg-muted/20 p-4">
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                  <div className="mt-3">
                    <Button asChild size="sm" variant="outline">
                      <Link href={item.cta_href || "/"}>
                        {item.cta_label || "Learn More"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}

              {announcements.length === 0 && (
                <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                  No announcements are active right now. Add rows to <code>experience_announcements</code>.
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild>
                  <Link href="/about-oneorigin">About OneOrigin</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <ConferenceTicket />
          </Card>
        </section>

        <footer className="rounded-xl border bg-card/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">OneOrigin Inc.</p>
              <p className="text-xs text-muted-foreground">Follow us across our channels</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <a href="https://www.linkedin.com" target="_blank" rel="noreferrer"><Linkedin className="h-4 w-4" /></a>
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a href="https://x.com" target="_blank" rel="noreferrer"><Twitter className="h-4 w-4" /></a>
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a href="https://www.youtube.com" target="_blank" rel="noreferrer"><Youtube className="h-4 w-4" /></a>
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a href="https://github.com" target="_blank" rel="noreferrer"><Github className="h-4 w-4" /></a>
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/about-oneorigin">About</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin">Admin</Link>
            </Button>
            <Button asChild variant="outline">
              <a href="https://www.oneorigin.us/" target="_blank" rel="noreferrer">
                Website
              </a>
            </Button>
          </div>
        </footer>
      </div>
    </main>
  )
}
