-- Comprehensive Schema Fix - Add ALL missing columns to core tables
-- Safe to run multiple times (uses IF NOT EXISTS)
-- This migration ensures the database matches the base schema expectations

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. JOB PROFILES - Fix missing columns
-- ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE job_profiles
  ADD COLUMN IF NOT EXISTS role_success_criteria TEXT,
  ADD COLUMN IF NOT EXISTS must_have_flags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS disqualifiers TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gating_thresholds JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS experience_years_min INTEGER,
  ADD COLUMN IF NOT EXISTS experience_years_max INTEGER;

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. CANDIDATES - Fix missing columns
-- ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ DEFAULT NOW();

-- ═════════════════════════════════════════════════════════════════════════════
-- 3. INTERVIEW SESSIONS - Fix missing columns
-- ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE interview_sessions
  ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'live',
  ADD COLUMN IF NOT EXISTS meeting_link TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS interviewer_user_id TEXT;

-- ═════════════════════════════════════════════════════════════════════════════
-- 4. LIVE EVENTS - Add actor column
-- ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE live_events
  ADD COLUMN IF NOT EXISTS actor TEXT;

-- ═════════════════════════════════════════════════════════════════════════════
-- 5. ARTIFACTS - Add content and round_number columns
-- ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE artifacts
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS round_number INTEGER;

-- ═════════════════════════════════════════════════════════════════════════════
-- 6. SCORES - Add interviewer override tracking
-- ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE scores
  ADD COLUMN IF NOT EXISTS recommended_followups JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS overridden_by TEXT,
  ADD COLUMN IF NOT EXISTS override_reason TEXT;

-- ═════════════════════════════════════════════════════════════════════════════
-- 7. INTERVIEW SCOPE PACKAGES - Ensure all columns exist
-- ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE interview_scope_packages
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS track TEXT,
  ADD COLUMN IF NOT EXISTS round_plan JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS question_set JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS simulation_payloads JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS rubric_version TEXT DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS models_used TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS approved_by TEXT;

-- ═════════════════════════════════════════════════════════════════════════════
-- COMMENTS FOR DOCUMENTATION
-- ═════════════════════════════════════════════════════════════════════════════

-- job_profiles
COMMENT ON COLUMN job_profiles.role_success_criteria IS 'Description of what success looks like in this role';
COMMENT ON COLUMN job_profiles.must_have_flags IS 'Required qualifications/skills';
COMMENT ON COLUMN job_profiles.disqualifiers IS 'Array of disqualifying criteria for candidates';
COMMENT ON COLUMN job_profiles.gating_thresholds IS 'Score thresholds for proceed/caution/stop decisions';
COMMENT ON COLUMN job_profiles.experience_years_min IS 'Minimum years of experience required';
COMMENT ON COLUMN job_profiles.experience_years_max IS 'Maximum years of experience (for level matching)';

-- candidates
COMMENT ON COLUMN candidates.phone IS 'Candidate phone number';
COMMENT ON COLUMN candidates.country IS 'Candidate country/location';
COMMENT ON COLUMN candidates.applied_at IS 'Timestamp when candidate applied';

-- interview_sessions
COMMENT ON COLUMN interview_sessions.session_type IS 'Type of interview session (live, etc)';
COMMENT ON COLUMN interview_sessions.meeting_link IS 'Video call link for the interview';
COMMENT ON COLUMN interview_sessions.scheduled_at IS 'Scheduled interview time';
COMMENT ON COLUMN interview_sessions.interviewer_user_id IS 'ID of the interviewer';

-- live_events
COMMENT ON COLUMN live_events.actor IS 'User or system that triggered the event';

-- artifacts
COMMENT ON COLUMN artifacts.content IS 'Text content of the artifact (for queryability)';
COMMENT ON COLUMN artifacts.round_number IS 'Round number this artifact belongs to';

-- scores
COMMENT ON COLUMN scores.recommended_followups IS 'AI-suggested follow-up questions or actions';
COMMENT ON COLUMN scores.overridden_by IS 'Interviewer who overrode the AI score';
COMMENT ON COLUMN scores.override_reason IS 'Reason for score override';

-- interview_scope_packages
COMMENT ON COLUMN interview_scope_packages.generated_at IS 'Timestamp when scope package was generated';
COMMENT ON COLUMN interview_scope_packages.track IS 'Job track (sales, agentic_eng, etc)';
COMMENT ON COLUMN interview_scope_packages.round_plan IS 'JSONB array of round configurations';
COMMENT ON COLUMN interview_scope_packages.question_set IS 'JSONB object containing generated questions';
COMMENT ON COLUMN interview_scope_packages.simulation_payloads IS 'JSONB object with simulation data for persona rounds';
COMMENT ON COLUMN interview_scope_packages.rubric_version IS 'Version of the scoring rubric used';
COMMENT ON COLUMN interview_scope_packages.models_used IS 'Array of AI models used to generate the scope package';
COMMENT ON COLUMN interview_scope_packages.approved_by IS 'User who approved the scope package';
