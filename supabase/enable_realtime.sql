-- Enable Supabase Realtime for all required tables
-- Run this in Supabase SQL Editor

-- CRITICAL: This must be done for real-time updates to work!

-- 1. Existing tables
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS interview_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS interview_scope_packages;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS live_events;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS scores;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS ai_assessments;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS artifacts;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS voice_commands;

-- 2. NEW: Analytics tables
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS voice_transcripts;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS voice_analysis;

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
    'voice_commands',
    'voice_transcripts',
    'voice_analysis'
  )
ORDER BY tablename;
