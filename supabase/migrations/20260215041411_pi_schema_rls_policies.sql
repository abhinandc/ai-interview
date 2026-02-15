-- RLS: profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_update_own ON profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY profiles_admin_insert ON profiles FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY profiles_admin_update ON profiles FOR UPDATE TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY profiles_admin_delete ON profiles FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- RLS: jobs
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY jobs_select ON jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY jobs_admin_insert ON jobs FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY jobs_admin_update ON jobs FOR UPDATE TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY jobs_admin_delete ON jobs FOR DELETE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY jobs_hiring_lead_insert ON jobs FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'hiring_lead' AND (hiring_lead_id = auth.uid() OR created_by = auth.uid()));
CREATE POLICY jobs_hiring_lead_update ON jobs FOR UPDATE TO authenticated USING (get_user_role() = 'hiring_lead' AND hiring_lead_id = auth.uid()) WITH CHECK (get_user_role() = 'hiring_lead' AND hiring_lead_id = auth.uid());
CREATE POLICY jobs_hiring_lead_delete ON jobs FOR DELETE TO authenticated USING (get_user_role() = 'hiring_lead' AND hiring_lead_id = auth.uid());

-- RLS: candidates
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY candidates_select ON candidates FOR SELECT TO authenticated USING (true);
CREATE POLICY candidates_admin_insert ON candidates FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY candidates_admin_update ON candidates FOR UPDATE TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY candidates_admin_delete ON candidates FOR DELETE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY candidates_hiring_lead_update ON candidates FOR UPDATE TO authenticated USING (get_user_role() = 'hiring_lead' AND is_hiring_lead_for_job(job_id)) WITH CHECK (get_user_role() = 'hiring_lead' AND is_hiring_lead_for_job(job_id));
CREATE POLICY candidates_hiring_lead_delete ON candidates FOR DELETE TO authenticated USING (get_user_role() = 'hiring_lead' AND is_hiring_lead_for_job(job_id));
CREATE POLICY candidates_recruiter_insert ON candidates FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'recruiter');
CREATE POLICY candidates_recruiter_update ON candidates FOR UPDATE TO authenticated USING (get_user_role() = 'recruiter') WITH CHECK (get_user_role() = 'recruiter');
CREATE POLICY candidates_hiring_lead_insert ON candidates FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'hiring_lead' AND is_hiring_lead_for_job(job_id));

-- RLS: calls
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY calls_select ON calls FOR SELECT TO authenticated USING (true);
CREATE POLICY calls_admin_insert ON calls FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY calls_admin_update ON calls FOR UPDATE TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY calls_admin_delete ON calls FOR DELETE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY calls_recruiter_insert ON calls FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'recruiter');
CREATE POLICY calls_recruiter_update ON calls FOR UPDATE TO authenticated USING (get_user_role() = 'recruiter') WITH CHECK (get_user_role() = 'recruiter');
CREATE POLICY calls_hiring_lead_insert ON calls FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'hiring_lead' AND is_hiring_lead_for_job(job_id));
CREATE POLICY calls_hiring_lead_update ON calls FOR UPDATE TO authenticated USING (get_user_role() = 'hiring_lead' AND is_hiring_lead_for_job(job_id)) WITH CHECK (get_user_role() = 'hiring_lead' AND is_hiring_lead_for_job(job_id));

-- RLS: resumes
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY resumes_select ON resumes FOR SELECT TO authenticated USING (true);
CREATE POLICY resumes_admin_insert ON resumes FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY resumes_admin_update ON resumes FOR UPDATE TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY resumes_admin_delete ON resumes FOR DELETE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY resumes_recruiter_insert ON resumes FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'recruiter');
CREATE POLICY resumes_recruiter_update ON resumes FOR UPDATE TO authenticated USING (get_user_role() = 'recruiter') WITH CHECK (get_user_role() = 'recruiter');
CREATE POLICY resumes_hiring_lead_insert ON resumes FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'hiring_lead' AND EXISTS (SELECT 1 FROM candidates c WHERE c.id = candidate_id AND is_hiring_lead_for_job(c.job_id)));
CREATE POLICY resumes_hiring_lead_update ON resumes FOR UPDATE TO authenticated USING (get_user_role() = 'hiring_lead' AND EXISTS (SELECT 1 FROM candidates c WHERE c.id = candidate_id AND is_hiring_lead_for_job(c.job_id))) WITH CHECK (get_user_role() = 'hiring_lead' AND EXISTS (SELECT 1 FROM candidates c WHERE c.id = candidate_id AND is_hiring_lead_for_job(c.job_id)));

-- RLS: notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_select ON notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY notifications_update_own ON notifications FOR UPDATE TO authenticated USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());
CREATE POLICY notifications_admin_insert ON notifications FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY notifications_admin_update ON notifications FOR UPDATE TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY notifications_admin_delete ON notifications FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- RLS: activity_log
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY activity_log_select ON activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY activity_log_admin_insert ON activity_log FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY activity_log_admin_delete ON activity_log FOR DELETE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY activity_log_insert ON activity_log FOR INSERT TO authenticated WITH CHECK (true);

-- RLS: job_configurations
ALTER TABLE job_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY job_configurations_select ON job_configurations FOR SELECT TO authenticated USING (true);
CREATE POLICY job_configurations_admin_insert ON job_configurations FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY job_configurations_admin_update ON job_configurations FOR UPDATE TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY job_configurations_admin_delete ON job_configurations FOR DELETE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY job_configurations_hiring_lead_insert ON job_configurations FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'hiring_lead' AND is_hiring_lead_for_job(job_id));
CREATE POLICY job_configurations_hiring_lead_update ON job_configurations FOR UPDATE TO authenticated USING (get_user_role() = 'hiring_lead' AND is_hiring_lead_for_job(job_id)) WITH CHECK (get_user_role() = 'hiring_lead' AND is_hiring_lead_for_job(job_id));
CREATE POLICY job_configurations_hiring_lead_delete ON job_configurations FOR DELETE TO authenticated USING (get_user_role() = 'hiring_lead' AND is_hiring_lead_for_job(job_id));

-- RLS: email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY email_templates_select ON email_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY email_templates_admin_insert ON email_templates FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY email_templates_admin_update ON email_templates FOR UPDATE TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY email_templates_admin_delete ON email_templates FOR DELETE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY email_templates_hiring_lead_insert ON email_templates FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'hiring_lead' AND (job_id IS NULL OR is_hiring_lead_for_job(job_id)));
CREATE POLICY email_templates_hiring_lead_update ON email_templates FOR UPDATE TO authenticated USING (get_user_role() = 'hiring_lead' AND (job_id IS NULL OR is_hiring_lead_for_job(job_id))) WITH CHECK (get_user_role() = 'hiring_lead' AND (job_id IS NULL OR is_hiring_lead_for_job(job_id)));

-- RLS: webhook_configs
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY webhook_configs_select ON webhook_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY webhook_configs_admin_insert ON webhook_configs FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY webhook_configs_admin_update ON webhook_configs FOR UPDATE TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY webhook_configs_admin_delete ON webhook_configs FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- RLS: applications
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY applications_select ON applications FOR SELECT TO authenticated USING (true);
CREATE POLICY applications_admin_insert ON applications FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY applications_admin_update ON applications FOR UPDATE TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY applications_admin_delete ON applications FOR DELETE TO authenticated USING (get_user_role() = 'admin');
CREATE POLICY applications_recruiter_insert ON applications FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'recruiter');
CREATE POLICY applications_hiring_lead_insert ON applications FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'hiring_lead' AND is_hiring_lead_for_job(job_id));
CREATE POLICY applications_hiring_lead_update ON applications FOR UPDATE TO authenticated USING (get_user_role() = 'hiring_lead' AND is_hiring_lead_for_job(job_id)) WITH CHECK (get_user_role() = 'hiring_lead' AND is_hiring_lead_for_job(job_id));

-- RLS: ai_agent_configs
ALTER TABLE ai_agent_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_agent_configs_select ON ai_agent_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY ai_agent_configs_admin_insert ON ai_agent_configs FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY ai_agent_configs_admin_update ON ai_agent_configs FOR UPDATE TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY ai_agent_configs_admin_delete ON ai_agent_configs FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- RLS: ai_agent_prompts
ALTER TABLE ai_agent_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_agent_prompts_select ON ai_agent_prompts FOR SELECT TO authenticated USING (true);
CREATE POLICY ai_agent_prompts_admin_insert ON ai_agent_prompts FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'admin');
CREATE POLICY ai_agent_prompts_admin_update ON ai_agent_prompts FOR UPDATE TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY ai_agent_prompts_admin_delete ON ai_agent_prompts FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- RLS: ai_generation_log
ALTER TABLE ai_generation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_generation_log_select ON ai_generation_log FOR SELECT TO authenticated USING (true);
CREATE POLICY ai_generation_log_insert ON ai_generation_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY ai_generation_log_admin_delete ON ai_generation_log FOR DELETE TO authenticated USING (get_user_role() = 'admin');;
