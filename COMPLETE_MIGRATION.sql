-- =====================================================
-- BLOOMSHIELD COMPLETE DATABASE MIGRATION
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- MIGRATION 001: Users, Assets, and Leases Tables
-- =====================================================

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
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can read own data') THEN
    CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

-- Policy: Users can update their own data
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own data') THEN
    CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Policy: Users can insert their own data (for signup)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert own data') THEN
    CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call update_updated_at_column function
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
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
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assets' AND policyname = 'Anyone can read listed assets') THEN
    CREATE POLICY "Anyone can read listed assets" ON assets FOR SELECT USING (is_listed = true OR creator_uid = auth.uid());
  END IF;
END $$;

-- Policy: Users can insert their own assets
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assets' AND policyname = 'Users can insert own assets') THEN
    CREATE POLICY "Users can insert own assets" ON assets FOR INSERT WITH CHECK (creator_uid = auth.uid());
  END IF;
END $$;

-- Policy: Users can update their own assets
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assets' AND policyname = 'Users can update own assets') THEN
    CREATE POLICY "Users can update own assets" ON assets FOR UPDATE USING (creator_uid = auth.uid());
  END IF;
END $$;

-- Trigger for assets updated_at
DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
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
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leases' AND policyname = 'Users can read own leases') THEN
    CREATE POLICY "Users can read own leases" ON leases FOR SELECT USING (lessee_uid = auth.uid() OR owner_uid = auth.uid());
  END IF;
END $$;

-- Policy: Users can insert leases as lessee
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leases' AND policyname = 'Users can create leases') THEN
    CREATE POLICY "Users can create leases" ON leases FOR INSERT WITH CHECK (lessee_uid = auth.uid());
  END IF;
END $$;

-- =====================================================
-- MIGRATION 002: Storage Bucket
-- =====================================================

-- Create storage bucket for protected files
INSERT INTO storage.buckets (id, name, public)
VALUES ('protected-files', 'protected-files', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Policy: Users can upload their own files
CREATE POLICY "Users can upload own files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'protected-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can read their own files
CREATE POLICY "Users can read own files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'protected-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'protected-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'protected-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- MIGRATION 003: Revenue Tracking & Gas Wallet
-- =====================================================

-- Table to track revenue splits
CREATE TABLE IF NOT EXISTS revenue_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tier TEXT NOT NULL CHECK (tier IN ('VERIFY', 'SENTINEL_CREATOR', 'SENTINEL_STUDIO', 'SENTINEL_AGENCY')),
  total_amount DECIMAL(10, 2) NOT NULL,
  stripe_fee DECIMAL(10, 2) NOT NULL,
  gas_fund DECIMAL(10, 4) NOT NULL,
  profit DECIMAL(10, 2) NOT NULL,
  profit_margin DECIMAL(5, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track gas wallet holding account
CREATE TABLE IF NOT EXISTS gas_wallet_holding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tier TEXT NOT NULL,
  amount DECIMAL(10, 4) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'ETH')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converting', 'converted', 'transferred')),
  conversion_rate DECIMAL(10, 2),
  eth_amount DECIMAL(20, 10),
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Table to track actual gas usage
CREATE TABLE IF NOT EXISTS gas_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash TEXT NOT NULL UNIQUE,
  gas_cost_eth DECIMAL(20, 10) NOT NULL,
  gas_cost_usd DECIMAL(10, 4) NOT NULL,
  file_protection_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_revenue_log_user ON revenue_log(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_log_tier ON revenue_log(tier);
CREATE INDEX IF NOT EXISTS idx_revenue_log_created ON revenue_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gas_holding_status ON gas_wallet_holding(status);
CREATE INDEX IF NOT EXISTS idx_gas_holding_created ON gas_wallet_holding(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gas_usage_timestamp ON gas_usage_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gas_usage_user ON gas_usage_log(user_id);

-- View for gas wallet analytics
CREATE OR REPLACE VIEW gas_wallet_analytics AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  tier,
  SUM(gas_fund) as total_collected_usd,
  COUNT(*) as payment_count,
  AVG(gas_fund) as avg_per_payment,
  AVG(profit_margin) as avg_profit_margin
FROM revenue_log
GROUP BY DATE_TRUNC('day', created_at), tier
ORDER BY date DESC, tier;

-- View for monthly gas costs vs revenue
CREATE OR REPLACE VIEW monthly_gas_analysis AS
SELECT
  DATE_TRUNC('month', r.created_at) as month,
  r.tier,
  COUNT(DISTINCT r.user_id) as active_users,
  SUM(r.total_amount) as total_revenue,
  SUM(r.gas_fund) as total_gas_fund_collected,
  SUM(r.stripe_fee) as total_stripe_fees,
  SUM(r.profit) as total_profit,
  COALESCE(SUM(g.gas_cost_usd), 0) as actual_gas_spent,
  SUM(r.gas_fund) - COALESCE(SUM(g.gas_cost_usd), 0) as gas_fund_surplus
FROM revenue_log r
LEFT JOIN gas_usage_log g ON DATE_TRUNC('month', g.timestamp) = DATE_TRUNC('month', r.created_at)
GROUP BY DATE_TRUNC('month', r.created_at), r.tier
ORDER BY month DESC, tier;

-- View for pending gas wallet conversions
CREATE OR REPLACE VIEW pending_gas_conversions AS
SELECT
  status,
  currency,
  SUM(amount) as total_amount,
  COUNT(*) as transaction_count,
  MIN(created_at) as oldest_pending,
  MAX(created_at) as newest_pending
FROM gas_wallet_holding
WHERE status IN ('pending', 'converting')
GROUP BY status, currency;

-- Enable Row Level Security
ALTER TABLE revenue_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE gas_wallet_holding ENABLE ROW LEVEL SECURITY;
ALTER TABLE gas_usage_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin only read revenue_log" ON revenue_log;
DROP POLICY IF EXISTS "Admin only read gas_wallet_holding" ON gas_wallet_holding;
DROP POLICY IF EXISTS "Admin only read gas_usage_log" ON gas_usage_log;

-- RLS Policies: Admin only access
CREATE POLICY "Admin only read revenue_log"
  ON revenue_log
  FOR SELECT
  USING (false);

CREATE POLICY "Admin only read gas_wallet_holding"
  ON gas_wallet_holding
  FOR SELECT
  USING (false);

CREATE POLICY "Admin only read gas_usage_log"
  ON gas_usage_log
  FOR SELECT
  USING (false);

-- Comments for documentation
COMMENT ON TABLE revenue_log IS 'Tracks all subscription revenue and how it is split';
COMMENT ON TABLE gas_wallet_holding IS 'Holds USD allocated for gas wallet before conversion to ETH';
COMMENT ON TABLE gas_usage_log IS 'Tracks actual gas costs for each blockchain transaction';

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================

SELECT 'Migration completed successfully!' as status;
