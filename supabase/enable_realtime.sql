-- Enable Supabase Realtime for all required tables
-- Run this in Supabase SQL Editor

-- CRITICAL: This must be done for real-time updates to work!
-- Without this, the interviewer view will NOT update during calls.

-- 1. Enable replication for interview_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE interview_sessions;

-- 2. Enable replication for interview_scope_packages (round status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE interview_scope_packages;

-- 3. Enable replication for live_events (transcript, actions)
ALTER PUBLICATION supabase_realtime ADD TABLE live_events;

-- 4. Enable replication for scores (gate panel data)
ALTER PUBLICATION supabase_realtime ADD TABLE scores;

-- 5. Enable replication for ai_assessments (AI observations)
ALTER PUBLICATION supabase_realtime ADD TABLE ai_assessments;

-- 6. Enable replication for artifacts (optional, but recommended)
ALTER PUBLICATION supabase_realtime ADD TABLE artifacts;

-- Verify replication is enabled
SELECT
  schemaname,
  tablename,
  CASE
    WHEN tablename = ANY(
      SELECT tablename
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
    ) THEN 'ENABLED ✅'
    ELSE 'DISABLED ❌'
  END as realtime_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'interview_sessions',
    'interview_scope_packages',
    'live_events',
    'scores',
    'ai_assessments',
    'artifacts',
    'voice_commands'
  )
ORDER BY tablename;
