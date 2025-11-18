-- Create protected_files table to match frontend expectations
CREATE TABLE IF NOT EXISTS protected_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  legal_hash TEXT NOT NULL UNIQUE,
  content_hash TEXT NOT NULL,
  floral_hash TEXT NOT NULL,
  blockchain_tx TEXT NOT NULL,
  blockchain_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_protected_files_legal_hash ON protected_files(legal_hash);
CREATE INDEX IF NOT EXISTS idx_protected_files_user_id ON protected_files(user_id);
CREATE INDEX IF NOT EXISTS idx_protected_files_created ON protected_files(created_at DESC);

-- Enable RLS
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
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own protected files"
  ON protected_files
  FOR UPDATE
  USING (auth.uid() = user_id);

SELECT 'protected_files table created successfully!' as status;
