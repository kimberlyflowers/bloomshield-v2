-- Create protected_files table
CREATE TABLE IF NOT EXISTS protected_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  legal_hash TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  floral_hash TEXT NOT NULL UNIQUE,
  blockchain_tx TEXT NOT NULL,
  blockchain_timestamp TIMESTAMP WITH TIME ZONE,
  ipfs_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for protected_files
CREATE INDEX IF NOT EXISTS idx_protected_files_user ON protected_files(user_id);
CREATE INDEX IF NOT EXISTS idx_protected_files_floral_hash ON protected_files(floral_hash);
CREATE INDEX IF NOT EXISTS idx_protected_files_created ON protected_files(created_at DESC);

-- Enable RLS for protected_files
ALTER TABLE protected_files ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own files
CREATE POLICY "Users can read own protected files"
  ON protected_files
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own files
CREATE POLICY "Users can insert own protected files"
  ON protected_files
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own protected files"
  ON protected_files
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own protected files"
  ON protected_files
  FOR DELETE
  USING (auth.uid() = user_id);
