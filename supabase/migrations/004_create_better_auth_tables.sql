-- Better Auth Tables
-- Creates all required tables for Better Auth with additional fields

-- User table (Better Auth)
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Custom fields for BloomShield
  wallet_address TEXT NOT NULL,
  wallet_seed_phrase TEXT NOT NULL,
  account_type TEXT DEFAULT 'free',
  role TEXT DEFAULT 'creator',
  phone TEXT,
  bio TEXT,
  profile_photo TEXT,
  business_name TEXT,
  business_website TEXT,
  industry TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  two_factor_enabled BOOLEAN DEFAULT false
);

-- Session table (Better Auth)
CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

-- Account table (Better Auth - for OAuth providers)
CREATE TABLE IF NOT EXISTS "account" (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  expires_at TIMESTAMP,
  scope TEXT,
  password TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Verification table (Better Auth - for email verification)
CREATE TABLE IF NOT EXISTS "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_user_id ON "session"(user_id);
CREATE INDEX IF NOT EXISTS idx_session_token ON "session"(token);
CREATE INDEX IF NOT EXISTS idx_account_user_id ON "account"(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_identifier ON "verification"(identifier);
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
CREATE INDEX IF NOT EXISTS idx_user_wallet ON "user"(wallet_address);

-- Enable RLS (Row Level Security)
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user table
CREATE POLICY "Users can read own data" ON "user"
  FOR SELECT USING (id = current_setting('app.current_user_id', true)::text);

CREATE POLICY "Users can update own data" ON "user"
  FOR UPDATE USING (id = current_setting('app.current_user_id', true)::text);

-- RLS Policies for session table
CREATE POLICY "Users can read own sessions" ON "session"
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true)::text);

CREATE POLICY "Users can delete own sessions" ON "session"
  FOR DELETE USING (user_id = current_setting('app.current_user_id', true)::text);

-- Service role can do everything (for Better Auth operations)
CREATE POLICY "Service role has full access to user" ON "user"
  FOR ALL USING (current_setting('app.service_role', true)::text = 'true');

CREATE POLICY "Service role has full access to session" ON "session"
  FOR ALL USING (current_setting('app.service_role', true)::text = 'true');

CREATE POLICY "Service role has full access to account" ON "account"
  FOR ALL USING (current_setting('app.service_role', true)::text = 'true');

CREATE POLICY "Service role has full access to verification" ON "verification"
  FOR ALL USING (current_setting('app.service_role', true)::text = 'true');
