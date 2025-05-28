-- First, enable RLS on the table if not already enabled
ALTER TABLE duffel_jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON duffel_jobs;
DROP POLICY IF EXISTS "Enable update access for all users" ON duffel_jobs;
DROP POLICY IF EXISTS "Enable insert access for all users" ON duffel_jobs;

-- Create new policies
-- Allow anyone to read job data (needed for Realtime)
CREATE POLICY "Enable read access for all users" 
ON duffel_jobs FOR SELECT 
USING (true);

-- Allow anyone to update job data (needed for Realtime)
CREATE POLICY "Enable update access for all users" 
ON duffel_jobs FOR UPDATE 
USING (true);

-- Allow anyone to insert new jobs
CREATE POLICY "Enable insert access for all users" 
ON duffel_jobs FOR INSERT 
WITH CHECK (true);

-- Verify the policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'duffel_jobs'
ORDER BY policyname; 