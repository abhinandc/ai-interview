-- job_configurations
CREATE TABLE job_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  auto_approve_threshold INT,
  auto_reject_threshold INT,
  auto_call_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_email_enabled BOOLEAN NOT NULL DEFAULT false,
  max_interview_rounds INT NOT NULL DEFAULT 3,
  interview_question_sets JSONB NOT NULL DEFAULT '{}',
  calendar_availability JSONB,
  calendar_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER set_job_configurations_updated_at BEFORE UPDATE ON job_configurations FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- email_templates
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER set_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- webhook_configs
CREATE TABLE webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  target_url TEXT NOT NULL,
  headers JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  retry_count INT NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER set_webhook_configs_updated_at BEFORE UPDATE ON webhook_configs FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- applications
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
  source webhook_source NOT NULL,
  source_reference TEXT,
  raw_payload JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ai_agent_configs
CREATE TABLE ai_agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type agent_type NOT NULL,
  name TEXT NOT NULL,
  model_id TEXT NOT NULL DEFAULT 'claude-sonnet-4-5-20250929',
  temperature NUMERIC(3,2) NOT NULL DEFAULT 0.7,
  max_tokens INT NOT NULL DEFAULT 4096,
  system_prompt TEXT NOT NULL,
  tools_enabled TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER set_ai_agent_configs_updated_at BEFORE UPDATE ON ai_agent_configs FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ai_agent_prompts
CREATE TABLE ai_agent_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_config_id UUID NOT NULL REFERENCES ai_agent_configs(id) ON DELETE CASCADE,
  version INT NOT NULL,
  prompt_template TEXT NOT NULL,
  input_schema JSONB,
  output_schema JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ai_generation_log
CREATE TABLE ai_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_config_id UUID REFERENCES ai_agent_configs(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  input_data JSONB NOT NULL,
  output_data JSONB,
  model_used TEXT NOT NULL,
  tokens_used INT,
  latency_ms INT,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);;
