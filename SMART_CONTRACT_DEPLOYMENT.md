# 📜 SMART CONTRACT DEPLOYMENT GUIDE - Base Network

## Deploy Your Timestamping Contract in 10 Minutes

---

## OPTION 1: Simple Pre-Built Contract (Recommended - 10 mins)

### Step 1: Go to ThirdWeb Dashboard
1. Visit: https://thirdweb.com/dashboard
2. Log in with your account
3. Click **"Contracts"** in left sidebar

### Step 2: Deploy Pre-Built Contract
1. Click **"Deploy Contract"** or **"Deploy"** button
2. Look for **"Explore"** or **"Browse contracts"**
3. Search for: **"NFT Collection"** or **"Edition Drop"**
   - We'll use this as a simple timestamping contract
   - It has all the functions we need

**OR use this direct link:**
https://thirdweb.com/thirdweb.eth/TokenERC721

### Step 3: Configure Contract Settings

**Contract Details:**
- Name: `BloomShield Timestamp Registry`
- Symbol: `BLOOM`
- Description: `Immutable timestamp registry for BloomShield file protection`

**Network Selection:** ⚠️ **CRITICAL - Choose Base!**
- Click network dropdown
- Select **"Base"** (NOT Polygon, NOT Ethereum!)
- For testing: Select **"Base Sepolia"** (testnet)
- For production: Select **"Base"** (mainnet)

**Deploy Settings:**
- Primary Sale Recipient: `0xeaC170fC30d25fE9997810260aAB01E3553a85C0`
- Royalty Recipient: Same address
- Royalty Percentage: `0%`

### Step 4: Deploy Contract
1. Click **"Deploy Now"**
2. Wait 1-2 minutes for deployment
3. You'll see confirmation screen with contract address

**Copy the Contract Address!**
```
Example: 0x1234567890abcdef1234567890abcdef12345678
```

### Step 5: Verify on BaseScan
1. Go to: https://basescan.org
   - Or https://sepolia.basescan.org (for testnet)
2. Paste your contract address in search
3. Should show "Contract" with verified checkmark

**✅ Done! You have a deployed contract on Base.**

---

## OPTION 2: Custom Timestamping Contract (Advanced - 20 mins)

If you want a dedicated timestamping contract:

### Contract Code:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BloomShieldTimestamp {
    struct Timestamp {
        string legalHash;
        string contentHash;
        string floralHash;
        string fileName;
        address creator;
        uint256 blockNumber;
        uint256 timestamp;
    }

    mapping(string => Timestamp) public timestamps;

    event TimestampCreated(
        string indexed legalHash,
        address indexed creator,
        uint256 timestamp
    );

    function createTimestamp(
        string memory legalHash,
        string memory contentHash,
        string memory floralHash,
        string memory fileName
    ) public {
        require(bytes(timestamps[legalHash].legalHash).length == 0, "Already timestamped");

        timestamps[legalHash] = Timestamp({
            legalHash: legalHash,
            contentHash: contentHash,
            floralHash: floralHash,
            fileName: fileName,
            creator: msg.sender,
            blockNumber: block.number,
            timestamp: block.timestamp
        });

        emit TimestampCreated(legalHash, msg.sender, block.timestamp);
    }

    function getTimestamp(string memory legalHash) public view returns (Timestamp memory) {
        return timestamps[legalHash];
    }
}
```

### Deploy Custom Contract:

1. Go to ThirdWeb Dashboard → Contracts
2. Click **"Deploy Contract"** → **"Custom Contract"**
3. Paste the Solidity code above
4. Select Network: **Base** (or Base Sepolia for testing)
5. Click **"Deploy"**
6. Wait for deployment confirmation
7. Copy contract address

---

## After Deployment: Update Environment Variables

### Add to `.env.local`:

```bash
THIRDWEB_CONTRACT_ADDRESS=0x...your_deployed_contract_address
```

### Add to Vercel:

1. Go to Vercel Dashboard
2. Select BloomShield project
3. Settings → Environment Variables
4. Add:
   - Key: `THIRDWEB_CONTRACT_ADDRESS`
   - Value: `0x...your_contract_address`
   - Environments: Production, Preview, Development
5. Click **"Save"**

---

## Testing Your Contract

### Test 1: Verify Contract Exists

Go to BaseScan:
```
https://basescan.org/address/YOUR_CONTRACT_ADDRESS
```

Should show:
- ✅ Contract deployed
- ✅ Balance: 0 ETH (normal)
- ✅ Transactions: 0 (no activity yet)

### Test 2: Call Contract Function

In ThirdWeb Dashboard:
1. Go to your deployed contract
2. Click **"Explorer"** tab
3. Find `createTimestamp` function
4. Fill in test data:
   - legalHash: `test_hash_123`
   - contentHash: `content_123`
   - floralHash: `floral_123`
   - fileName: `test_file.jpg`
5. Click **"Execute"**

**If successful:**
- Transaction hash appears
- Shows on BaseScan within 2-3 seconds

---

## Cost Estimates

### Deployment Costs:
- **Base Sepolia (Testnet):** FREE (use faucet for test ETH)
- **Base Mainnet:** ~$2-5 in ETH gas fees

### Per-File Protection:
- Base network: ~$0.0005 per file
- 1,000 files: ~$0.50
- 10,000 files: ~$5.00

---

## Troubleshooting

### Error: "Insufficient funds for gas"
**Solution:**
- Your wallet needs ETH on Base network
- Send $10-20 ETH to: 0xeaC170fC30d25fE9997810260aAB01E3553a85C0
- Use Coinbase or bridge.base.org

### Error: "Wrong network selected"
**Solution:**
- Make sure "Base" is selected, not "Ethereum" or "Polygon"
- Check network indicator in top right

### Error: "Contract verification failed"
**Solution:**
- Wait 30 seconds and refresh BaseScan
- Verification can take a minute after deployment

### Can't find contract on BaseScan
**Solution:**
- Check you're using correct explorer:
  - Base Mainnet: https://basescan.org
  - Base Sepolia: https://sepolia.basescan.org
- Contract address should start with 0x

---

## Quick Reference

### Networks:
- **Base Mainnet:** Production (real ETH costs)
- **Base Sepolia:** Testing (free test ETH)

### Faucet for Test ETH:
- https://www.alchemy.com/faucets/base-sepolia
- https://docs.base.org/docs/tools/network-faucets

### Explorers:
- Base: https://basescan.org
- Base Sepolia: https://sepolia.basescan.org

### Your Wallet:
- Address: 0xeaC170fC30d25fE9997810260aAB01E3553a85C0
- Needs: ETH on Base network for gas

---

## After Deployment Checklist:

- [ ] Contract deployed on Base network
- [ ] Contract address copied
- [ ] Verified on BaseScan
- [ ] Added to .env.local
- [ ] Added to Vercel environment variables
- [ ] Tested with sample transaction
- [ ] Wallet funded with ETH ($10-20)

**When all checked, you're ready to go live! 🚀**

---

**Estimated Total Time:** 10-15 minutes
**Total Cost:** $2-5 for deployment + $10-20 for gas wallet funding
