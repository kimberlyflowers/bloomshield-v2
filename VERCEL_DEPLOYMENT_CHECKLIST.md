# 🚀 VERCEL DEPLOYMENT CHECKLIST - Production Launch

## Complete Vercel Setup in 15 Minutes

---

## ENVIRONMENT VARIABLES (All Required)

### Where to Add Them:
1. Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. For each variable:
   - Enter Key (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Enter Value (paste your actual value)
   - Select: **Production**, **Preview**, **Development** (all three!)
   - Click **"Save"**

---

## SUPABASE VARIABLES (Required - Have These Already)

### ✅ 1. NEXT_PUBLIC_SUPABASE_URL
```
Value: https://wazbpoujdmckkozjqyqs.supabase.co
```
**Where from:** Supabase Dashboard → Settings → API → Project URL

### ✅ 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhemJwb3VqZG1ja2tvempxeXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5ODE4MTEsImV4cCI6MjA3ODU1NzgxMX0.AnKsBS8AOEF8nB_fLD49Ne4RdJZSKTkIbnIBErd6kKE
```
**Where from:** Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

### 🔴 3. SUPABASE_SERVICE_ROLE_KEY (YOU NEED TO GET THIS)
```
Value: eyJ...YOUR_SERVICE_ROLE_KEY_HERE
```
**Where from:** Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
**⚠️ DO NOT** confuse with anon key!

---

## THIRDWEB VARIABLES (Required for Blockchain)

### ✅ 4. NEXT_PUBLIC_THIRDWEB_CLIENT_ID
```
Value: C31c83cc19b0b7b3124743f28b2d3b26
```
**Where from:** ThirdWeb Dashboard → Settings → API Keys
**Already have this!**

### ✅ 5. THIRDWEB_SECRET_KEY
```
Value: khU1oz42QCMT6kyIE3cXABVFoow0vEUO5bYf3bRuRn4V_l-yFiETcGYikpJ3YuxS4Wa7-z7xE6Gdx0v0VOat0g
```
**Where from:** ThirdWeb Dashboard → Settings → API Keys
**Already have this!**

### 🔴 6. THIRDWEB_PRIVATE_KEY (YOU NEED TO GET THIS)
```
Value: 0x...YOUR_66_CHARACTER_PRIVATE_KEY
```
**Where from:** ThirdWeb Dashboard → Wallets → Export Private Key
**Format:** Starts with `0x`, total 66 characters

### 🔴 7. THIRDWEB_CONTRACT_ADDRESS (AFTER YOU DEPLOY CONTRACT)
```
Value: 0x...YOUR_CONTRACT_ADDRESS
```
**Where from:** After deploying contract on Base network
**See:** SMART_CONTRACT_DEPLOYMENT.md

---

## STRIPE VARIABLES (Optional - Skip for Today)

Only add these when you're ready to charge users:

### 8. STRIPE_SECRET_KEY (Optional)
```
Value: sk_live_...YOUR_STRIPE_SECRET_KEY
```
**Where from:** Stripe Dashboard → Developers → API keys

### 9. STRIPE_PUBLISHABLE_KEY (Optional)
```
Value: pk_live_...YOUR_STRIPE_PUBLISHABLE_KEY
```
**Where from:** Stripe Dashboard → Developers → API keys

### 10. STRIPE_WEBHOOK_SECRET (Optional)
```
Value: whsec_...YOUR_WEBHOOK_SECRET
```
**Where from:** Stripe Dashboard → Developers → Webhooks → After creating endpoint

---

## SUMMARY TABLE

| Variable | Status | Priority | Where to Get |
|----------|--------|----------|--------------|
| NEXT_PUBLIC_SUPABASE_URL | ✅ Have | CRITICAL | Supabase Settings → API |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ Have | CRITICAL | Supabase Settings → API |
| SUPABASE_SERVICE_ROLE_KEY | 🔴 Need | CRITICAL | Supabase Settings → API (service_role) |
| NEXT_PUBLIC_THIRDWEB_CLIENT_ID | ✅ Have | CRITICAL | ThirdWeb Settings → API Keys |
| THIRDWEB_SECRET_KEY | ✅ Have | CRITICAL | ThirdWeb Settings → API Keys |
| THIRDWEB_PRIVATE_KEY | 🔴 Need | CRITICAL | ThirdWeb Wallets → Export |
| THIRDWEB_CONTRACT_ADDRESS | 🔴 Deploy | CRITICAL | After contract deployment |
| STRIPE_SECRET_KEY | ⚪ Skip | Optional | Stripe Dashboard |
| STRIPE_PUBLISHABLE_KEY | ⚪ Skip | Optional | Stripe Dashboard |
| STRIPE_WEBHOOK_SECRET | ⚪ Skip | Optional | Stripe Dashboard |

---

## STEP-BY-STEP DEPLOYMENT

### Step 1: Add Environment Variables to Vercel

1. Go to: https://vercel.com/dashboard
2. Select your BloomShield project (or create new if doesn't exist)
3. Click **"Settings"** tab
4. Click **"Environment Variables"** in left sidebar
5. Add EACH variable from the table above:
   - Click **"Add New"**
   - Enter Key: `NEXT_PUBLIC_SUPABASE_URL`
   - Enter Value: `https://wazbpoujdmckkozjqyqs.supabase.co`
   - Select all three: Production ✓ Preview ✓ Development ✓
   - Click **"Save"**
6. Repeat for all 7 critical variables

**⏱️ Time:** 5 minutes

### Step 2: Connect GitHub Repository

If not already connected:
1. In Vercel Dashboard → Add New Project
2. Import Git Repository
3. Select: `kimberlyflowers/bloomshield-v2`
4. Click **"Import"**

### Step 3: Configure Build Settings

**Framework Preset:** Next.js (auto-detected)
**Build Command:** `npm run build`
**Output Directory:** `.next`
**Install Command:** `npm install`

**Root Directory:** `./` (leave blank)

**Node Version:** 18.x or 20.x (default is fine)

### Step 4: Deploy

1. Click **"Deploy"** button
2. Wait 2-5 minutes for build
3. Watch build logs for errors

**Common Errors:**
- "Missing environment variables" → Add them in Step 1
- "Module not found" → Should be fixed (we added Stripe)
- "Type errors" → Should be fixed

### Step 5: Verify Deployment

After successful deployment:
1. Click **"Visit"** to see your live site
2. Test file upload (will be simulated blockchain until you add private key)
3. Check signup/login works

---

## PRODUCTION READINESS CHECKLIST

### Before Going Live:

- [ ] All 7 critical environment variables added to Vercel
- [ ] Database migrations executed in Supabase
- [ ] Smart contract deployed on Base network
- [ ] Contract address added to Vercel environment variables
- [ ] ThirdWeb private key added to Vercel
- [ ] Wallet funded with $20 ETH on Base network
- [ ] Deployment successful (no build errors)
- [ ] Test signup → Login → File upload → View certificate
- [ ] Certificate shows real blockchain transaction (0x... not 0xSIM...)
- [ ] BaseScan shows transaction when clicking blockchain link

### Optional (Can Do Later):

- [ ] Custom domain configured
- [ ] Stripe integration for payments
- [ ] Email SMTP configured in Supabase
- [ ] SSL certificate verified
- [ ] Analytics configured (Vercel Analytics/Google Analytics)

---

## TESTING CHECKLIST (After Deployment)

### Test 1: Homepage Loads
```
✓ Visit your-domain.vercel.app
✓ No errors in console
✓ Login button visible
```

### Test 2: Authentication Works
```
✓ Click "Log In"
✓ Switch to "Sign Up"
✓ Create test account
✓ Receive email verification (check Supabase logs)
✓ Log in successfully
```

### Test 3: File Protection Works
```
✓ Upload a test file
✓ See processing overlay
✓ Certificate appears
✓ Certificate shows blockchain transaction hash
✓ Transaction hash starts with 0x (not 0xSIM)
✓ Click blockchain link → Opens BaseScan
✓ BaseScan shows transaction details
```

### Test 4: Database Working
```
✓ File appears in "My Files" section
✓ Can view certificate again
✓ User profile shows in database (Supabase Table Editor)
✓ Asset shows in database
```

**If ALL tests pass → YOU'RE LIVE! 🎉**

---

## TROUBLESHOOTING

### Build Fails: "Missing environment variables"
**Solution:**
- Check all variables are added in Vercel
- Make sure selected for Production AND Preview AND Development
- Redeploy after adding

### Build Fails: "Module not found: stripe"
**Solution:**
- Already fixed in latest code
- Make sure latest commit is deployed
- Check package.json includes `"stripe": "^14.25.0"`

### Deployment Succeeds but Site Shows Error
**Solution:**
- Check browser console for specific error
- Verify Supabase credentials are correct
- Check database migrations were run

### Blockchain Transaction Shows 0xSIM...
**Solution:**
- ThirdWeb private key not set or incorrect
- Contract address not set
- Wallet not funded with ETH
- Check Vercel environment variables

### Can't Create Account
**Solution:**
- Database migrations not run
- Check Supabase project is accessible
- Verify service role key is correct (not anon key!)

---

## ROLLBACK PLAN (If Something Goes Wrong)

### Option 1: Redeploy Previous Version
1. Vercel Dashboard → Deployments
2. Find last working deployment
3. Click three dots (⋮) → "Promote to Production"

### Option 2: Pause New Signups
1. Disable signup UI temporarily
2. Fix issues
3. Re-enable when ready

### Option 3: Emergency Maintenance Mode
Create `public/maintenance.html`:
```html
<h1>BloomShield Maintenance</h1>
<p>We'll be back shortly!</p>
```

Redirect all traffic temporarily.

---

## SUPPORT & MONITORING

### Monitor Deployment Health:
- Vercel Dashboard → Analytics
- Check error logs: Vercel → Functions → Logs
- Supabase Dashboard → Logs

### User Issues:
- Check Vercel function logs
- Check Supabase auth logs
- Check BaseScan for failed transactions

---

## FINAL PRE-LAUNCH CHECKLIST

**30 Minutes Before Going Live:**

- [ ] All environment variables verified
- [ ] Test account created successfully
- [ ] Test file uploaded successfully
- [ ] Real blockchain transaction verified on BaseScan
- [ ] Database working correctly
- [ ] No console errors on homepage
- [ ] Mobile responsiveness checked
- [ ] Ready for user traffic

**IF ALL CHECKED → LAUNCH! 🚀**

---

## ESTIMATED TIMELINE

| Task | Time |
|------|------|
| Add environment variables | 5 min |
| Deploy to Vercel | 3 min |
| Test deployment | 10 min |
| Fix any issues | 10-30 min |
| **TOTAL** | **30-45 min** |

---

**Questions?** See other guides:
- CREDENTIALS_COLLECTION_GUIDE.md (get missing variables)
- DATABASE_MIGRATION_GUIDE.md (run SQL migrations)
- SMART_CONTRACT_DEPLOYMENT.md (deploy contract)
- BASE_NETWORK_MIGRATION_SUMMARY.md (technical details)
