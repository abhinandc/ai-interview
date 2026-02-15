"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Bot, Plus, ShieldCheck, Activity, ArrowLeft, Eye, EyeOff, Lock } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { supabase } from "@/lib/supabase/client"

interface ModelRow {
  id: string
  model_key: string
  provider: string
  purpose: string
  edgeadmin_endpoint?: string | null
  api_key_last4?: string | null
  status?: string
}

interface MetricsPayload {
  totals: {
    sessions: number
    live: number
    completed: number
    aborted: number
    avg_overall_score: number
    avg_confidence: number
    sidekick_queries: number
    sidekick_tokens: number
    avg_prompt_length: number
  }
  top_event_types: Array<{ event_type: string; count: number }>
  recent_events: Array<{ id: string; event_type: string; created_at: string; payload: any; session_id: string }>
}

export default function AdminPage() {
  const [models, setModels] = useState<ModelRow[]>([])
  const [metrics, setMetrics] = useState<MetricsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [authEmail, setAuthEmail] = useState("")
  const [authUserEmail, setAuthUserEmail] = useState<string | null>(null)
  const [authRole, setAuthRole] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authInfo, setAuthInfo] = useState<string | null>(null)
  const [authSending, setAuthSending] = useState(false)

  const [provider, setProvider] = useState("openai")
  const [modelKey, setModelKey] = useState("gpt-4o")
  const [purpose, setPurpose] = useState("candidate_sidekick")
  const [apiKey, setApiKey] = useState("")
  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const [endpoint, setEndpoint] = useState("")
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const authedFetch = async (url: string, init?: RequestInit) => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    const headers = new Headers(init?.headers || {})
    if (token) headers.set("Authorization", `Bearer ${token}`)
    return fetch(url, { ...init, headers })
  }

  const resolveRole = async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user || null
    const userEmail = user?.email || null
    setAuthUserEmail(userEmail)
    if (!user) {
      setAuthRole(null)
      setAuthReady(true)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) {
      setAuthRole(null)
      setAuthReady(true)
      return
    }

    setAuthRole((profile as any)?.role || null)
    setAuthReady(true)
  }

  const loadData = async () => {
    setLoading(true)
    const [modelsResponse, metricsResponse] = await Promise.all([
      authedFetch("/api/admin/models"),
      authedFetch("/api/admin/metrics")
    ])

    const modelsJson = await modelsResponse.json()
    const metricsJson = await metricsResponse.json()

    setModels(modelsJson.models || [])
    setMetrics(metricsJson || null)
    setLoading(false)
  }

  useEffect(() => {
    void resolveRole()

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      void resolveRole()
    })

    return () => {
      subscription.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!authReady) return
    if (authRole === "admin") {
      void loadData()
    } else {
      setLoading(false)
    }
  }, [authReady, authRole])

  const addModel = async () => {
    setSubmitting(true)
    const response = await authedFetch("/api/admin/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        model_key: modelKey,
        purpose,
        api_key: apiKey,
        edgeadmin_endpoint: endpoint || null
      })
    })

    if (response.ok) {
      setModelKey("gpt-4o")
      setApiKey("")
      setEndpoint("")
      setAdvancedOpen(false)
      await loadData()
    }
    setSubmitting(false)
  }

  const healthCards = useMemo(() => {
    if (!metrics) return []
    return [
      { label: "Total sessions", value: metrics.totals.sessions, icon: Activity },
      { label: "Live sessions", value: metrics.totals.live, icon: ShieldCheck },
      { label: "AI sidekick queries", value: metrics.totals.sidekick_queries, icon: Bot },
      { label: "Avg overall score", value: metrics.totals.avg_overall_score, icon: Activity }
    ]
  }, [metrics])

  const signInWithMagicLink = async () => {
    if (!authEmail.trim() || authSending) return
    setAuthSending(true)
    setAuthError(null)
    setAuthInfo(null)
    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/admin` : undefined
      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail.trim(),
        options: redirectTo ? { emailRedirectTo: redirectTo } : undefined
      })
      if (error) throw error
      setAuthInfo("Magic link sent. Open it to finish signing in.")
    } catch (err: any) {
      setAuthError(err?.message || "Unable to send magic link.")
    } finally {
      setAuthSending(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setAuthUserEmail(null)
    setAuthRole(null)
  }

  if (!authReady) {
    return (
      <main className="surface-grid flex min-h-screen items-center justify-center px-4 py-10">
        <div className="text-sm text-muted-foreground">Loading admin access...</div>
      </main>
    )
  }

  if (!authUserEmail) {
    return (
      <main className="surface-grid min-h-screen px-4 py-10 md:px-8">
        <div className="mx-auto w-full max-w-xl space-y-6">
          <header className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
              <h1 className="text-3xl font-semibold">Sign in to configure Astra</h1>
            </div>
            <ThemeToggle />
          </header>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Admin access required
              </CardTitle>
              <CardDescription>Sign in with a secure magic link. Your `profiles.role` must be `admin`.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="admin@oneorigin.us" />
              </div>
              <Button className="w-full" onClick={signInWithMagicLink} disabled={authSending || !authEmail.trim()}>
                {authSending ? "Sending..." : "Send Magic Link"}
              </Button>
              {authInfo && <p className="text-sm text-muted-foreground">{authInfo}</p>}
              {authError && <p className="text-sm text-destructive">{authError}</p>}
              <div className="rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground leading-6">
                If your account is new, a `profiles` row is created automatically. Update `profiles.role` to `admin` for this email.
              </div>
              <Button variant="outline" asChild className="w-full">
                <Link href="/interviewer">Back to interviewer</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (authRole !== "admin") {
    return (
      <main className="surface-grid min-h-screen px-4 py-10 md:px-8">
        <div className="mx-auto w-full max-w-xl space-y-6">
          <header className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
              <h1 className="text-3xl font-semibold">Access denied</h1>
            </div>
            <ThemeToggle />
          </header>
          <Card>
            <CardHeader>
              <CardTitle>Forbidden</CardTitle>
              <CardDescription>
                Signed in as <span className="font-medium text-foreground">{authUserEmail}</span>. Role:{" "}
                <span className="font-medium text-foreground">{authRole || "unknown"}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This page is gated to admins. Update your `profiles.role` to `admin`.
              </p>
              <Button onClick={signOut} className="w-full">Sign out</Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/interviewer">Back to interviewer</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="surface-grid min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
            <h1 className="text-3xl font-semibold">AI Sidekick Configuration + Live Metrics</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/interviewer">
                <ArrowLeft className="h-4 w-4" />
                Interviewer
              </Link>
            </Button>
            <Button variant="outline" onClick={signOut}>
              Sign out
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {healthCards.map((card) => (
            <Card key={card.label}>
              <CardHeader className="pb-2">
                <CardDescription>{card.label}</CardDescription>
                <CardTitle className="text-2xl">{card.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </section>

        <Tabs defaultValue="models" className="space-y-4">
          <TabsList>
            <TabsTrigger value="models">Model Registry</TabsTrigger>
            <TabsTrigger value="events">Event Logs</TabsTrigger>
            <TabsTrigger value="metrics">Prompting Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="models">
            <div className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Configured Models</CardTitle>
                  <CardDescription>OpenAI-compatible multi-model registry for sidekick routing.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Provider</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading && (
                        <TableRow>
                          <TableCell colSpan={4}>Loading models...</TableCell>
                        </TableRow>
                      )}
                      {!loading && models.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4}>No models added yet.</TableCell>
                        </TableRow>
                      )}
                      {models.map((model) => (
                        <TableRow key={model.id}>
                          <TableCell>{model.provider}</TableCell>
                          <TableCell className="font-medium">{model.model_key}</TableCell>
                          <TableCell>{model.purpose}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={model.status === "active" ? "secondary" : "outline"}>{model.status}</Badge>
                              {model.api_key_last4 ? (
                                <span className="text-xs text-muted-foreground">key •••• {model.api_key_last4}</span>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Add Model</CardTitle>
                  <CardDescription>Add an OpenAI-compatible model. Hiring managers should only provide an API key.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Input value={provider} onChange={(event) => setProvider(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Model key</Label>
                    <Input value={modelKey} onChange={(event) => setModelKey(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Purpose</Label>
                    <Input value={purpose} onChange={(event) => setPurpose(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>API key</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={apiKey}
                        onChange={(event) => setApiKey(event.target.value)}
                        type={apiKeyVisible ? "text" : "password"}
                        placeholder="Paste provider API key"
                      />
                      <Button type="button" variant="outline" size="icon" onClick={() => setApiKeyVisible((prev) => !prev)}>
                        {apiKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Stored encrypted server-side. Used only for sidekick runtime calls.
                    </p>
                  </div>

                  <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                    <CollapsibleTrigger asChild>
                      <Button type="button" variant="ghost" className="w-full justify-between">
                        Advanced settings
                        <span className="text-xs text-muted-foreground">{advancedOpen ? "Hide" : "Show"}</span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2">
                      <Label>OpenAI-compatible endpoint (optional)</Label>
                      <Input
                        value={endpoint}
                        onChange={(event) => setEndpoint(event.target.value)}
                        placeholder="https://gateway.company.ai/v1"
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave blank to use the default provider endpoint.
                      </p>
                    </CollapsibleContent>
                  </Collapsible>

                  <Button onClick={addModel} disabled={submitting || !provider || !modelKey || !purpose || !apiKey} className="w-full">
                    <Plus className="h-4 w-4" />
                    {submitting ? "Saving..." : "Add Model"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Recent Live Events</CardTitle>
                <CardDescription>Detailed interviewer/candidate/AI activity timeline.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[480px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Session</TableHead>
                        <TableHead>Payload</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(metrics?.recent_events || []).map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(event.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>{event.event_type}</TableCell>
                          <TableCell className="font-mono text-xs">{event.session_id?.slice(0, 8)}</TableCell>
                          <TableCell className="max-w-[420px] truncate text-xs">
                            {JSON.stringify(event.payload || {})}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics">
            <Card>
              <CardHeader>
                <CardTitle>AI Prompting & Usage Metrics</CardTitle>
                <CardDescription>Session-level visibility into AI usage style and volume.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Sidekick tokens</p>
                  <p className="mt-2 text-2xl font-semibold">{metrics?.totals.sidekick_tokens || 0}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Avg prompt length</p>
                  <p className="mt-2 text-2xl font-semibold">{metrics?.totals.avg_prompt_length || 0}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Avg confidence</p>
                  <p className="mt-2 text-2xl font-semibold">{metrics?.totals.avg_confidence || 0}</p>
                </div>

                <div className="md:col-span-3 rounded-xl border p-4">
                  <p className="mb-3 text-sm font-medium">Top event types</p>
                  <div className="flex flex-wrap gap-2">
                    {(metrics?.top_event_types || []).map((item) => (
                      <Badge key={item.event_type} variant="outline">
                        {item.event_type}: {item.count}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
