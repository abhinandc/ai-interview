# AI Interview Live Assessment Platform - Main Requirements

## 1) Product Goal

Build a high-quality, live, candidate-facing assessment platform that evaluates practical AI proficiency under time constraints while giving employers evidence-backed performance insight.

The system has two sides:

- Candidate side: feature-rich, fast, clear, and confidence-building during live rounds.
- Employer/Admin side: high-fidelity logs, AI usage analytics, prompt-quality scoring, gating decisions, and operational controls.

---

## 2) Roles and Access Model (Single Company Tenant)

Deployment model:

- One company tenant.
- Many internal users with different roles.
- Many candidate records.

Roles:

- `candidate`: can access only their active live session and generated artifacts.
- `interviewer` (hiring manager, panelist): can run and monitor assigned sessions.
- `admin`: full platform controls (model registry, policy config, audit access).

Data authorization:

- Supabase RLS must be enforced on all core tables.
- Access must be role-scoped and session-scoped.
- Candidates cannot view interviewer-only evaluations or internal flags.

---

## 3) Candidate Login and Session Entry (Required Flow)

Entry point requirement:

- Candidate joins Google Meet.
- Hiring manager greets candidate and clicks `Send Link` in interviewer console.
- `Send Link` triggers a Supabase function.

Supabase function behavior:

- Look up candidate identity and interview context from existing Supabase records.
- Generate one-time magic link for the candidate.
- Link is short-lived and single-use.
- Link opens directly into the active live assessment session.

Constraints:

- No standalone candidate account creation during the interview.
- Magic-link flow must be fast (< 3 seconds target from click to send).
- Re-issue support if original link expires.

Audit:

- Log who clicked `Send Link`, when, and for which candidate/session.
- Log magic-link issuance, use, expiration, and reissue.

---

## 4) Live Session UX

### 4.1 Candidate Experience (Shared Screen)

Layout:

- Center canvas is the primary assessment workspace by round.
- Right sidebar is always-on `AI Sidekick` (never hidden/disabled by default).

Center canvas requirements:

- Clear step-by-step flow per round.
- Visible task timer.
- Input surfaces: text editor, code editor, email composer, multiple-choice, structured forms.
- Clear `Submit` and `Next` controls.
- Visible status: draft saved, submitted, next round queued.
- Candidate sees that responses are evaluated during session.

### 4.2 AI Sidekick Experience (Always Enabled)

UI/interaction requirements:

- Must match ChatGPT-class interaction patterns in responsiveness and clarity.
- Implement with shadcn-based components and production-grade chat UX.
- Support rich in-chat formatting:
  - thinking/reasoning mode label states (system-controlled display rules)
  - tool-use display cards
  - code blocks, tables, expandable references
  - per-message metadata (model, latency, tools invoked)

Behavior requirements:

- Always available to candidate across rounds.
- All prompts/responses/tool calls are logged as artifacts.
- Candidate actions must remain distinguishable from Sidekick output.

---

## 5) Interviewer Experience (Not Shared to Candidate)

Interviewer console layout:

- Left panel: live transcript + candidate action log.
- Right panel: Gate Panel.

Gate Panel must include:

- overall score (0-100)
- dimension scores
- red flags
- confidence meter
- recommended follow-ups
- one-click decision: `Proceed` / `Caution` / `Stop`

Live control actions:

- `Escalate Difficulty`
- `Inject Curveball`
- `Switch Persona`
- `End Round`

---

## 6) Admin Controls (AI Sidekick + Policy + Model Registry)

Admins must configure Sidekick centrally with versioned policies.

### 6.1 Model Registry

Requirements:

- Support multiple provider models.
- Use an OpenAI-compatible, provider-agnostic adapter contract for model integrations.
- Per-model metadata:
  - provider
  - model name
  - capabilities (text/tool/vision if relevant)
  - cost profile
  - latency profile
  - active/inactive

Runtime controls:

- Role-based allowed model list.
- Round-specific model override.
- Fallback model chain.

### 6.2 Usage Policies by Role Family

Engineering:

- Assistant use allowed.
- Candidate must justify architectural/debug decisions.

Sales:

- Limited assistant use.
- Assist with summarization/analysis.
- Disallow direct "write my pitch for me" outcomes where final pitch ownership is absent.

Marketing:

- Brainstorming allowed.
- Final plan must be candidate-owned and editable.

Implementation/Customer Outcomes:

- Structure and clarity support allowed.
- Final client-facing response authored by candidate.

Policy enforcement:

- Prompt/response classification against policy.
- Violations produce flags and evidence snippets.
- Interviewer sees policy events in near real time.

---

## 7) Role-Specific Live Round Designs

### A) Sales Roles (BDR/AE)

Round 1: Live persona sell (10-12 minutes)

- Persona via ElevenLabs web call or in-app voice: "Prospect with objections"
- Candidate objective: qualify + pitch + handle 3 objections
- Hard constraints:
  - no overpromising
  - at least 5 discovery questions
  - quantify value at least once
- Scoring:
  - discovery quality
  - clarity and confidence
  - objection handling
  - honesty about constraints
  - closing for next step
- Auto curveballs:
  - budget cut
  - security concern
  - timeline mismatch

Round 2: Negotiation via email thread (12-15 minutes)

- Candidate receives concession + timeline-demand email
- Candidate drafts response 1
- System injects harder objection
- Candidate drafts response 2
- Scoring:
  - negotiation posture
  - professionalism
  - handling rejection
  - protecting margin and scope
  - realistic commitments

Optional Round 3: Follow-up discipline (5 minutes)

- Candidate writes internal handoff note (learnings, next steps, risks)

### B) Agentic / Full-Stack Engineering

Round 1: Build + test rotating feature (15-20 minutes)

- Inputs:
  - feature request
  - stack
  - constraints and acceptance criteria
- Candidate can use Sidekick (logged)
- Required outputs:
  - design outline
  - implementation skeleton
  - test plan + at least 2 tests
  - verification checklist
- Scoring:
  - decomposition
  - correctness instincts
  - verification discipline
  - security/performance awareness
  - incremental shipping strategy

Round 2: Code review trap + cascading failure (15-20 minutes)

- Provide AI-generated code with hidden issues:
  - auth bypass
  - race condition
  - off-by-one corruption
  - missing error handling
  - injection risk
- Candidate must:
  - identify issues
  - propose fixes
  - predict downstream impact
- Inject cascade:
  - fix introduces another bug
  - show failing test/log
- Scoring:
  - debugging approach
  - prioritization
  - reasoning depth
  - confidence calibration

Optional Round 3: Systems thinking (5-8 minutes)

- Prompt: "How would you evaluate this agent feature in production?"
- Expected: metrics, rollback, monitoring, regression plan

### C) Marketing Roles

Round 1: Campaign design under constraints (12-15 minutes)

- Scenario: new capability, low credibility, need qualified demos
- Output:
  - ICP definition
  - message pillars
  - 2-week experiment plan
  - channels and cadence
  - metrics
- Scoring:
  - positioning clarity
  - experiment discipline
  - measurability
  - proof strategy

Round 2: Content + distribution workflow (10-12 minutes)

- Design AI-assisted pipeline:
  - research -> outline -> draft -> QA -> distribution -> learnings
- Must include quality and brand consistency checks
- Scoring:
  - systems thinking
  - quality gates
  - scalable signal-over-noise output

Optional: Crisis scenario

- Backlash response and containment plan

### D) Implementation / Customer Outcomes

Round 1: Customer anxiety email (8-10 minutes)

- Candidate writes calm, clear, accountable response
- Must restate facts, next steps, timeline, no legal overreach
- Scoring:
  - tone and clarity
  - de-escalation
  - commitment accuracy
  - next-step structure

Round 2: Technical integration + internal alignment (15-18 minutes)

- Customer asks API/integration questions
- Internal agents in chat:
  - pre-sales engineer
  - product owner
- Candidate must:
  - ask internal clarifying questions
  - extract key details
  - respond accurately to customer
  - set expectations/timelines
- Scoring:
  - internal coordination
  - technical comprehension
  - communication quality
  - risk identification

Optional Round 3: Go-live gate design (6-8 minutes)

- Candidate produces go-live checklist and acceptance criteria

### E) Data Steward / Knowledge Roles

Round 1: Taxonomy + labeling plan (12-15 minutes)

- Input: messy document-set description
- Output: taxonomy, labeling rules, QA sampling plan
- Scoring: precision, practicality, auditability

Round 2: Retrieval failure diagnosis (10-12 minutes)

- Show 3 poor AI outputs + retrieved sources
- Candidate diagnoses root causes:
  - stale docs
  - chunking issues
  - missing sources
  - ambiguity
- Candidate proposes improvements and evaluation plan

### F) People Ops (Junior)

Round 1: Sensitive employee query response (8-10 minutes)

- Candidate drafts response with discretion and clarity

Round 2: Onboarding checklist + cadence (10-12 minutes)

- Output: structured checklist, timelines, follow-ups

---

## 8) Scoring and Gating

Standard dimensions:

- Role Depth (0-30)
- Reasoning and Problem Decomposition (0-20)
- Verification and Evidence Discipline (0-20)
- Communication Clarity (0-15)
- Reliability and Ownership (0-15)

Total: 100

Decision rules:

- `Proceed`: >= 75 and no major red flags
- `Caution`: 65-74 or one weak critical dimension
- `Stop`: < 65 or major red flag

Major red flags (auto-stop):

- Unsafe data handling advice (PII leakage, secret sharing)
- Overconfident claims without verification plan
- Sales: overpromising or invented terms
- Engineering: no testing mindset or ignores security basics
- Customer roles: conflict escalation or commitments outside authority

TruthLog evidence requirement:

Every scored item stores:

- score
- rubric clause
- 1-3 evidence snippets
- confidence

No evidence means invalid score.

---

## 9) AI Skill Measurement (Required for Employer Dashboard)

Beyond final score, system must measure candidate AI fluency:

- prompt clarity score
- prompt iteration quality
- context packaging quality
- tool selection quality
- hallucination detection/recovery behavior
- verification rigor after AI suggestions
- acceptance vs edit ratio of AI output
- time-to-first-correct outcome with/without AI assist
- independence score (candidate-owned final output quality)

All AI skill metrics must be drill-downable to timestamped evidence.

---

## 10) Employer and Admin Dashboard Requirements

Dashboard tiers:

- Live dashboard (during interview)
- Post-session deep dive
- Cross-candidate benchmarking

Required views:

- Session status timeline
- Round-by-round breakdown
- AI usage analytics
- Prompt style taxonomy
- Red flag timeline
- Confidence trend
- Decision recommendation with evidence

Drilldown examples:

- per-prompt latency, quality impact, and tool outcomes
- where candidate corrected AI vs copied AI
- mistakes recovered vs unrecovered
- rubric score variance by evaluator confidence

Export/share:

- exportable report with links to artifacts
- interviewer notes and recommendation pack

---

## 11) Reliability, Performance, and Live Assessment Safety

Live reliability requirements:

- Autosave every 2-5 seconds for typed candidate content.
- Reconnect flow resumes timer and context safely.
- Timer integrity checks for drift and reconnect abuse.
- Graceful degradation when model/voice/tool APIs fail.
- Round state must be recoverable after refresh.

Integrity signals:

- candidate focus/interaction events where policy allows
- suspicious behavior event hooks for interviewer review
- all integrity signals are advisory, not auto-disqualifying

---

## 12) Conductor and Pi Contracts

### 12.1 Pi first-call output

Pi provides structured signals for Conductor:

- candidate summary (skills, years, credibility)
- role-fit hypothesis
- risk list (gaps/inconsistencies)
- AI literacy indicators
- recommended track and difficulty
- follow-up question shortlist
- score estimate aligned to live dimensions

### 12.2 Conductor pre-session contract

Conductor generates `interview_scope_package` JSON:

- `track`, `level_band`, `location_rules`
- `rounds[]`:
  - `round_name`
  - `duration_minutes`
  - `simulation_type`
  - `prompt_payload`
  - `rubric_id`
  - `red_flags`
  - `curveballs[]`
  - `elevenlabs_agents[]`
- `scoring_thresholds`
- `followup_bank[]`
- `abort_script`

Contract versioning:

- include `contract_version`
- persist generated package for reproducibility

---

## 13) Rippling Writeback

On completion, write back:

- overall score + dimension scores
- final gate (`Proceed/Caution/Stop`)
- key evidence snippets
- artifact links (transcript/audio/email/code)
- interviewer notes
- next-stage move suggestion

Automation rule:

- auto-stage movement only on `Proceed`
- manual override must always be available

---

## 14) Security, Privacy, and Audit

Mandatory controls:

- Supabase RLS on every data path.
- Row-level ownership and role checks for artifacts and scores.
- Audit logging for admin policy/model changes.
- Audit logging for interviewer high-impact actions (end round, stop, escalate).
- Prompt/response logs tagged for sensitive data review.

Data lifecycle (must be configured per company policy):

- retention window by artifact type
- controlled deletion workflow
- access logs for transcript/audio/code artifacts

---

## 15) Acceptance Criteria (MVP to Launch-Ready)

Launch blocker checklist:

- Candidate can enter only via Google Meet-triggered one-time magic link.
- AI Sidekick is always enabled and delivered as a ChatGPT-class right-sidebar assistant.
- Center canvas supports all required round input types and timers.
- Interviewer gate panel provides live recommendation with evidence.
- Admin can register multiple models and apply role/round policies.
- AI usage is fully logged and measurable for prompt/tool quality.
- Dashboard supports live + deep-dive views with drilldowns.
- Supabase RLS correctly isolates candidate/interviewer/admin access.
- Session survives refresh/reconnect without data loss.
- Final report and Rippling writeback complete with evidence links.

---

## 16) Implementation Specifications

Supporting technical specifications:

- Supabase schema and RLS implementation details: `/Users/abhinandchincholi/ai-interview/supabase-schema-rls-spec.md`
- AI metrics and analytics event contract: `/Users/abhinandchincholi/ai-interview/ai-metrics-event-taxonomy.md`
