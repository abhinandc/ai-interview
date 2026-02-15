-- Live assessment compatibility migration for existing OneRecruit schema.
-- Adds required tables/columns for the AI interview app without dropping PI schema tables.

create extension if not exists pgcrypto with schema extensions;

-- Enums required by this app
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
    CREATE TYPE public.session_status AS ENUM ('scheduled', 'live', 'paused', 'completed', 'aborted');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gate_decision') THEN
    CREATE TYPE public.gate_decision AS ENUM ('proceed', 'caution', 'stop');
  END IF;
END $$;

-- Candidate enum values used by the current Next.js API
ALTER TYPE public.candidate_status ADD VALUE IF NOT EXISTS 'applied';
ALTER TYPE public.candidate_status ADD VALUE IF NOT EXISTS 'pi_scheduled';
ALTER TYPE public.candidate_status ADD VALUE IF NOT EXISTS 'pi_passed';
ALTER TYPE public.candidate_status ADD VALUE IF NOT EXISTS 'live_scheduled';
ALTER TYPE public.candidate_status ADD VALUE IF NOT EXISTS 'live_completed';
ALTER TYPE public.candidate_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.candidate_status ADD VALUE IF NOT EXISTS 'advanced';

-- Compatibility columns for API inserts/selects
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS rippling_candidate_id text;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS applied_at timestamptz DEFAULT now();

-- Existing schema requires hash_id; ensure inserts work without explicit hash_id in older flows.
ALTER TABLE public.candidates ALTER COLUMN hash_id SET DEFAULT replace(gen_random_uuid()::text, '-', '');

CREATE INDEX IF NOT EXISTS idx_candidates_rippling_candidate_id ON public.candidates (rippling_candidate_id);

-- App-specific job profiles table
CREATE TABLE IF NOT EXISTS public.job_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text NOT NULL,
  title text NOT NULL,
  location text,
  level_band text NOT NULL CHECK (level_band IN ('junior', 'mid', 'senior')),
  track text NOT NULL CHECK (track IN ('sales', 'agentic_eng', 'fullstack', 'marketing', 'implementation', 'HR', 'security')),
  role_success_criteria text,
  must_have_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  disqualifiers jsonb NOT NULL DEFAULT '[]'::jsonb,
  gating_thresholds jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id)
);

DROP TRIGGER IF EXISTS set_job_profiles_updated_at ON public.job_profiles;
CREATE TRIGGER set_job_profiles_updated_at
BEFORE UPDATE ON public.job_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Session and round package tables used by current app APIs
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES public.candidates(id) ON DELETE SET NULL,
  job_id uuid REFERENCES public.job_profiles(id) ON DELETE SET NULL,
  session_type text NOT NULL DEFAULT 'live',
  meeting_link text,
  scheduled_at timestamptz,
  interviewer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.session_status NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_interview_sessions_updated_at ON public.interview_sessions;
CREATE TRIGGER set_interview_sessions_updated_at
BEFORE UPDATE ON public.interview_sessions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.interview_scope_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  generated_at timestamptz NOT NULL DEFAULT now(),
  track text NOT NULL,
  round_plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  question_set jsonb NOT NULL DEFAULT '{}'::jsonb,
  simulation_payloads jsonb NOT NULL DEFAULT '{}'::jsonb,
  rubric_version text NOT NULL,
  models_used text[] NOT NULL DEFAULT '{}',
  approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_interview_scope_packages_updated_at ON public.interview_scope_packages;
CREATE TRIGGER set_interview_scope_packages_updated_at
BEFORE UPDATE ON public.interview_scope_packages
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.live_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor text NOT NULL DEFAULT 'system',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  artifact_type text NOT NULL,
  url text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pi_screenings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  scheduled_at timestamptz,
  completed_at timestamptz,
  resume_analysis jsonb NOT NULL DEFAULT '{}'::jsonb,
  transcript jsonb,
  audio_url text,
  pi_score_overall numeric(6,2),
  dimension_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  pass_fail boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_pi_screenings_updated_at ON public.pi_screenings;
CREATE TRIGGER set_pi_screenings_updated_at
BEFORE UPDATE ON public.pi_screenings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.red_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  round_id integer,
  flag_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  round integer NOT NULL,
  overall_score integer NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  dimension_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  red_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence numeric(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  evidence_quotes jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendation public.gate_decision NOT NULL,
  recommended_followups text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rippling_writebacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('note', 'tag', 'stage_move')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_rippling_writebacks_updated_at ON public.rippling_writebacks;
CREATE TRIGGER set_rippling_writebacks_updated_at
BEFORE UPDATE ON public.rippling_writebacks
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Performance indexes for app queries
CREATE INDEX IF NOT EXISTS idx_interview_sessions_candidate ON public.interview_sessions (candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_job ON public.interview_sessions (job_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_created_at ON public.interview_sessions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scope_packages_session_id ON public.interview_scope_packages (session_id);

CREATE INDEX IF NOT EXISTS idx_live_events_session_created_at ON public.live_events (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_events_session_event_type ON public.live_events (session_id, event_type);

CREATE INDEX IF NOT EXISTS idx_artifacts_session_created_at ON public.artifacts (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scores_session_created_at ON public.scores (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_red_flags_session_round ON public.red_flags (session_id, round_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pi_screenings_candidate_created_at ON public.pi_screenings (candidate_id, created_at DESC);

-- Realtime wiring used by frontend subscriptions
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.interview_sessions;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.interview_scope_packages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.scores;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.live_events;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Basic grants (RLS currently permissive in this project's existing model)
GRANT ALL ON TABLE public.job_profiles TO authenticated, service_role;
GRANT ALL ON TABLE public.interview_sessions TO authenticated, service_role;
GRANT ALL ON TABLE public.interview_scope_packages TO authenticated, service_role;
GRANT ALL ON TABLE public.live_events TO authenticated, service_role;
GRANT ALL ON TABLE public.artifacts TO authenticated, service_role;
GRANT ALL ON TABLE public.pi_screenings TO authenticated, service_role;
GRANT ALL ON TABLE public.red_flags TO authenticated, service_role;
GRANT ALL ON TABLE public.scores TO authenticated, service_role;
GRANT ALL ON TABLE public.rippling_writebacks TO authenticated, service_role;
