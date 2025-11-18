# Blockchain Configuration Guide

BloomShield uses **ThirdWeb SDK** to create permanent blockchain timestamps on the **Base network** (Coinbase Layer 2). This ensures that file protection records exist forever, independent of BloomShield's servers.

## Why Base Network?

- **90% cheaper gas fees**: $0.0005 vs $0.005 per transaction (compared to Polygon)
- **Faster confirmations**: 1-2 seconds vs 2-3 seconds
- **Coinbase backing**: Trusted infrastructure with excellent uptime
- **Same security**: Ethereum L2 with full immutability guarantees
- **Better economics**: Perfect for high-volume file protection platform

**Cost Example:**
- 1,000 files on Polygon: $5.00 in gas fees
- 1,000 files on Base: $0.50 in gas fees
- **Savings: $4.50 (90%)**

---

## Current Status

The app has a **fallback mechanism** that allows it to work without blockchain configuration:
- ✅ **With blockchain configured**: Real transactions on Base (tx hash starts with `0x` and is verifiable on BaseScan)
- ⚠️ **Without blockchain configured**: Simulated transactions (tx hash starts with `0xSIM`)

---

## Required Environment Variables

Add these to your Vercel project's Environment Variables:

### 1. ThirdWeb Private Key
```
THIRDWEB_PRIVATE_KEY=0x_your_private_key_here
```
- **What it does**: Signs blockchain transactions on your behalf
- **Security**: Server-side only, NEVER exposed to client
- **How to get**: ThirdWeb Dashboard → Settings → Wallets → Export Private Key
- **Important**: Uses ETH for gas on Base network (not MATIC)

### 2. ThirdWeb Client ID
```
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id_here
```
- **What it does**: Identifies your ThirdWeb application
- **Security**: Public value (safe to expose)
- **How to get**: ThirdWeb Dashboard → Settings → API Keys

### 3. ThirdWeb Secret Key
```
THIRDWEB_SECRET_KEY=your_secret_key_here
```
- **What it does**: Authenticates server-side API calls
- **Security**: Server-side only, NEVER exposed to client
- **How to get**: ThirdWeb Dashboard → Settings → API Keys

### 4. Contract Address (Base Network)
```
THIRDWEB_CONTRACT_ADDRESS=0x_your_contract_address_here
```
- **What it does**: Points to your deployed timestamping smart contract on Base
- **Security**: Public value (safe to expose)
- **How to get**: Deploy contract via ThirdWeb on Base network

---

## Setup Steps

### Step 1: Create ThirdWeb Account
1. Go to [ThirdWeb Dashboard](https://thirdweb.com/dashboard)
2. Sign up or log in
3. Create a new project

### Step 2: Get API Keys
1. In ThirdWeb Dashboard, go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Copy the following values:
   - Client ID
   - Secret Key
4. For the private key, go to **Wallets** section and export your wallet's private key

### Step 3: Deploy Smart Contract on Base
1. In ThirdWeb Dashboard, go to **Contracts** → **Deploy Contract**
2. Choose **Custom Contract** or use an existing timestamping contract
3. **IMPORTANT**: Deploy to **Base** network (not Polygon!)
   - Select "Base" from network dropdown
   - For testing: Use "Base Sepolia" testnet
   - For production: Use "Base" mainnet
4. Copy the deployed contract address

### Step 4: Fund Your Wallet with ETH
**Important:** Base uses ETH for gas fees (not MATIC)

1. Send ETH to your wallet address: `0xeaC170fC30d25fE9997810260aAB01E3553a85C0`
2. Recommended initial amount: $10-20 worth of ETH
3. Where to get ETH:
   - Buy on Coinbase and bridge to Base network
   - Use Base bridge: https://bridge.base.org
   - Buy directly on Base via on-ramps

### Step 5: Configure Vercel Environment Variables
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add all four variables listed above
4. Set them for **Production**, **Preview**, and **Development** environments
5. Redeploy your application

### Step 6: Verify Configuration
After redeploying, upload a test file and check the certificate:
- ✅ **Working**: Transaction hash starts with `0x` (e.g., `0x4a5b6c...`)
- ❌ **Not working**: Transaction hash starts with `0xSIM` (e.g., `0xSIM8f3e2a...`)

---

## Verification

### Check if blockchain is working:
1. Upload a file to BloomShield
2. View the certificate
3. Look at the "Blockchain Transaction" field:
   - **Real blockchain**: `0x` followed by 64 hex characters
   - **Simulated**: `0xSIM` followed by random characters

### Verify on BaseScan:
1. Copy the transaction hash from certificate
2. Go to [BaseScan](https://basescan.org/) (or Base Sepolia scan for testnet)
3. Paste the transaction hash in search
4. You should see the transaction details with:
   - Block number
   - Timestamp
   - Gas used
   - Contract interaction details

---

## Automated Gas Wallet Funding

BloomShield includes an **automated self-funding system** that allocates a portion of subscription revenue to maintain the gas wallet. This ensures the platform can continue protecting user files without manual intervention.

### How It Works:

```
User pays subscription → Revenue is automatically split:
├─ 3% → Stripe fees
├─ 0.5% → Gas wallet fund (auto-allocated)
└─ 96.5% → Your profit

Gas fund accumulates → Converts to ETH monthly → Funds wallet automatically
```

### Configuration Required:

1. **Run Database Migration:**
   ```sql
   -- Execute in Supabase SQL Editor:
   supabase/migrations/003_revenue_tracking.sql
   ```

2. **Set up Stripe Webhook:**
   ```
   Stripe Dashboard → Developers → Webhooks → Add endpoint
   Endpoint URL: https://your-domain.com/api/stripe/webhook
   Events: payment_intent.succeeded, customer.subscription.created
   ```

3. **Add Stripe Environment Variables:**
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### Monitoring Gas Wallet:

Query analytics views:
```sql
-- Check current gas fund status
SELECT * FROM pending_gas_conversions;

-- View monthly gas costs vs revenue
SELECT * FROM monthly_gas_analysis;

-- Daily gas fund collection
SELECT * FROM gas_wallet_analytics;
```

---

## Cost Breakdown by Tier

Based on your BLOOM subscription tiers:

| Tier | Price | Files/Month | Gas Cost (Base) | Gas % of Revenue |
|------|-------|-------------|-----------------|------------------|
| VERIFY | $19 | 5 | $0.0025 | 0.01% |
| SENTINEL Creator | $49 | 50 | $0.025 | 0.05% |
| SENTINEL Studio | $99 | 200 | $0.10 | 0.10% |
| SENTINEL Agency | $999 | 1,000 | $0.50 | 0.05% |

**At scale (10,000 users/month):**
- Total gas costs: ~$1,000/month
- Total revenue: ~$500,000/month
- Gas as % of revenue: **0.2%** (negligible!)

---

## Cost Considerations

- **Base Network**: Extremely low gas fees (~$0.0005 per transaction)
- **ThirdWeb**: Free tier includes generous transaction limits
- **ETH Requirements**: ~$10-20 initial funding, then self-funding via subscriptions
- **Recommendation**:
  - Start with Base Sepolia testnet for testing (free test ETH)
  - Switch to Base mainnet for production (real ETH required)

---

## Troubleshooting

### Issue: Transactions failing with "insufficient funds"
**Solution:** Your wallet needs more ETH for gas fees
```
1. Check balance: View your wallet on BaseScan
2. Send more ETH to: 0xeaC170fC30d25fE9997810260aAB01E3553a85C0
3. Wait 1-2 minutes for confirmation
4. Try protecting a file again
```

### Issue: Transaction hash starts with "0xSIM"
**Solution:** Blockchain not configured properly
```
1. Verify all 4 environment variables are set in Vercel
2. Check that contract address is on Base network (not Polygon)
3. Ensure private key has ETH balance
4. Redeploy Vercel application
```

### Issue: Contract call fails
**Solution:** Contract may not be deployed on Base
```
1. Go to BaseScan.org
2. Search for your contract address
3. Verify it shows as deployed
4. If not found, deploy new contract on Base network
```

### Issue: Gas costs too high
**Solution:** Double-check you're on Base, not Ethereum mainnet
```
Base network: ~$0.0005 per transaction ✅
Ethereum mainnet: ~$5-50 per transaction ❌

Verify in code: Should say 'base', not 'mainnet' or 'ethereum'
```

---

## Migration from Polygon

If you previously used Polygon, here's what changed:

### What's Different:
- ✅ Network: Polygon → Base
- ✅ Gas Token: MATIC → ETH
- ✅ Gas Cost: $0.005 → $0.0005 (90% cheaper!)
- ✅ Explorer: PolygonScan → BaseScan
- ✅ Contract: Need to deploy new contract on Base

### What's the SAME:
- ✅ Security: Still immutable blockchain records
- ✅ User experience: No visible changes
- ✅ Legal validity: Still admissible evidence
- ✅ Independence: Still works without BloomShield
- ✅ Ownership: Still tied to user wallet addresses

### User Data Protection:
**Old Polygon records remain valid forever!**
- Users with files protected on Polygon: Records still exist on Polygon blockchain
- New files: Protected on Base blockchain
- Both are equally valid and permanent
- No data loss or migration needed

---

## Files Modified for Base Network

The following files were updated in the migration:

1. `app/api/blockchain/timestamp/route.ts` - Changed from 'polygon' to 'base'
2. `.env.example` - Updated comments and network references
3. `BLOCKCHAIN_SETUP.md` - This document (comprehensive update)
4. Explorer URLs: PolygonScan → BaseScan

**Code change was literally 2 lines:**
```typescript
// Before:
const sdk = ThirdwebSDK.fromPrivateKey(privateKey, 'polygon', options)

// After:
const sdk = ThirdwebSDK.fromPrivateKey(privateKey, 'base', options)
```

---

## Additional Resources

- [Base Network Docs](https://docs.base.org/)
- [ThirdWeb Base SDK](https://portal.thirdweb.com/typescript/v5/base)
- [BaseScan Explorer](https://basescan.org/)
- [Base Bridge](https://bridge.base.org/)
- [Get Test ETH](https://www.alchemy.com/faucets/base-sepolia) (for Base Sepolia testnet)

---

**Questions?** See [ENV_FILE_DISAPPEARING_ISSUE.md](./ENV_FILE_DISAPPEARING_ISSUE.md) for environment variable troubleshooting or [VERCEL_VS_LOCAL_ENV.md](./VERCEL_VS_LOCAL_ENV.md) for deployment configuration.
