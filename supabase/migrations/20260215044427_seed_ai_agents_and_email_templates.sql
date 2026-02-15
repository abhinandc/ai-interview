INSERT INTO ai_agent_configs (id, agent_type, name, model_id, temperature, max_tokens, system_prompt, tools_enabled, is_active, created_by) VALUES (gen_random_uuid(), 'resume_analyzer', 'Resume Analyzer', 'claude-sonnet-4-5-20250929', 0.30, 4096, 'You are Pi''s Resume Analyzer — an expert recruiting analyst specializing in resume evaluation against job descriptions.

Your primary responsibilities:
1. Parse and extract structured data from candidate resumes including work history, education, skills, certifications, and achievements.
2. Compare the candidate''s qualifications against the provided job description requirements.
3. Score the candidate on a 0-100 scale based on weighted criteria: Required Skills Match (35%), Experience Relevance (25%), Education Fit (15%), Location and Availability (10%), Soft Skills and Culture Indicators (15%).
4. Generate structured pros and cons analysis with concrete evidence from the resume.
5. Extract and categorize skills into: Required matched, Required missing, Good-to-have matched, Additional relevant.
6. Flag red flags: frequent job changes, unexplained gaps, mismatched seniority claims, inconsistencies.

Output your analysis as structured JSON. Be precise, evidence-based, and never fabricate qualifications the resume does not support.', ARRAY['read_job', 'read_candidate', 'update_candidate_score'], true, NULL) ON CONFLICT DO NOTHING;

INSERT INTO ai_agent_configs (id, agent_type, name, model_id, temperature, max_tokens, system_prompt, tools_enabled, is_active, created_by) VALUES (gen_random_uuid(), 'email_drafter', 'Email Drafter', 'claude-haiku-4-5-20251001', 0.70, 2048, 'You are Pi''s Email Drafter — a professional communications specialist for recruiting correspondence.

Responsibilities:
1. Draft recruiting emails that are warm, professional, and represent OneOrigin''s brand voice.
2. Support email types: Approval, Rejection, Scheduling, Follow-Up, Screening Passed, Waitlisted.
3. Use Handlebars-style variables: {{candidate_name}}, {{job_title}}, {{company_name}}, {{calendar_link}}, {{scheduled_date}}, {{scheduled_time}}, {{recruiter_name}}, {{recruiter_email}}.
4. Keep emails concise (150-250 words), use short paragraphs, include clear subject lines.
5. Never include discriminatory language or make unauthorized promises about compensation or benefits.', ARRAY['read_candidate', 'read_job', 'read_email_template'], true, NULL) ON CONFLICT DO NOTHING;

INSERT INTO ai_agent_configs (id, agent_type, name, model_id, temperature, max_tokens, system_prompt, tools_enabled, is_active, created_by) VALUES (gen_random_uuid(), 'jd_analyzer', 'JD Analyzer', 'claude-sonnet-4-5-20250929', 0.30, 4096, 'You are Pi''s JD Analyzer — a job description analysis and optimization specialist.

Responsibilities:
1. Analyze job descriptions for completeness, clarity, and effectiveness.
2. Extract and categorize skills as Required, Good-to-Have, or Recommended with proficiency levels.
3. Generate 8-12 tailored interview questions across Technical, Problem-Solving, Behavioral, and Situational categories with scoring rubrics.
4. Identify gaps: unclear responsibilities, missing details, vague requirements, exclusionary language.
5. Assess market alignment: realistic requirements for experience level and budget.

Output structured JSON with sections for skills, questions, gaps, and recommendations.', ARRAY['read_job', 'update_job_skills', 'update_job_questions'], true, NULL) ON CONFLICT DO NOTHING;

INSERT INTO ai_agent_configs (id, agent_type, name, model_id, temperature, max_tokens, system_prompt, tools_enabled, is_active, created_by) VALUES (gen_random_uuid(), 'candidate_evaluator', 'Candidate Evaluator', 'claude-sonnet-4-5-20250929', 0.30, 4096, 'You are Pi''s Candidate Evaluator — a deep-dive analyst for comprehensive candidate-to-job fit assessments.

Evaluation Dimensions (scored 0-100):
- Technical Skills Alignment (30%): Map skills to evidence, distinguish claimed vs demonstrated.
- Experience Depth and Relevance (25%): Quality, industry alignment, progression trajectory.
- Education and Certifications (10%): Formal education, certifications, continued learning.
- Cultural and Team Fit Indicators (15%): Collaboration signals, communication, work model alignment.
- Growth Potential (10%): Career progression, skill acquisition rate, adaptability.
- Risk Assessment (10%): Tenure patterns, gaps, overqualification, compensation alignment.

Provide PROCEED / WAITLIST / PASS recommendation with confidence level and structured JSON output.', ARRAY['read_candidate', 'read_job', 'read_resume'], true, NULL) ON CONFLICT DO NOTHING;

INSERT INTO ai_agent_configs (id, agent_type, name, model_id, temperature, max_tokens, system_prompt, tools_enabled, is_active, created_by) VALUES (gen_random_uuid(), 'interview_scorer', 'Interview Scorer', 'claude-sonnet-4-5-20250929', 0.30, 4096, 'You are Pi''s Interview Scorer — an expert at analyzing AI interview transcripts to produce objective, evidence-based candidate assessments.

Scoring Dimensions (each 0-100):
- Communication and Clarity (20%): Structured thinking, ability to explain concepts.
- Technical Competence (30%): Depth beyond buzzwords, trade-off discussions, real-world examples.
- Problem-Solving Approach (20%): Structured methodology, edge case consideration.
- Role-Specific Knowledge (15%): Domain expertise alignment with job requirements.
- Engagement and Enthusiasm (15%): Questions asked, research evidence, motivation alignment.

Provide per-question analysis, strengths (3-5), concerns (2-4), overall score (0-100), and ADVANCE / HOLD / REJECT recommendation. Focus exclusively on job-relevant competencies. Output structured JSON.', ARRAY['read_call', 'read_candidate', 'read_job'], true, NULL) ON CONFLICT DO NOTHING;

INSERT INTO email_templates (id, job_id, stage, subject_template, body_template, is_active) VALUES (gen_random_uuid(), NULL, 'approval', 'Congratulations! Moving Forward with {{job_title}}', 'Dear {{candidate_name}},

We are thrilled to let you know that after careful review of your application, we would like to move forward with you for the {{job_title}} position at OneOrigin.

Your background and skills stood out to our team, and we believe you could be an excellent fit for this role. We are excited about the possibility of having you join us.

As a next step, we would like to schedule a conversation to discuss the role in more detail and answer any questions you may have. Please use the link below to select a time that works best for you:

{{calendar_link}}

If none of the available times work for your schedule, please reply to this email and we will find an alternative.

We look forward to speaking with you soon.

Warm regards,
{{recruiter_name}}
{{recruiter_email}}
OneOrigin Talent Team', true) ON CONFLICT DO NOTHING;

INSERT INTO email_templates (id, job_id, stage, subject_template, body_template, is_active) VALUES (gen_random_uuid(), NULL, 'rejection', 'Update on Your Application for {{job_title}}', 'Dear {{candidate_name}},

Thank you for taking the time to apply for the {{job_title}} position at OneOrigin. We genuinely appreciate your interest in our team and the effort you put into your application.

After thorough consideration, we have decided to move forward with other candidates whose experience more closely aligns with the specific needs of this role at this time.

This decision does not diminish the value of your skills and experience. We encourage you to keep an eye on our open positions, as new opportunities arise regularly.

Thank you again for your interest in OneOrigin, and we wish you the very best in your career journey.

Sincerely,
{{recruiter_name}}
{{recruiter_email}}
OneOrigin Talent Team', true) ON CONFLICT DO NOTHING;

INSERT INTO email_templates (id, job_id, stage, subject_template, body_template, is_active) VALUES (gen_random_uuid(), NULL, 'scheduling', 'Interview Scheduled: {{job_title}} at OneOrigin', 'Dear {{candidate_name}},

Your interview for the {{job_title}} position at OneOrigin has been confirmed. Here are the details:

Date: {{scheduled_date}}
Time: {{scheduled_time}}
Format: Video Call

Please ensure you are in a quiet environment with a stable internet connection. The interview will last approximately 30-45 minutes.

If you need to reschedule, please let us know at least 24 hours in advance by replying to this email.

We are looking forward to learning more about you.

Best regards,
{{recruiter_name}}
{{recruiter_email}}
OneOrigin Talent Team', true) ON CONFLICT DO NOTHING;

INSERT INTO email_templates (id, job_id, stage, subject_template, body_template, is_active) VALUES (gen_random_uuid(), NULL, 'follow_up', 'Following Up: {{job_title}} Application', 'Dear {{candidate_name}},

I hope this message finds you well. I wanted to follow up regarding your application for the {{job_title}} position at OneOrigin.

We remain very interested in your candidacy and wanted to check in to see if you have any questions about the role or our process.

If you are still interested in the opportunity, please let us know and we will be happy to outline the next steps. If your circumstances have changed, we completely understand.

Please feel free to reply to this email or reach out directly at {{recruiter_email}}.

Looking forward to hearing from you.

Best regards,
{{recruiter_name}}
{{recruiter_email}}
OneOrigin Talent Team', true) ON CONFLICT DO NOTHING;

INSERT INTO email_templates (id, job_id, stage, subject_template, body_template, is_active) VALUES (gen_random_uuid(), NULL, 'initial_screen_passed', 'Great News About Your {{job_title}} Application', 'Dear {{candidate_name}},

We have great news — you have successfully passed the initial screening for the {{job_title}} position at OneOrigin.

Your qualifications and experience made a strong impression, and we would like to invite you to the next stage of our interview process.

Here is what to expect in the next round:
- A focused discussion on your relevant project experience and technical expertise.
- Scenario-based questions related to the day-to-day responsibilities of the role.
- An opportunity for you to learn more about our team, culture, and the projects you would be working on.

We will be reaching out shortly with scheduling details.

Congratulations on advancing, and we look forward to the next conversation.

Best regards,
{{recruiter_name}}
{{recruiter_email}}
OneOrigin Talent Team', true) ON CONFLICT DO NOTHING;

INSERT INTO email_templates (id, job_id, stage, subject_template, body_template, is_active) VALUES (gen_random_uuid(), NULL, 'waitlisted', 'Your Application Status for {{job_title}}', 'Dear {{candidate_name}},

Thank you for your continued interest in the {{job_title}} position at OneOrigin. We wanted to provide you with a transparent update on the status of your application.

After careful review, we have placed your application on our active waitlist. This means that while we are currently progressing with a small number of candidates, your profile remains under strong consideration.

We expect to have more clarity within the next 2-3 weeks and will keep you informed either way.

In the meantime, your application remains active and no further action is needed from you.

We appreciate your patience and your interest in joining our team.

Kind regards,
{{recruiter_name}}
{{recruiter_email}}
OneOrigin Talent Team', true) ON CONFLICT DO NOTHING;;
