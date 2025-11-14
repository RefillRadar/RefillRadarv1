-- Create searches table to store user medication searches
CREATE TABLE searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  zipcode TEXT NOT NULL,
  radius INTEGER NOT NULL CHECK (radius > 0 AND radius <= 50),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create search_results table to store pharmacy results for each search
CREATE TABLE search_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  search_id UUID REFERENCES searches(id) ON DELETE CASCADE,
  pharmacy_id TEXT NOT NULL, -- Google Place ID or other external pharmacy ID
  pharmacy_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  price DECIMAL(10, 2), -- Price in dollars
  availability BOOLEAN DEFAULT false,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  last_called TIMESTAMP WITH TIME ZONE,
  notes TEXT, -- Any additional notes from the call
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_searches_user_id ON searches(user_id);
CREATE INDEX idx_searches_created_at ON searches(created_at DESC);
CREATE INDEX idx_search_results_search_id ON search_results(search_id);
CREATE INDEX idx_search_results_availability ON search_results(availability);

-- Enable Row Level Security (RLS)
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for searches table
CREATE POLICY "Users can view own searches" ON searches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own searches" ON searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own searches" ON searches
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for search_results table
CREATE POLICY "Users can view own search results" ON search_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM searches 
      WHERE searches.id = search_results.search_id 
      AND searches.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert search results" ON search_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM searches 
      WHERE searches.id = search_results.search_id 
      AND searches.user_id = auth.uid()
    )
  );

CREATE POLICY "System can update search results" ON search_results
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM searches 
      WHERE searches.id = search_results.search_id 
      AND searches.user_id = auth.uid()
    )
  );

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at for searches
CREATE TRIGGER update_searches_updated_at BEFORE UPDATE ON searches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();