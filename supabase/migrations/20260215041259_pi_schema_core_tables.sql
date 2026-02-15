-- profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'recruiter',
  is_active BOOLEAN NOT NULL DEFAULT true,
  notification_preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT UNIQUE NOT NULL,
  job_title TEXT NOT NULL,
  experience JSONB,
  location TEXT,
  country TEXT,
  timezone TEXT,
  education TEXT[],
  required_skills JSONB,
  good_to_have_skills TEXT[],
  recommended_skills TEXT[],
  questions TEXT[],
  budget TEXT,
  positions_open INT,
  due_date DATE,
  match_threshold INT NOT NULL DEFAULT 75,
  auto_call_window JSONB,
  call_status job_call_status NOT NULL DEFAULT 'INACTIVE',
  status job_status NOT NULL DEFAULT 'INCOMPLETE',
  sender_service TEXT,
  apply_email TEXT,
  hiring_lead_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  department TEXT,
  remote_policy TEXT,
  description_text TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER set_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- candidates
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hash_id TEXT UNIQUE NOT NULL,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  job_title TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  current_location TEXT,
  last_job_role TEXT,
  status candidate_status NOT NULL DEFAULT 'in-progress',
  score NUMERIC(5,2),
  education TEXT[],
  education_match BOOLEAN,
  experience_match BOOLEAN,
  location_match BOOLEAN,
  jobdescription_match BOOLEAN,
  immediately_available BOOLEAN,
  total_year_of_experience NUMERIC(4,1),
  average_tenure_duration TEXT,
  skills TEXT[],
  required_skills JSONB,
  good_to_have_skills JSONB,
  soft_skills JSONB,
  certificates TEXT[],
  previous_companies JSONB,
  resume_pros_cons JSONB,
  combined_summary TEXT,
  resume_storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER set_candidates_updated_at BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- calls
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  call_sid TEXT UNIQUE,
  call_id TEXT UNIQUE,
  scheduled_at TIMESTAMPTZ,
  timezone TEXT,
  questions TEXT[],
  call_status call_status_enum NOT NULL DEFAULT 'upcoming',
  interview_round interview_round NOT NULL DEFAULT 'ai_screening',
  duration_seconds INT,
  agent_id TEXT,
  agent_config JSONB,
  call_summary TEXT,
  call_pros_cons JSONB,
  call_questions_asked TEXT[],
  call_score NUMERIC(5,2),
  call_data JSONB,
  conv_audio_url TEXT,
  audio_storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER set_calls_updated_at BEFORE UPDATE ON calls FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- resumes
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  hash_id TEXT,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  job_type TEXT,
  status resume_processing_status NOT NULL DEFAULT 'uploaded',
  processing_error TEXT,
  parsed_data JSONB,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER set_resumes_updated_at BEFORE UPDATE ON resumes FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- activity_log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);;
