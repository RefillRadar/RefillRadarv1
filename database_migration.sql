-- Update the searches table status check constraint to allow new status values
-- Run this in your Supabase SQL editor

-- First, drop the existing constraint
ALTER TABLE searches DROP CONSTRAINT IF EXISTS searches_status_check;

-- Add a new constraint with all the status values we need
ALTER TABLE searches ADD CONSTRAINT searches_status_check 
CHECK (status IN (
  'pending',           -- Initial status when search is created
  'payment_completed', -- After payment is successful, ready for calling
  'calling_in_progress', -- Admin has started the calling process
  'completed',         -- Search is finished, results delivered
  'failed'            -- Search failed for some reason
));

-- Add stripe_session_id column for deduplication
ALTER TABLE searches ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- Add unique index on stripe_session_id to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_searches_stripe_session_id ON searches(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_searches_status ON searches(status);
CREATE INDEX IF NOT EXISTS idx_searches_user_status ON searches(user_id, status);

-- Add required columns used by the application
ALTER TABLE searches ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE searches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE searches ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE searches ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add trigger to automatically update updated_at
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

-- Add index on created_at for performance
CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at DESC);

-- View the current table structure to verify
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'searches' 
-- ORDER BY ordinal_position;