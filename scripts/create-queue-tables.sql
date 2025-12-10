-- Create Queue Management Tables for Supabase
-- Run this in your Supabase SQL Editor

-- Step 1: Create queue_jobs table (updated for Supabase Auth)
CREATE TABLE IF NOT EXISTS queue_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
  pharmacy_id TEXT NOT NULL,
  pharmacy_name TEXT NOT NULL,
  pharmacy_phone TEXT NOT NULL,
  pharmacy_address TEXT NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Updated for Supabase Auth
  
  -- Job management
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retry_scheduled')),
  attempt INTEGER NOT NULL DEFAULT 1,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  
  -- QStash integration
  qstash_message_id TEXT UNIQUE, -- Store QStash message ID for tracking
  
  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Results
  result_data JSONB, -- Store call results: {availability: boolean, price: number, notes: string, confidence: number}
  error_message TEXT,
  
  -- Rate limiting
  CONSTRAINT unique_pharmacy_per_search UNIQUE (search_id, pharmacy_id)
);

-- Step 2: Create calls table
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES queue_jobs(id) ON DELETE CASCADE,
  pharmacy_id TEXT NOT NULL,
  pharmacy_phone TEXT NOT NULL,
  
  -- Call details
  call_provider TEXT NOT NULL DEFAULT 'mock', -- 'twilio', 'vapi', 'retell', 'mock'
  provider_call_id TEXT, -- External call ID from provider
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'answered', 'completed', 'failed', 'no_answer', 'busy')),
  
  -- Timing
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Recording
  recording_url TEXT,
  transcript TEXT,
  
  -- Results
  extracted_data JSONB, -- AI-extracted structured data
  confidence_score DECIMAL(3,2) DEFAULT 0.0, -- 0.0 to 1.0
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_queue_jobs_search_id ON queue_jobs(search_id);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_status ON queue_jobs(status);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_scheduled_for ON queue_jobs(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_qstash_message_id ON queue_jobs(qstash_message_id);

CREATE INDEX IF NOT EXISTS idx_calls_search_id ON calls(search_id);
CREATE INDEX IF NOT EXISTS idx_calls_job_id ON calls(job_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);

-- Step 4: Create helper views
CREATE OR REPLACE VIEW pharmacy_last_called AS
SELECT 
  pharmacy_id,
  MAX(completed_at) as last_called_at
FROM queue_jobs 
WHERE status = 'completed' AND completed_at IS NOT NULL
GROUP BY pharmacy_id;

CREATE OR REPLACE VIEW queue_stats AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'pending') as pending_jobs,
  COUNT(*) FILTER (WHERE status = 'processing') as processing_jobs,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_jobs,
  COUNT(*) FILTER (WHERE status = 'retry_scheduled') as retry_scheduled_jobs,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) FILTER (WHERE status = 'completed') as avg_processing_time_seconds
FROM queue_jobs
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Step 5: Enable RLS (Row Level Security) on new tables
ALTER TABLE queue_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Step 6: Add permissive policies for testing
CREATE POLICY "Allow all operations on queue_jobs" ON queue_jobs FOR ALL USING (true);
CREATE POLICY "Allow all operations on calls" ON calls FOR ALL USING (true);

-- Step 7: Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Step 8: Verify tables were created
SELECT 'queue_jobs' as table_name, count(*) as record_count FROM queue_jobs
UNION ALL
SELECT 'calls' as table_name, count(*) as record_count FROM calls
UNION ALL
SELECT 'searches' as table_name, count(*) as record_count FROM searches;

-- Success message
SELECT 'Queue tables created successfully!' as status;