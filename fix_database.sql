-- Quick fix for production database issues
-- Run this in your Supabase SQL editor

-- First, let's see what tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check if searches table exists and its structure
-- \d searches;

-- If searches table doesn't exist, create it
CREATE TABLE IF NOT EXISTS searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  zipcode TEXT NOT NULL,
  radius INTEGER NOT NULL CHECK (radius > 0 AND radius <= 50),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'payment_completed', 'calling_in_progress', 'completed', 'failed')),
  stripe_session_id TEXT UNIQUE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add missing columns if they don't exist
ALTER TABLE searches ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE searches ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE searches ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Update constraint to allow all needed status values
ALTER TABLE searches DROP CONSTRAINT IF EXISTS searches_status_check;
ALTER TABLE searches ADD CONSTRAINT searches_status_check 
CHECK (status IN ('pending', 'payment_completed', 'calling_in_progress', 'completed', 'failed'));

-- Add unique constraint on stripe_session_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_searches_stripe_session_id ON searches(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_searches_user_id ON searches(user_id);
CREATE INDEX IF NOT EXISTS idx_searches_status ON searches(status);
CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at DESC);

-- Create or replace the update trigger
CREATE OR REPLACE FUNCTION update_searches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_searches_updated_at ON searches;
CREATE TRIGGER trigger_update_searches_updated_at
    BEFORE UPDATE ON searches
    FOR EACH ROW
    EXECUTE FUNCTION update_searches_updated_at();

-- Enable RLS if not already enabled
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own searches" ON searches;
DROP POLICY IF EXISTS "Users can insert own searches" ON searches;
DROP POLICY IF EXISTS "Users can update own searches" ON searches;
DROP POLICY IF EXISTS "Service role can manage all searches" ON searches;

-- Create RLS policies
CREATE POLICY "Users can view own searches" ON searches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own searches" ON searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own searches" ON searches
  FOR UPDATE USING (auth.uid() = user_id);

-- Add policy for service role (webhooks and admin operations)
CREATE POLICY "Service role can manage all searches" ON searches
  FOR ALL USING (auth.role() = 'service_role');

-- Check the final structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'searches' 
ORDER BY ordinal_position;