# 🔑 CREDENTIALS COLLECTION GUIDE - For Production Launch

## ⏱️ You Have 1 Hour - Here's EXACTLY What You Need

---

## CREDENTIAL #1: ThirdWeb Private Key

### Where to Get It:

**Step 1:** Go to https://thirdweb.com/dashboard

**Step 2:** Log in with your account

**Step 3:** Find Your Wallet
- Click **"Wallets"** in the left sidebar
- OR click **"Settings"** → **"Wallets"**
- Look for wallet address: `0xeaC170fC30d25fE9997810260aAB01E3553a85C0`

**Step 4:** Export Private Key
- Click the **three dots (⋮)** next to your wallet
- Select **"Export Private Key"** or **"Reveal Private Key"**
- You may need to enter your password
- Copy the entire key (starts with `0x`, 66 characters total)

**Example format:**
```
0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

**⚠️ Security Notes:**
- This key gives full control of your wallet
- Safe to share in this session (gitignored)
- Never share publicly or on social media
- We only need it for server-side blockchain signing

**If you can't find "Export Private Key":**
- Try: Settings → API Keys → Wallets section
- Try: Engine → Backend Wallets → Export
- Alternative: If this wallet was created in MetaMask, you can export from there

---

## CREDENTIAL #2: Supabase Service Role Key

### Where to Get It:

**Step 1:** Go to https://supabase.com/dashboard

**Step 2:** Select your project
- Project name: (your BloomShield project)
- URL: `https://wazbpoujdmckkozjqyqs.supabase.co`

**Step 3:** Navigate to API Settings
- Click **"Settings"** (gear icon in sidebar)
- Click **"API"**

**Step 4:** Copy Service Role Key
- Scroll to **"Project API keys"** section
- Find **"service_role"** key (NOT the anon key!)
- Click the **copy icon** or **reveal** button
- Copy the entire key

**Example format:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...
(very long key, ~200+ characters)
```

**⚠️ Important:**
- DO NOT confuse with `anon` key (we already have that)
- Service role key bypasses Row Level Security (needed for admin operations)
- Keep this secret - only use server-side

---

## CREDENTIAL #3: Fund Wallet with ETH (Optional but Recommended)

### If You Want Real Blockchain (Not Simulated):

**Step 1:** Buy ETH on Coinbase
- Amount: $20-50 worth
- Network: Make sure you can bridge to Base

**Step 2:** Bridge to Base Network
- Use: https://bridge.base.org
- OR: Coinbase app → Send → Select "Base" network
- Send to: `0xeaC170fC30d25fE9997810260aAB01E3553a85C0`

**Step 3:** Verify Receipt
- Check: https://basescan.org/address/0xeaC170fC30d25fE9997810260aAB01E3553a85C0
- Should show ETH balance within 2-3 minutes

**⏱️ Time Required:** 10-15 minutes

**Can Skip for Today:** If you want to launch with simulated blockchain first, we can add real blockchain later.

---

## 📋 CHECKLIST - What to Bring Back:

When you return in 1 hour, paste these:

```
1. THIRDWEB_PRIVATE_KEY=0x...your_66_character_key

2. SUPABASE_SERVICE_ROLE_KEY=eyJ...your_long_key

3. ETH Funded? (Yes/No)
```

---

## ⏰ WHAT I'M DOING WHILE YOU'RE GONE:

✅ Testing current build
✅ Preparing database migration scripts
✅ Creating smart contract deployment guide
✅ Preparing Vercel deployment checklist
✅ Writing production launch procedures

**When you return, I'll have everything ready to:**
1. Add your credentials (2 minutes)
2. Deploy smart contract (10 minutes)
3. Run database migrations (5 minutes)
4. Test end-to-end (10 minutes)
5. Deploy to production (15 minutes)

**Total time to production after you return: ~45 minutes**

---

## 🆘 IF YOU GET STUCK:

**Can't find ThirdWeb private key?**
- Check if wallet was created in MetaMask instead
- Try: ThirdWeb Dashboard → Engine → Backend Wallets
- Worst case: Create new wallet and I'll use that

**Can't find Supabase service role key?**
- Make sure you're on the right project
- Try: Settings → Database → Connection string (has the key)
- Alternative: We can run migrations manually via SQL Editor

**Don't have time to fund wallet with ETH?**
- That's OK! We can launch with simulated blockchain
- Add real blockchain later when you have time

---

## 🎯 PRIORITY ORDER (If Short on Time):

1. **CRITICAL:** Supabase Service Role Key (need this for database)
2. **CRITICAL:** ThirdWeb Private Key (need this for blockchain)
3. **OPTIONAL:** Fund wallet with ETH (can do later)

**Minimum to launch today:** Just #1 and #2!

---

See you in 1 hour! I'll have everything else ready. 🚀
