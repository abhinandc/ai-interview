-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'hiring_lead', 'recruiter');
CREATE TYPE job_status AS ENUM ('ACTIVE', 'INACTIVE', 'INCOMPLETE');
CREATE TYPE job_call_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE candidate_status AS ENUM ('in-progress', 'star-candidate', 'pi-approved', 'pi-rejected', 'hr-rejected', 'candidate-rejected', 'waitlisted', 'shortlisted');
CREATE TYPE call_status_enum AS ENUM ('upcoming', 'initiated', 'ringing', 'in-progress', 'processed', 'completed', 'no-answer', 'busy', 'failed', 'cancelled');
CREATE TYPE resume_processing_status AS ENUM ('uploaded', 'processing', 'processed', 'failed');
CREATE TYPE interview_round AS ENUM ('ai_screening', 'ai_technical', 'live_round_1', 'live_round_2', 'final');
CREATE TYPE notification_type AS ENUM ('candidate_approved', 'candidate_rejected', 'interview_scheduled', 'interview_completed', 'score_threshold_met', 'new_application', 'call_completed', 'action_required');
CREATE TYPE webhook_source AS ENUM ('rippling', 'website', 'manual', 'api');
CREATE TYPE agent_type AS ENUM ('resume_analyzer', 'email_drafter', 'jd_analyzer', 'candidate_evaluator', 'interview_scorer', 'custom');

-- updated_at trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;;
