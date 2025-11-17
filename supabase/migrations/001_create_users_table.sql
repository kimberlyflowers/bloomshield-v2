-- Create users table for user profiles
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  wallet_seed_phrase TEXT NOT NULL, -- TODO: Encrypt this in production
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  account_type TEXT DEFAULT 'free' CHECK (account_type IN ('free', 'pro', 'business')),
  role TEXT DEFAULT 'creator' CHECK (role IN ('creator', 'buyer', 'both')),
  phone TEXT,
  bio TEXT,
  profile_photo TEXT,
  business_name TEXT,
  business_website TEXT,
  industry TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  email_verified BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on wallet_address for blockchain queries
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert their own data (for signup)
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call update_updated_at_column function
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create assets table (for protected files)
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floral_id TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  creator_name TEXT NOT NULL,
  creator_uid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creator_wallet TEXT NOT NULL,
  legal_hash TEXT NOT NULL,
  ipfs_hash TEXT,
  blockchain_tx TEXT NOT NULL,
  block_number TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_listed BOOLEAN DEFAULT FALSE,
  sale_price DECIMAL(10, 2) DEFAULT 0,
  allow_lease BOOLEAN DEFAULT FALSE,
  commercial_use BOOLEAN DEFAULT TRUE,
  attribution BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for assets
CREATE INDEX IF NOT EXISTS idx_assets_floral_id ON assets(floral_id);
CREATE INDEX IF NOT EXISTS idx_assets_creator ON assets(creator_uid);
CREATE INDEX IF NOT EXISTS idx_assets_listed ON assets(is_listed);
CREATE INDEX IF NOT EXISTS idx_assets_blockchain_tx ON assets(blockchain_tx);

-- Enable RLS for assets
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read listed assets
CREATE POLICY "Anyone can read listed assets"
  ON assets
  FOR SELECT
  USING (is_listed = true OR creator_uid = auth.uid());

-- Policy: Users can insert their own assets
CREATE POLICY "Users can insert own assets"
  ON assets
  FOR INSERT
  WITH CHECK (creator_uid = auth.uid());

-- Policy: Users can update their own assets
CREATE POLICY "Users can update own assets"
  ON assets
  FOR UPDATE
  USING (creator_uid = auth.uid());

-- Trigger for assets updated_at
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create leases table
CREATE TABLE IF NOT EXISTS leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floral_id TEXT NOT NULL REFERENCES assets(floral_id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  lessee_wallet TEXT NOT NULL,
  lessee_uid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lessee_name TEXT NOT NULL,
  owner_wallet TEXT NOT NULL,
  owner_uid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_days INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  blockchain_tx TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for leases
CREATE INDEX IF NOT EXISTS idx_leases_floral_id ON leases(floral_id);
CREATE INDEX IF NOT EXISTS idx_leases_lessee ON leases(lessee_uid);
CREATE INDEX IF NOT EXISTS idx_leases_owner ON leases(owner_uid);
CREATE INDEX IF NOT EXISTS idx_leases_active ON leases(active);

-- Enable RLS for leases
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read leases they're involved in
CREATE POLICY "Users can read own leases"
  ON leases
  FOR SELECT
  USING (lessee_uid = auth.uid() OR owner_uid = auth.uid());

-- Policy: Users can insert leases as lessee
CREATE POLICY "Users can create leases"
  ON leases
  FOR INSERT
  WITH CHECK (lessee_uid = auth.uid());
