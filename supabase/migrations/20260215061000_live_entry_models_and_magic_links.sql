-- Adds model registry and magic-link audit tables used by live assessment UX.

create table if not exists public.model_registry (
  id uuid primary key default gen_random_uuid(),
  model_key text not null,
  provider text not null,
  purpose text not null,
  edgeadmin_endpoint text,
  budget_policy jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, model_key, purpose)
);

drop trigger if exists set_model_registry_updated_at on public.model_registry;
create trigger set_model_registry_updated_at
before update on public.model_registry
for each row execute function public.handle_updated_at();

alter table public.model_registry enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'model_registry' and policyname = 'model_registry_select'
  ) then
    create policy model_registry_select on public.model_registry
      for select to authenticated using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'model_registry' and policyname = 'model_registry_admin_write'
  ) then
    create policy model_registry_admin_write on public.model_registry
      for all to authenticated
      using (public.get_user_role() = 'admin')
      with check (public.get_user_role() = 'admin');
  end if;
end $$;

grant all on table public.model_registry to authenticated, service_role;

create table if not exists public.magic_link_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  email text not null,
  status text not null check (status in ('issued', 'opened', 'expired', 'reissued', 'failed')),
  action_link text,
  redirect_to text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_magic_link_events_session_created_at
  on public.magic_link_events (session_id, created_at desc);

create index if not exists idx_magic_link_events_candidate_created_at
  on public.magic_link_events (candidate_id, created_at desc);

alter table public.magic_link_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'magic_link_events' and policyname = 'magic_link_events_select'
  ) then
    create policy magic_link_events_select on public.magic_link_events
      for select to authenticated using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'magic_link_events' and policyname = 'magic_link_events_insert_staff'
  ) then
    create policy magic_link_events_insert_staff on public.magic_link_events
      for insert to authenticated
      with check (public.get_user_role() in ('admin', 'hiring_lead', 'recruiter'));
  end if;
end $$;

grant all on table public.magic_link_events to authenticated, service_role;
