-- Purchases Table
-- Tracks all marketplace purchases and lease transactions
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id TEXT NOT NULL,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  checkout_id TEXT,
  payment_id TEXT,
  transaction_hash TEXT,
  status TEXT DEFAULT 'pending', -- pending, completed, failed, refunded
  purchase_type TEXT NOT NULL, -- 'sale' or 'lease'
  lease_duration TEXT, -- only for leases: '1 Month', '6 Months', '1 Year'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for purchases
CREATE INDEX IF NOT EXISTS idx_purchases_asset_id ON purchases(asset_id);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_seller ON purchases(seller_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_checkout_id ON purchases(checkout_id);

-- Enable RLS for purchases
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own purchases (as buyer or seller)
CREATE POLICY "Users can read own purchases"
  ON purchases
  FOR SELECT
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Policy: System can insert purchases (via API)
CREATE POLICY "System can insert purchases"
  ON purchases
  FOR INSERT
  WITH CHECK (true);

-- Policy: System can update purchases (via webhooks)
CREATE POLICY "System can update purchases"
  ON purchases
  FOR UPDATE
  USING (true);

-- Revenue Log Table (if not exists)
-- This may already exist, but we'll add it here in case
CREATE TABLE IF NOT EXISTS revenue_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_uid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_uid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  transaction_type TEXT NOT NULL, -- 'sale' or 'lease'
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for revenue_log
CREATE INDEX IF NOT EXISTS idx_revenue_seller ON revenue_log(seller_uid);
CREATE INDEX IF NOT EXISTS idx_revenue_buyer ON revenue_log(buyer_uid);
CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue_log(transaction_date);

-- Enable RLS for revenue_log
ALTER TABLE revenue_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own revenue
CREATE POLICY "Users can read own revenue"
  ON revenue_log
  FOR SELECT
  USING (seller_uid = auth.uid() OR buyer_uid = auth.uid());

-- Policy: System can insert revenue logs
CREATE POLICY "System can insert revenue"
  ON revenue_log
  FOR INSERT
  WITH CHECK (true);
