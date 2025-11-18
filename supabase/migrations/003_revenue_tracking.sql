-- Revenue Tracking & Gas Wallet Management Tables
-- Migration 003: Auto-funding system for gas wallet from subscription revenue

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

-- Table to track gas wallet holding account (USD waiting to be converted to ETH)
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

-- RLS Policies: Admin only access (these are financial records)
-- Note: Service role bypasses RLS, so API routes with service role key can access

CREATE POLICY "Admin only read revenue_log"
  ON revenue_log
  FOR SELECT
  USING (false); -- No direct client access

CREATE POLICY "Admin only read gas_wallet_holding"
  ON gas_wallet_holding
  FOR SELECT
  USING (false);

CREATE POLICY "Admin only read gas_usage_log"
  ON gas_usage_log
  FOR SELECT
  USING (false);

-- Comments for documentation
COMMENT ON TABLE revenue_log IS 'Tracks all subscription revenue and how it is split (Stripe fees, gas fund, profit)';
COMMENT ON TABLE gas_wallet_holding IS 'Holds USD allocated for gas wallet before conversion to ETH';
COMMENT ON TABLE gas_usage_log IS 'Tracks actual gas costs for each blockchain transaction';
COMMENT ON VIEW gas_wallet_analytics IS 'Daily analytics of gas fund collection by tier';
COMMENT ON VIEW monthly_gas_analysis IS 'Monthly comparison of gas fund collected vs actual gas spent';
COMMENT ON VIEW pending_gas_conversions IS 'Summary of pending USD to ETH conversions';
