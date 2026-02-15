create table if not exists public.experience_quotes (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  author text,
  weight integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.experience_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text,
  cta_label text,
  cta_href text,
  priority integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.experience_quotes enable row level security;
alter table public.experience_announcements enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'experience_quotes' and policyname = 'experience_quotes_select'
  ) then
    create policy experience_quotes_select on public.experience_quotes
      for select to authenticated using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'experience_announcements' and policyname = 'experience_announcements_select'
  ) then
    create policy experience_announcements_select on public.experience_announcements
      for select to authenticated using (true);
  end if;
end $$;

grant all on table public.experience_quotes to authenticated, service_role;
grant all on table public.experience_announcements to authenticated, service_role;

insert into public.experience_quotes (quote, author, weight, is_active)
values
  ('Great teams do not fear AI. They fear unclear thinking.', 'OneOrigin', 10, true),
  ('Speed is useful only when direction is precise.', 'OneOrigin', 9, true),
  ('The strongest candidates verify before they claim.', 'OneOrigin', 8, true),
  ('AI can draft; ownership still belongs to you.', 'OneOrigin', 8, true)
on conflict do nothing;

insert into public.experience_announcements (title, detail, cta_label, cta_href, priority, is_active)
values
  ('AI-Native Hiring Program', 'Role tracks are open with live sidekick-enabled assessments.', 'Learn More', '/about-oneorigin', 10, true),
  ('Interviewer Console Upgrade', 'Expanded audit logs and AI usage metrics are now available.', 'Open Dashboard', '/admin', 9, true)
on conflict do nothing;
