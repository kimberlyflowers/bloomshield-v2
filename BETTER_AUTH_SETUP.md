# 🔐 Better Auth Setup Guide

BloomShield now uses **Better Auth** for authentication! This guide will help you set up and deploy with Better Auth.

---

## ✨ Why Better Auth?

- ✅ **Proper database integration** (no more temporary fixes!)
- ✅ **Works with Supabase Postgres** as the database
- ✅ **Seamless with Polar payments** (your marketplace integration)
- ✅ **Better session management** and security
- ✅ **Extensible** with plugins and providers

---

## 🚀 Quick Start

### 1. Run Database Migrations

You need to run TWO migrations in Supabase:

#### Migration 1: Protected Files Table (if not already run)
```sql
-- File: supabase/migrations/003_create_protected_files_table.sql
-- Run this in Supabase SQL Editor
```

#### Migration 2: Better Auth Tables (REQUIRED)
```sql
-- File: supabase/migrations/004_create_better_auth_tables.sql
-- Run this in Supabase SQL Editor
```

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy entire migration file
3. Paste and click **Run**
4. Verify: "Success. No rows returned"

---

### 2. Set Environment Variables

#### Local Development (.env.local)

Create `.env.local` in project root:

```bash
# Supabase (keep existing)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Better Auth Database Connection (NEW - REQUIRED)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# App URL (NEW - REQUIRED)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Polar (keep existing)
POLAR_ACCESS_TOKEN=your_token
POLAR_WEBHOOK_SECRET=your_secret
NEXT_PUBLIC_POLAR_ORGANIZATION_ID=your_org_id
```

**Where to find DATABASE_URL:**
1. Supabase Dashboard → Settings → Database
2. Find "Connection String" section
3. Copy "URI" format
4. Replace `[YOUR-PASSWORD]` with your actual database password

#### Production (Vercel)

Add to Vercel Environment Variables:
1. Go to Vercel Project → Settings → Environment Variables
2. Add:
   - `DATABASE_URL` → your Supabase connection string
   - `NEXT_PUBLIC_APP_URL` → https://your-domain.com
   - (Keep all existing variables)

---

## 📝 How It Works

### Authentication Flow

```
User signs up
  → Better Auth creates user in "user" table
  → Generates wallet address + seed phrase automatically
  → Sends verification email (if enabled)

User logs in
  → Better Auth validates credentials
  → Creates session in "session" table
  → Returns user profile with wallet data
  → App loads protected files from database

User uploads file
  → Saves to protected_files table
  → Auto-reloads files from database
  → Certificate modal shows (and properly closes!)
```

### Database Tables

Better Auth creates these tables:

#### `user` table
- Stores user accounts
- Custom fields: `wallet_address`, `wallet_seed_phrase`, `account_type`, `role`
- RLS enabled for security

#### `session` table
- Stores active sessions
- Tracks IP address, user agent
- Auto-expires after 7 days

#### `account` table
- For OAuth providers (future: Google, GitHub, etc.)
- Stores access/refresh tokens

#### `verification` table
- For email verification tokens
- Password reset tokens

---

## 🔧 Configuration

### Email Verification

Currently **disabled** for easier testing:

```typescript
// lib/better-auth.ts
emailAndPassword: {
  requireEmailVerification: false, // Change to true for production
}
```

To enable:
1. Set `requireEmailVerification: true`
2. Configure email sending in `sendVerificationEmail`
3. Set up SMTP or email service (Resend, SendGrid, etc.)

### Session Duration

Default: 7 days

```typescript
// lib/better-auth.ts
session: {
  expiresIn: 60 * 60 * 24 * 7, // 7 days
  updateAge: 60 * 60 * 24 // Update every 24 hours
}
```

---

## 🧪 Testing

### Test Signup

```bash
# In browser console or using auth modal:
1. Click "Sign Up"
2. Enter email, password, name
3. Check Supabase: user should appear in "user" table
4. Check wallet fields are populated
```

### Test Login

```bash
1. Click "Login"
2. Enter credentials
3. Should redirect to dashboard
4. Protected files should load from database
5. Check browser console: "✅ Loaded X protected files from database"
```

### Test Certificate Modal

```bash
1. Upload a file
2. Certificate modal appears ✓
3. Close modal → should stay closed ✓
4. Navigate to marketplace → modal doesn't reopen ✓
5. Upload another file → new certificate works ✓
```

---

## 🐛 Troubleshooting

### "Connection refused" or "Database error"

**Cause:** DATABASE_URL not set or incorrect

**Fix:**
1. Check `.env.local` has `DATABASE_URL`
2. Verify connection string format: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
3. Test connection: `psql $DATABASE_URL`

### "User not found" after login

**Cause:** Migration not run

**Fix:**
1. Run `004_create_better_auth_tables.sql` in Supabase
2. Check tables exist: `SELECT * FROM "user" LIMIT 1;`

### Certificate modal keeps reopening

**Cause:** Old code (should be fixed now)

**Fix:**
1. Verify `app/page.tsx:2960` has `setCertificateData(null)`
2. Verify `app/page.tsx:949` has `setCertificateData(null)`
3. Rebuild: `npm run build`

### "Protected files not loading"

**Cause:** protected_files table doesn't exist OR RLS blocking access

**Fix:**
1. Run `003_create_protected_files_table.sql`
2. Check RLS policies allow user to read their files
3. Check browser console for API errors

---

## 📊 Migration Guide (from Supabase Auth)

If you have existing users in Supabase Auth:

### Option A: Fresh Start (Recommended)
1. Run Better Auth migrations
2. Existing users re-register
3. Their new accounts get wallets automatically

### Option B: Migrate Users
```sql
-- Copy users from auth.users to Better Auth "user" table
INSERT INTO "user" (id, email, name, email_verified, wallet_address, wallet_seed_phrase, created_at)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
  email_confirmed_at IS NOT NULL,
  '0x' || substring(md5(id::text) from 1 for 40),
  'please-update-seed-phrase',
  created_at
FROM auth.users;
```

⚠️ **Note:** Migrated users will need to reset passwords or set up new credentials.

---

## 🔐 Security Best Practices

### Production Checklist

- [ ] Enable email verification (`requireEmailVerification: true`)
- [ ] Set up HTTPS for `NEXT_PUBLIC_APP_URL`
- [ ] Use strong DATABASE_URL password
- [ ] Never commit `.env.local` to git (already in .gitignore)
- [ ] Rotate secrets periodically
- [ ] Monitor session table for suspicious activity
- [ ] Set up email service for password resets
- [ ] Enable rate limiting on auth endpoints (future)

### Wallet Security

⚠️ **IMPORTANT:** Seed phrases are currently stored **unencrypted**!

For production:
1. Encrypt `wallet_seed_phrase` before storing
2. Use environment variable for encryption key
3. Or use a dedicated secrets manager (Vault, AWS Secrets Manager)

---

## 🎯 Next Steps

Now that Better Auth is set up:

1. ✅ Deploy to production with migrations
2. ✅ Test login/signup flow
3. ✅ Verify protected files load
4. ✅ Test certificate modal
5. 🔜 Add OAuth providers (Google, GitHub)
6. 🔜 Set up email verification
7. 🔜 Implement 2FA (Better Auth supports this!)

---

## 📚 Resources

- **Better Auth Docs:** https://better-auth.com/docs
- **Better Auth + Polar:** Works seamlessly! Your Polar integration is unchanged
- **Supabase + Better Auth:** Better Auth uses Supabase as database, not for auth

---

## ✅ Status

**Current:** Better Auth fully integrated and working
**Build:** ✅ Successful
**Tests:** ✅ Passing
**Production:** Ready to deploy (after running migrations)

**BOTH critical bugs are FIXED:**
1. ✅ Login works properly (no temporary fixes)
2. ✅ Certificate modal closes and stays closed

---

**Questions?** Check the audit report in `CRITICAL_ISSUES_AUDIT.md` for detailed root cause analysis.
