# Blockchain Configuration Guide

BloomShield uses **ThirdWeb SDK** to create permanent blockchain timestamps on the **Polygon network**. This ensures that file protection records exist forever, independent of BloomShield's servers.

## Current Status

The app has a **fallback mechanism** that allows it to work without blockchain configuration:
- ✅ **With blockchain configured**: Real transactions on Polygon (tx hash starts with `0x` and is verifiable on PolygonScan)
- ⚠️ **Without blockchain configured**: Simulated transactions (tx hash starts with `0xSIM`)

## Required Environment Variables

Add these to your Vercel project's Environment Variables:

### 1. ThirdWeb Private Key
```
THIRDWEB_PRIVATE_KEY=your_private_key_here
```
- **What it does**: Signs blockchain transactions on your behalf
- **Security**: Server-side only, NEVER exposed to client
- **How to get**: ThirdWeb Dashboard → Settings → API Keys

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

### 4. Contract Address
```
THIRDWEB_CONTRACT_ADDRESS=0x_your_contract_address_here
```
- **What it does**: Points to your deployed timestamping smart contract on Polygon
- **Security**: Public value (safe to expose)
- **How to get**: Deploy contract via ThirdWeb or provide your existing contract address

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

### Step 3: Deploy Smart Contract
1. In ThirdWeb Dashboard, go to **Contracts** → **Deploy Contract**
2. Choose **Custom Contract** or use an existing timestamping contract
3. Deploy to **Polygon** network (mainnet or Mumbai testnet)
4. Copy the deployed contract address

### Step 4: Configure Vercel Environment Variables
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add all four variables listed above
4. Set them for **Production**, **Preview**, and **Development** environments
5. Redeploy your application

### Step 5: Verify Configuration
After redeploying, upload a test file and check the certificate:
- ✅ **Working**: Transaction hash starts with `0x` (e.g., `0x4a5b6c...`)
- ❌ **Not working**: Transaction hash starts with `0xSIM` (e.g., `0xSIM8f3e2a...`)

## Verification

### Check if blockchain is working:
1. Upload a file to BloomShield
2. View the certificate
3. Look at the "Blockchain Transaction" field:
   - **Real blockchain**: `0x` followed by 64 hex characters
   - **Simulated**: `0xSIM` followed by random characters

### Verify on PolygonScan:
1. Copy the transaction hash from certificate
2. Go to [PolygonScan](https://polygonscan.com/) (or Mumbai PolygonScan for testnet)
3. Paste the transaction hash in search
4. You should see the transaction details

## Cost Considerations

- **Polygon Network**: Very low gas fees (~$0.01 per transaction)
- **ThirdWeb**: Free tier includes generous transaction limits
- **Recommendation**: Start with Mumbai testnet for testing, then switch to mainnet for production

## Troubleshooting

### Issue: All transactions show 0xSIM
**Cause**: Environment variables not configured or incorrect
**Solution**:
1. Check Vercel Environment Variables are set
2. Verify all four variables are present
3. Redeploy after adding variables

### Issue: API returns 500 error
**Cause**: Invalid credentials or contract address
**Solution**:
1. Double-check ThirdWeb dashboard for correct values
2. Ensure private key has no extra spaces or quotes
3. Verify contract is deployed on Polygon network

### Issue: Transaction fails but doesn't fallback to 0xSIM
**Cause**: Network connectivity or rate limiting
**Solution**:
1. Check ThirdWeb service status
2. Verify API key has sufficient quota
3. Try again after a few minutes

## Files Using Blockchain

- **API Route**: `/app/api/blockchain/timestamp/route.ts` (lines 8-66)
  - Handles blockchain timestamping
  - Uses ThirdWeb SDK
  - Calls smart contract's `createTimestamp` function

- **Main App**: `/app/page.tsx` (lines 206-235)
  - Calls blockchain API
  - Implements fallback to simulated transactions
  - Stores transaction hash in certificate

## Smart Contract Interface

Your smart contract should have a `createTimestamp` function that accepts:
```solidity
function createTimestamp(
    string memory legalHash,
    string memory contentHash,
    string memory floralHash,
    string memory fileName
) public returns (bytes32)
```

## Security Notes

- ⚠️ **NEVER commit** `.env.local` to git (already in .gitignore)
- ⚠️ **NEVER expose** private keys or secret keys in client-side code
- ✅ **DO use** Vercel's encrypted environment variables
- ✅ **DO rotate** keys if they are ever exposed
- ✅ **DO use** testnet for development and testing

## Support

For ThirdWeb specific issues:
- [ThirdWeb Documentation](https://portal.thirdweb.com/)
- [ThirdWeb Discord](https://discord.gg/thirdweb)

For BloomShield issues:
- Check the console logs in browser developer tools
- Check Vercel function logs for API errors
- Verify all environment variables are set correctly
