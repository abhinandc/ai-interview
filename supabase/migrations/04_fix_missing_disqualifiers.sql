-- Fix ALL missing columns in job_profiles table
-- Safe to run multiple times (uses IF NOT EXISTS)

ALTER TABLE job_profiles
  ADD COLUMN IF NOT EXISTS role_success_criteria TEXT,
  ADD COLUMN IF NOT EXISTS must_have_flags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS disqualifiers TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gating_thresholds JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS experience_years_min INTEGER,
  ADD COLUMN IF NOT EXISTS experience_years_max INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN job_profiles.role_success_criteria IS 'Description of what success looks like in this role';
COMMENT ON COLUMN job_profiles.must_have_flags IS 'Required qualifications/skills';
COMMENT ON COLUMN job_profiles.disqualifiers IS 'Array of disqualifying criteria for candidates';
COMMENT ON COLUMN job_profiles.gating_thresholds IS 'Score thresholds for proceed/caution/stop decisions';
COMMENT ON COLUMN job_profiles.experience_years_min IS 'Minimum years of experience required';
COMMENT ON COLUMN job_profiles.experience_years_max IS 'Maximum years of experience (for level matching)';
