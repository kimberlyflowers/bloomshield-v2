# 🔍 ISSUE: .env.local File Keeps Disappearing

## 📌 Problem Summary
The `.env.local` file with environment variables keeps disappearing after being created multiple times throughout the build process.

---

## 🔎 Root Cause Analysis

### Investigation Results:

**1. .gitignore Configuration (Line 26)**
```
# local env files
.env*.local
.env
```

**Status:** ✅ This is CORRECT and intentional for security!

**2. Git History Search**
- `.env.local` was NEVER committed to git (as expected)
- `.env.example` was committed on Nov 17, 2025 (commit 6ba4e2e)
- No cleanup scripts found in package.json
- No build hooks deleting files

**3. Git Reflog Analysis**
```
7d869f0 HEAD@{0}: checkout: moving from 7d869f0... to claude/bloomshield-build-summary-...
7d869f0 HEAD@{1}: checkout: moving from claude/fix-upload-certificate-... to FETCH_HEAD
cc644f2 HEAD@{2}: checkout: moving from 7d869f0... to claude/fix-upload-certificate-...
7d869f0 HEAD@{3}: checkout: moving from master to FETCH_HEAD
```

Multiple branch checkouts detected - this is the smoking gun!

---

## 🎯 Why It Keeps Disappearing

### The Real Reason:

`.env.local` is **intentionally excluded** from git via `.gitignore` (for security - you should NEVER commit credentials to version control).

Because it's not tracked by git, the file:
- ❌ Won't survive branch checkouts
- ❌ Won't transfer between machines
- ❌ Won't persist in new Claude Code sessions
- ❌ Won't be cloned when pulling fresh code
- ❌ Won't be deployed to Vercel (it stays local only)

### When It Disappears:
1. **Branch switching** - If you checkout a different branch, untracked files can be lost
2. **New sessions** - Each new Claude Code session may start with a fresh checkout
3. **Directory cleanup** - Any git clean or reset operations
4. **Fresh clones** - When cloning the repo on a new machine
5. **Vercel deployments** - Vercel never sees .env.local (uses Environment Variables instead)

---

## ✅ The CORRECT Solution

### For Local Development:

**Option 1: Create .env.local Once Per Session (Manual)**
```bash
# Every time you start a new session, run:
cp .env.example .env.local

# Then edit .env.local with your actual credentials
```

**Option 2: Use a Session Start Hook (Automatic)** ⭐ RECOMMENDED

Create a hook that automatically creates .env.local when sessions start:

1. Create `.claude/hooks/session-start.sh`:
```bash
#!/bin/bash
# Auto-create .env.local from .env.example if missing

if [ ! -f .env.local ]; then
  echo "🔧 Creating .env.local from .env.example..."
  cp .env.example .env.local
  echo "✅ .env.local created! Please add your actual credentials."
  echo "📝 Edit: nano .env.local or use your preferred editor"
fi
```

2. Make it executable:
```bash
chmod +x .claude/hooks/session-start.sh
```

**Option 3: Use direnv (Advanced)**
```bash
# Install direnv: https://direnv.net/
# Create .envrc that loads .env.local automatically
```

### For Vercel Production:

**DO NOT** use `.env.local` on Vercel. Instead:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable individually:
   - `NEXT_PUBLIC_SUPABASE_URL` = your_supabase_url
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your_anon_key
   - `THIRDWEB_PRIVATE_KEY` = your_private_key
   - `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` = your_client_id
   - `THIRDWEB_SECRET_KEY` = your_secret_key
   - `THIRDWEB_CONTRACT_ADDRESS` = your_contract_address
3. Set for: Production, Preview, and Development
4. Redeploy

---

## 🛡️ Security Best Practices

### ✅ DO:
- Keep `.env*.local` in `.gitignore` (already done)
- Use `.env.example` to document required variables (already done)
- Store real credentials in Vercel Environment Variables for production
- Create `.env.local` manually/automatically for local development
- Commit `.env.example` to show what variables are needed

### ❌ DON'T:
- Never commit `.env.local` to git
- Never remove `.env*.local` from `.gitignore`
- Never put real credentials in `.env.example`
- Never share `.env.local` publicly

---

## 🔧 Permanent Fix Implementation

### Step 1: Create the .env.local file NOW
```bash
cp .env.example .env.local
```

### Step 2: Add your real credentials to .env.local

Edit `/home/user/bloomshield-v2/.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...YOUR_ACTUAL_KEY

# ThirdWeb Blockchain Configuration
THIRDWEB_PRIVATE_KEY=0x...YOUR_PRIVATE_KEY
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=YOUR_CLIENT_ID
THIRDWEB_SECRET_KEY=YOUR_SECRET_KEY
THIRDWEB_CONTRACT_ADDRESS=0x...YOUR_CONTRACT_ADDRESS
```

### Step 3: Set up auto-creation for future sessions

Create the session start hook (optional but recommended):
```bash
mkdir -p .claude/hooks
cat > .claude/hooks/session-start.sh << 'EOF'
#!/bin/bash
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "✅ .env.local created from template. Add your credentials!"
fi
EOF
chmod +x .claude/hooks/session-start.sh
```

### Step 4: Document for team members

Add to README.md:
```markdown
## 🔧 Environment Setup

Before running the app, create your local environment file:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Then edit `.env.local` with your actual credentials (never commit this file!).
```

---

## 📊 Verification

Confirm the fix is working:

```bash
# Check .env.local exists
ls -la .env.local

# Verify it's gitignored
git status --ignored | grep .env.local

# Verify it has your credentials (should show content, not "missing")
grep SUPABASE_URL .env.local
```

Expected output:
```
-rw-r--r-- 1 user user 1234 Nov 18 19:00 .env.local
.env.local
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
```

---

## 🎓 Key Takeaway

**The file isn't "disappearing" - it's simply not tracked by git (by design for security).**

This is how environment files SHOULD work:
- `.env.example` → Committed to git (template, no secrets)
- `.env.local` → NOT in git (contains real secrets)
- Vercel Env Vars → Used in production (managed through Vercel dashboard)

You'll need to recreate `.env.local` in each new environment, but this protects your credentials from being exposed in version control.

---

## ⚠️ IMPORTANT: Vercel Environment Variables

**If you've already set environment variables in Vercel Dashboard:**

Your Vercel deployments are working correctly! The environment variables you set in Vercel Dashboard are completely separate from `.env.local`.

**The build failure is LOCAL only** - it happens when running `npm run build` locally without `.env.local`.

See **[VERCEL_VS_LOCAL_ENV.md](./VERCEL_VS_LOCAL_ENV.md)** for detailed explanation of:
- Why Vercel env vars ≠ Local .env.local
- Why .env.example can't overwrite anything
- How the two systems work independently

---

## 📅 Investigation Date
November 18, 2025

## 🔗 Related Files
- `.gitignore` (line 26: `.env*.local`)
- `.env.local` (auto-created by session-start hook, needs your credentials)
- `.env.example` (template, no real values)
- `.claude/hooks/session-start.sh` (auto-creates .env.local)
- `PHASE1_AUTH_SETUP.md` (setup guide)
- `BLOCKCHAIN_SETUP.md` (blockchain config guide)
- `VERCEL_VS_LOCAL_ENV.md` (Vercel vs Local environment explained)
