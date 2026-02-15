-- Drop old triggers on old tables
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop old tables (CASCADE drops dependent objects)
DROP TABLE IF EXISTS rippling_writebacks CASCADE;
DROP TABLE IF EXISTS live_events CASCADE;
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS artifacts CASCADE;
DROP TABLE IF EXISTS pi_screenings CASCADE;
DROP TABLE IF EXISTS scheduling_requests CASCADE;
DROP TABLE IF EXISTS interview_sessions CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS interview_scope_packages CASCADE;
DROP TABLE IF EXISTS assessment_blueprints CASCADE;
DROP TABLE IF EXISTS job_profiles CASCADE;
DROP TABLE IF EXISTS agents_registry CASCADE;
DROP TABLE IF EXISTS models_registry CASCADE;

-- Drop old functions
DROP FUNCTION IF EXISTS handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_candidate_status_change() CASCADE;
DROP FUNCTION IF EXISTS handle_candidate_score_update() CASCADE;
DROP FUNCTION IF EXISTS handle_call_completed() CASCADE;
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS is_hiring_lead_for_job(UUID) CASCADE;

-- Drop old enum types
DROP TYPE IF EXISTS agent_region CASCADE;
DROP TYPE IF EXISTS artifact_type CASCADE;
DROP TYPE IF EXISTS candidate_status CASCADE;
DROP TYPE IF EXISTS event_type CASCADE;
DROP TYPE IF EXISTS level_band CASCADE;
DROP TYPE IF EXISTS score_recommendation CASCADE;
DROP TYPE IF EXISTS session_status CASCADE;
DROP TYPE IF EXISTS track CASCADE;
DROP TYPE IF EXISTS writeback_action CASCADE;
DROP TYPE IF EXISTS writeback_status CASCADE;

-- Also drop any new types that might have been partially created
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS job_status CASCADE;
DROP TYPE IF EXISTS job_call_status CASCADE;
DROP TYPE IF EXISTS call_status_enum CASCADE;
DROP TYPE IF EXISTS resume_processing_status CASCADE;
DROP TYPE IF EXISTS interview_round CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS webhook_source CASCADE;
DROP TYPE IF EXISTS agent_type CASCADE;

-- Drop new tables if partially created
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS calls CASCADE;
DROP TABLE IF EXISTS resumes CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS job_configurations CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS webhook_configs CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS ai_agent_configs CASCADE;
DROP TABLE IF EXISTS ai_agent_prompts CASCADE;
DROP TABLE IF EXISTS ai_generation_log CASCADE;;
