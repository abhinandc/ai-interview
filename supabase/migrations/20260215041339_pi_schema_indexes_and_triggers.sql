-- Indexes
CREATE INDEX idx_candidates_job_id ON candidates(job_id);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_score ON candidates(score);
CREATE INDEX idx_candidates_hash_id ON candidates(hash_id);
CREATE INDEX idx_calls_candidate_id ON calls(candidate_id);
CREATE INDEX idx_calls_job_id ON calls(job_id);
CREATE INDEX idx_calls_call_status ON calls(call_status);
CREATE INDEX idx_calls_call_sid ON calls(call_sid);
CREATE INDEX idx_resumes_candidate_id ON resumes(candidate_id);
CREATE INDEX idx_resumes_status ON resumes(status);
CREATE INDEX idx_notifications_recipient_read ON notifications(recipient_id, is_read);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_actor ON activity_log(actor_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_job_id ON jobs(job_id);
CREATE INDEX idx_ai_gen_log_agent ON ai_generation_log(agent_config_id);
CREATE INDEX idx_ai_gen_log_entity ON ai_generation_log(entity_type, entity_id);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-approve/reject based on score thresholds
CREATE OR REPLACE FUNCTION handle_candidate_score_update()
RETURNS TRIGGER AS $$
DECLARE
  v_approve_threshold INT;
  v_reject_threshold INT;
BEGIN
  IF (OLD.score IS DISTINCT FROM NEW.score) AND NEW.score IS NOT NULL AND NEW.status = 'in-progress' THEN
    SELECT jc.auto_approve_threshold, jc.auto_reject_threshold INTO v_approve_threshold, v_reject_threshold
    FROM job_configurations jc WHERE jc.job_id = NEW.job_id;
    IF v_approve_threshold IS NOT NULL AND NEW.score >= v_approve_threshold THEN
      NEW.status := 'pi-approved';
    ELSIF v_reject_threshold IS NOT NULL AND NEW.score < v_reject_threshold THEN
      NEW.status := 'pi-rejected';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_candidate_score_update BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION handle_candidate_score_update();

-- Log candidate status changes and notify hiring lead
CREATE OR REPLACE FUNCTION handle_candidate_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_hiring_lead_id UUID;
  v_notif_type notification_type;
  v_notif_title TEXT;
  v_notif_message TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO activity_log (actor_id, entity_type, entity_id, action, old_value, new_value, metadata)
    VALUES (auth.uid(), 'candidate', NEW.id, 'status_change',
      jsonb_build_object('status', OLD.status::TEXT),
      jsonb_build_object('status', NEW.status::TEXT),
      jsonb_build_object('candidate_name', NEW.name, 'job_id', NEW.job_id));
    IF NEW.status IN ('pi-approved', 'pi-rejected', 'hr-rejected') THEN
      SELECT j.hiring_lead_id INTO v_hiring_lead_id FROM jobs j WHERE j.id = NEW.job_id;
      IF v_hiring_lead_id IS NOT NULL THEN
        IF NEW.status = 'pi-approved' THEN
          v_notif_type := 'candidate_approved'; v_notif_title := 'Candidate Approved';
          v_notif_message := NEW.name || ' has been approved for ' || COALESCE(NEW.job_title, 'the position');
        ELSE
          v_notif_type := 'candidate_rejected'; v_notif_title := 'Candidate Rejected';
          v_notif_message := NEW.name || ' has been rejected (' || NEW.status::TEXT || ') for ' || COALESCE(NEW.job_title, 'the position');
        END IF;
        INSERT INTO notifications (recipient_id, type, title, message, data, action_url)
        VALUES (v_hiring_lead_id, v_notif_type, v_notif_title, v_notif_message,
          jsonb_build_object('candidate_id', NEW.id, 'job_id', NEW.job_id, 'old_status', OLD.status::TEXT, 'new_status', NEW.status::TEXT, 'score', NEW.score),
          '/jobs/' || NEW.job_id::TEXT || '/candidates/' || NEW.id::TEXT);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_candidate_status_change AFTER UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION handle_candidate_status_change();

-- Log call completions
CREATE OR REPLACE FUNCTION handle_call_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.call_status IS DISTINCT FROM NEW.call_status AND NEW.call_status = 'completed' THEN
    INSERT INTO activity_log (actor_id, entity_type, entity_id, action, old_value, new_value, metadata)
    VALUES (auth.uid(), 'call', NEW.id, 'call_completed',
      jsonb_build_object('call_status', OLD.call_status::TEXT),
      jsonb_build_object('call_status', 'completed'),
      jsonb_build_object('candidate_id', NEW.candidate_id, 'job_id', NEW.job_id, 'interview_round', NEW.interview_round::TEXT, 'duration_seconds', NEW.duration_seconds, 'call_score', NEW.call_score));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_call_completed AFTER UPDATE ON calls FOR EACH ROW EXECUTE FUNCTION handle_call_completed();

-- Helper functions
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_hiring_lead_for_job(p_job_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM jobs WHERE id = p_job_id AND hiring_lead_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE;;
