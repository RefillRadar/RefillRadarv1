-- Fix RLS policies for admin panel access
-- Run this in Supabase SQL Editor

-- Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('searches', 'queue_jobs', 'calls')
AND schemaname = 'public';

-- Enable RLS on searches table if not enabled
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for admin access (for testing)
DROP POLICY IF EXISTS "Allow admin read access to searches" ON searches;
CREATE POLICY "Allow admin read access to searches" ON searches
FOR SELECT USING (true);

-- Also ensure insert/update policies exist for admin operations
DROP POLICY IF EXISTS "Allow admin write access to searches" ON searches;
CREATE POLICY "Allow admin write access to searches" ON searches
FOR ALL USING (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'searches' 
AND schemaname = 'public';

-- Also fix queue_jobs and calls tables
DROP POLICY IF EXISTS "Allow all access to queue_jobs" ON queue_jobs;
CREATE POLICY "Allow all access to queue_jobs" ON queue_jobs FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to calls" ON calls;  
CREATE POLICY "Allow all access to calls" ON calls FOR ALL USING (true);

-- Refresh the PostgREST schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'RLS policies updated for admin access' as status;