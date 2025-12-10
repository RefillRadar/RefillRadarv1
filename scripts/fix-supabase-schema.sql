-- Fix Supabase Schema Cache Issue
-- Run this in your Supabase SQL Editor to resolve PGRST205 error

-- Step 1: Refresh the PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Step 2: Enable RLS (Row Level Security) on queue tables
ALTER TABLE queue_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Step 3: Add permissive policies for testing (allows all operations)
-- Note: In production, you'll want more restrictive policies

-- Policy for queue_jobs table
CREATE POLICY "Allow all operations on queue_jobs" ON queue_jobs FOR ALL USING (true);

-- Policy for calls table  
CREATE POLICY "Allow all operations on calls" ON calls FOR ALL USING (true);

-- Step 4: Verify tables are now accessible
SELECT 'queue_jobs' as table_name, count(*) as record_count FROM queue_jobs
UNION ALL
SELECT 'calls' as table_name, count(*) as record_count FROM calls
UNION ALL
SELECT 'searches' as table_name, count(*) as record_count FROM searches;

-- Step 5: Create test search data if needed
INSERT INTO searches (
  id,
  medication_name,
  dosage,
  zipcode,
  radius,
  status,
  metadata,
  created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Lisinopril',
  '10mg',
  '10001',
  10,
  'payment_completed',
  '{
    "selected_pharmacies": [
      {
        "id": "cvs_001",
        "name": "CVS Pharmacy #1",
        "phone": "555-0123",
        "address": "123 Main St, New York, NY 10001"
      },
      {
        "id": "walgreens_001",
        "name": "Walgreens #2", 
        "phone": "555-0456",
        "address": "456 Broadway, New York, NY 10001"
      }
    ],
    "payment_type": "pay-as-you-go",
    "payment_amount": 2
  }'::jsonb,
  NOW()
) ON CONFLICT (id) DO UPDATE SET 
  metadata = EXCLUDED.metadata,
  status = EXCLUDED.status;

-- Final verification
SELECT 'Schema cache refreshed and RLS policies added' as status;