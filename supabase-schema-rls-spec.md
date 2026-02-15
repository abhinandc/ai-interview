# Supabase Schema and RLS Specification

## 1) Scope

This document defines the production data model and row-level security model for the live assessment platform.

Goals:

- Enforce strict role-based access (`candidate`, `interviewer`, `admin`).
- Support Google Meet-triggered magic-link session entry.
- Preserve high-fidelity evidence for scoring, audit, and post-session analytics.
- Keep schema implementation-ready for Supabase Postgres and Edge Functions.

Assumptions:

- Single company tenant.
- Multiple internal users and candidates.
- Supabase Auth is the identity source.
- Supabase RLS is enabled for all business tables.

---

## 2) Core Enums

```sql
create type public.app_role as enum ('candidate', 'interviewer', 'admin');
create type public.session_status as enum ('scheduled', 'live', 'paused', 'completed', 'aborted');
create type public.round_status as enum ('queued', 'active', 'submitted', 'timed_out', 'closed');
create type public.gate_decision as enum ('proceed', 'caution', 'stop');
create type public.actor_type as enum ('candidate', 'interviewer', 'admin', 'assistant', 'system');
create type public.artifact_type as enum ('transcript', 'audio', 'email_thread', 'code', 'score_report', 'other');
```

---

## 3) Core Tables

### 3.1 Identity and Access

```sql
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id),
  role public.app_role not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 3.2 Candidate and Session Domain

```sql
create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  email citext not null,
  external_ref text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, email)
);

create table public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  candidate_id uuid not null references public.candidates(id),
  status public.session_status not null default 'scheduled',
  role_track text not null,
  level_band text not null,
  meet_link text,
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  added_at timestamptz not null default now(),
  unique (session_id, user_id)
);
```

### 3.3 Round Execution and Candidate Outputs

```sql
create table public.session_rounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  round_index int not null,
  round_name text not null,
  simulation_type text not null,
  rubric_id text not null,
  duration_minutes int not null,
  prompt_payload jsonb not null,
  curveballs jsonb not null default '[]'::jsonb,
  red_flags jsonb not null default '[]'::jsonb,
  status public.round_status not null default 'queued',
  opened_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (session_id, round_index)
);

create table public.round_submissions (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.session_rounds(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id),
  submission_version int not null default 1,
  input_type text not null,
  content jsonb not null,
  is_final boolean not null default false,
  submitted_at timestamptz not null default now()
);
```

### 3.4 Sidekick, Models, and Policy

```sql
create table public.sidekick_models (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  provider text not null,
  model_key text not null,
  display_name text not null,
  supports_tools boolean not null default false,
  supports_reasoning_labels boolean not null default false,
  status text not null default 'active',
  cost_profile jsonb not null default '{}'::jsonb,
  latency_profile jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (company_id, provider, model_key)
);

create table public.sidekick_policy_versions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  version text not null,
  description text not null,
  is_active boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (company_id, version)
);

create table public.sidekick_policy_rules (
  id uuid primary key default gen_random_uuid(),
  policy_version_id uuid not null references public.sidekick_policy_versions(id) on delete cascade,
  role_track text not null,
  rule_key text not null,
  rule_value jsonb not null,
  created_at timestamptz not null default now(),
  unique (policy_version_id, role_track, rule_key)
);

create table public.sidekick_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  round_id uuid references public.session_rounds(id) on delete set null,
  actor public.actor_type not null,
  author_user_id uuid references auth.users(id) on delete set null,
  model_id uuid references public.sidekick_models(id),
  prompt_text text,
  response_text text,
  message_index int not null,
  token_usage jsonb not null default '{}'::jsonb,
  latency_ms int,
  policy_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (session_id, message_index)
);

create table public.sidekick_tool_calls (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.sidekick_messages(id) on delete cascade,
  tool_name text not null,
  input_payload jsonb not null,
  output_payload jsonb,
  status text not null,
  latency_ms int,
  created_at timestamptz not null default now()
);
```

### 3.5 Scoring, Evidence, and Decisions

```sql
create table public.score_cards (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  round_id uuid references public.session_rounds(id) on delete set null,
  role_depth int not null check (role_depth between 0 and 30),
  reasoning int not null check (reasoning between 0 and 20),
  verification int not null check (verification between 0 and 20),
  communication int not null check (communication between 0 and 15),
  reliability int not null check (reliability between 0 and 15),
  total_score int not null check (total_score between 0 and 100),
  confidence numeric(4,3) not null check (confidence >= 0 and confidence <= 1),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.score_evidence (
  id uuid primary key default gen_random_uuid(),
  score_card_id uuid not null references public.score_cards(id) on delete cascade,
  rubric_clause text not null,
  evidence_snippet text not null,
  evidence_source text not null,
  created_at timestamptz not null default now()
);

create table public.gate_decisions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  decision public.gate_decision not null,
  rationale text not null,
  confidence numeric(4,3) not null check (confidence >= 0 and confidence <= 1),
  decided_by uuid not null references auth.users(id),
  decided_at timestamptz not null default now()
);
```

### 3.6 Artifacts, Audit, and Integrations

```sql
create table public.session_artifacts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  round_id uuid references public.session_rounds(id) on delete set null,
  artifact_type public.artifact_type not null,
  storage_path text not null,
  metadata jsonb not null default '{}'::jsonb,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.magic_link_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id),
  requested_by uuid not null references auth.users(id),
  email text not null,
  invite_nonce_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  status text not null,
  created_at timestamptz not null default now()
);

create table public.rippling_writebacks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  payload jsonb not null,
  status text not null,
  attempted_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  actor_user_id uuid references auth.users(id),
  actor_role public.app_role,
  action text not null,
  resource_type text not null,
  resource_id text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);
```

---

## 4) Analytics Event Storage

```sql
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  session_id uuid references public.interview_sessions(id) on delete cascade,
  round_id uuid references public.session_rounds(id) on delete set null,
  actor_type public.actor_type not null,
  actor_user_id uuid references auth.users(id),
  event_name text not null,
  event_version int not null,
  correlation_id uuid,
  payload jsonb not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now()
);
```

Recommended indexes:

- `analytics_events (session_id, occurred_at desc)`
- `analytics_events (event_name, occurred_at desc)`
- `sidekick_messages (session_id, created_at)`
- `score_cards (session_id, created_at desc)`
- `magic_link_events (session_id, created_at desc)`

---

## 5) RLS Helper Functions

```sql
create or replace function public.current_user_role()
returns public.app_role
language sql
stable
as $$
  select p.role from public.profiles p where p.user_id = auth.uid()
$$;

create or replace function public.current_company_id()
returns uuid
language sql
stable
as $$
  select p.company_id from public.profiles p where p.user_id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_user_role() = 'admin'::public.app_role
$$;
```

---

## 6) RLS Policy Model

RLS baseline:

```sql
alter table public.profiles enable row level security;
alter table public.candidates enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.session_participants enable row level security;
alter table public.session_rounds enable row level security;
alter table public.round_submissions enable row level security;
alter table public.sidekick_messages enable row level security;
alter table public.sidekick_tool_calls enable row level security;
alter table public.score_cards enable row level security;
alter table public.score_evidence enable row level security;
alter table public.gate_decisions enable row level security;
alter table public.session_artifacts enable row level security;
alter table public.magic_link_events enable row level security;
alter table public.rippling_writebacks enable row level security;
alter table public.audit_logs enable row level security;
alter table public.sidekick_models enable row level security;
alter table public.sidekick_policy_versions enable row level security;
alter table public.sidekick_policy_rules enable row level security;
alter table public.analytics_events enable row level security;
```

Policy principles:

- Candidate: select-only access to own session and own submissions.
- Interviewer: read/write access to assigned sessions and operational actions.
- Admin: full read/write across company.
- Service role: only via trusted Edge Functions; bypass RLS only where strictly required.

Example policy pattern for session-scoped tables:

```sql
create policy session_select_candidate_or_staff
on public.interview_sessions
for select
using (
  company_id = public.current_company_id()
  and (
    exists (
      select 1
      from public.session_participants sp
      where sp.session_id = interview_sessions.id
      and sp.user_id = auth.uid()
    )
    or public.is_admin()
  )
);
```

Example write policy (interviewer/admin only):

```sql
create policy session_update_staff_only
on public.interview_sessions
for update
using (
  company_id = public.current_company_id()
  and (
    public.is_admin()
    or exists (
      select 1
      from public.session_participants sp
      where sp.session_id = interview_sessions.id
      and sp.user_id = auth.uid()
      and sp.role = 'interviewer'
    )
  )
)
with check (
  company_id = public.current_company_id()
);
```

Candidate-only submission insert:

```sql
create policy round_submission_insert_candidate
on public.round_submissions
for insert
with check (
  exists (
    select 1
    from public.candidates c
    join public.session_rounds sr on sr.id = round_submissions.round_id
    join public.interview_sessions s on s.id = sr.session_id
    where c.id = round_submissions.candidate_id
      and c.auth_user_id = auth.uid()
      and c.company_id = public.current_company_id()
      and s.candidate_id = c.id
  )
);
```

Admin-only policy for model/policy tables:

```sql
create policy models_admin_only_all
on public.sidekick_models
for all
using (public.is_admin())
with check (public.is_admin());
```

---

## 7) Magic-Link Flow (Edge Function Contract)

Function: `send_candidate_magic_link`

Execution steps:

- Validate caller role is `interviewer` or `admin`.
- Validate caller is assigned to the session unless admin.
- Resolve candidate email from `candidates`.
- Generate one-time Supabase magic link.
- Create `magic_link_events` row with hashed nonce, expiry, and requesting actor.
- Dispatch link through approved channel.
- Emit analytics event and audit log.

Security requirements:

- Never store raw nonce/token in Postgres.
- Expiry default: 15 minutes.
- Single-use enforcement on consume endpoint.
- All failures return generic user-safe messages and write detailed server logs.

---

## 8) Operational SQL Views (Recommended)

```sql
create view public.v_session_score_summary as
select
  s.id as session_id,
  max(sc.total_score) as latest_total_score,
  max(sc.created_at) as last_scored_at
from public.interview_sessions s
left join public.score_cards sc on sc.session_id = s.id
group by s.id;

create view public.v_sidekick_usage_summary as
select
  m.session_id,
  count(*) filter (where m.actor = 'candidate') as candidate_messages,
  count(*) filter (where m.actor = 'assistant') as assistant_messages,
  coalesce(sum((m.token_usage->>'total_tokens')::int), 0) as total_tokens
from public.sidekick_messages m
group by m.session_id;
```

---

## 9) Minimum Migration Order

Recommended order:

1. Enums
2. Identity tables (`companies`, `profiles`)
3. Core session tables
4. Sidekick/policy tables
5. Scoring/evidence tables
6. Artifact/audit/integration tables
7. `analytics_events`
8. RLS helper functions
9. RLS policies
10. Edge Function deployment and integration tests
