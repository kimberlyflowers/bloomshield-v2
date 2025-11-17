# Phase 1: Real Authentication Setup Guide

## ✅ What's Been Implemented

Phase 1 (Real Authentication System) has been implemented with the following features:

### Components Created:
1. **lib/auth.ts** - Authentication service layer with:
   - Sign up with email/password
   - Login with email verification enforcement
   - Password reset functionality
   - Session management
   - Wallet generation on signup

2. **lib/supabase.ts** - Supabase client configuration

3. **types/user.ts** - TypeScript interfaces for user data

4. **components/AuthModal.tsx** - Complete auth UI with:
   - Sign up form with validation
   - Login form with "remember me"
   - Password reset form
   - Error handling and success messages

5. **app/page.tsx** - Integrated real auth:
   - Replaced simulated localStorage auth
   - Auth state listener
   - Login/logout handlers
   - Automatic profile data sync

## 🗄️ Database Setup Required

You need to run the following SQL in your **Supabase SQL Editor**:

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Select your project (or create one)
3. Click "SQL Editor" in the left sidebar

### Step 2: Run Migration SQL
Copy and paste the entire contents of:
```
supabase/migrations/001_create_users_table.sql
```

This will create:
- `users` table with all profile fields
- `assets` table for protected files
- `leases` table for marketplace leases
- Row Level Security (RLS) policies
- Indexes for performance
- Auto-update triggers

### Step 3: Verify Tables Created
After running the SQL, go to "Table Editor" and verify you see:
- ✅ users
- ✅ assets
- ✅ leases

## 🔑 Environment Variables

Make sure these are set in your Vercel project (or `.env.local` for development):

```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Get these from: Supabase Dashboard → Settings → API
```

## 📧 Email Configuration (Supabase Auth)

### Enable Email Provider:
1. Go to **Authentication** → **Providers** in Supabase
2. Make sure **Email** is enabled
3. Configure email templates (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize "Confirm Signup" and "Reset Password" emails

### Email Verification Settings:
- **Development**: Confirmation emails will appear in Supabase logs
  - Go to **Authentication** → **Users** to manually confirm users
- **Production**: Configure SMTP or use Supabase's email service
  - Go to **Project Settings** → **Auth** → **SMTP Settings**

## 🧪 Testing Authentication

### Test Sign Up:
1. Start dev server: `npm run dev`
2. Open http://localhost:3000
3. Click "Log In" button (top right)
4. Switch to "Sign Up" tab
5. Fill out form:
   - Name: Test User
   - Email: test@example.com
   - Password: testpass123
   - Check "I agree to Terms"
6. Click "Create Account"
7. Check Supabase logs for confirmation email
8. In Supabase Dashboard → **Authentication** → **Users**:
   - Find your user
   - Click the 3 dots → "Send email verification" OR
   - Manually verify by updating `email_confirmed_at`

### Test Login:
1. After email is verified, click "Log In"
2. Enter email and password
3. Should successfully log in and:
   - Navigate to dashboard
   - Show success toast
   - User stays logged in on refresh

### Test Password Reset:
1. Click "Forgot password?"
2. Enter email address
3. Check Supabase logs for reset email
4. Click link in email (or manually test)

## 🔧 How It Works

### Sign Up Flow:
1. User fills out signup form
2. **lib/auth.ts** → `signUp()` creates auth user in Supabase
3. Generates wallet (address + 12-word seed phrase)
4. Creates user profile in `users` table
5. Sends verification email
6. User must verify email before logging in

### Login Flow:
1. User enters email/password
2. **lib/auth.ts** → `login()` authenticates with Supabase
3. Checks if email is verified (rejects if not)
4. Fetches user profile from `users` table
5. Auth state listener in **app/page.tsx** updates UI
6. User's wallet and profile data loaded automatically

### Session Persistence:
- Supabase handles session cookies automatically
- Sessions persist across page refreshes
- "Remember me" checkbox controls session duration
- Auth state listener (`onAuthStateChange`) keeps UI in sync

## 🚨 Important Notes

### Security:
- ⚠️ **Wallet seed phrases are stored in plain text** in the database
- TODO: Encrypt seed phrases before production
- Never log seed phrases or private keys
- Use HTTPS in production

### Email Verification:
- **Currently enforced**: Users MUST verify email before logging in
- Unverified users are signed out automatically
- To disable (not recommended): Remove check in `lib/auth.ts` line 157-164

### Supabase RLS:
- Row Level Security (RLS) is enabled on all tables
- Users can only read/write their own data
- Public data (listed assets) readable by anyone

## 🐛 Troubleshooting

### "User not found" on login:
- Check that SQL migration was run successfully
- Check user exists in Supabase **Authentication** → **Users**
- Check user profile exists in `users` table

### "Email not verified" error:
- Go to Supabase Dashboard → **Authentication** → **Users**
- Find user → Click 3 dots → Mark as verified
- OR: Send verification email again

### Session not persisting:
- Check browser cookies are enabled
- Clear browser cache and cookies
- Check `NEXT_PUBLIC_SUPABASE_URL` is correct

### "Missing Supabase environment variables":
- Verify `.env.local` exists (or Vercel env vars set)
- Restart dev server after adding env vars
- Check spelling of var names (must match exactly)

## ✅ Testing Checklist

Before moving to Phase 2, verify:

- [ ] SQL migration ran successfully
- [ ] `users`, `assets`, `leases` tables exist
- [ ] Can sign up new user
- [ ] Verification email sent (check Supabase logs)
- [ ] Can verify email
- [ ] Can log in after verification
- [ ] Unverified user blocked from login
- [ ] Session persists on page refresh
- [ ] Can log out
- [ ] Password reset email sent
- [ ] User profile data loads correctly
- [ ] Wallet address and seed phrase generated

## 📊 Database Schema

### Users Table:
```sql
users (
  id: UUID (primary key, references auth.users)
  email: TEXT
  name: TEXT
  wallet_address: TEXT
  wallet_seed_phrase: TEXT (TODO: encrypt)
  created_at: TIMESTAMP
  account_type: TEXT (free/pro/business)
  role: TEXT (creator/buyer/both)
  phone: TEXT (optional)
  bio: TEXT (optional)
  profile_photo: TEXT (optional)
  business_name: TEXT (optional)
  business_website: TEXT (optional)
  industry: TEXT (optional)
  social_links: JSONB
  email_verified: BOOLEAN
  two_factor_enabled: BOOLEAN
  updated_at: TIMESTAMP
)
```

## 🎯 Next Steps

Once authentication is tested and working:

1. ✅ **Phase 1 Complete**
2. ⏭️ **Phase 2**: Real Blockchain Integration
   - Deploy smart contract to Polygon
   - Configure ThirdWeb environment variables
   - Replace simulated blockchain transactions

3. ⏭️ **Phase 3**: IPFS Metadata Storage
   - Setup Pinata account
   - Configure IPFS uploads

4. ⏭️ **Phase 4**: Marketplace
   - List assets for sale
   - Buy/sell functionality
   - Lease system

5. ⏭️ **Phase 5**: Stripe Payments
   - Setup Stripe account
   - Payment processing

## 📝 Code References

### Key Files:
- Authentication logic: `lib/auth.ts`
- Auth UI: `components/AuthModal.tsx`
- Auth state management: `app/page.tsx` (lines 123-167)
- Database schema: `supabase/migrations/001_create_users_table.sql`

### Important Functions:
- `signUp()` - Create new user
- `login()` - Authenticate user
- `logout()` - Sign out
- `resetPassword()` - Send reset email
- `onAuthStateChange()` - Listen to auth events
- `getCurrentUserProfile()` - Get current user data

## 🆘 Need Help?

If you encounter issues:
1. Check Supabase logs: Dashboard → Logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Check database tables were created correctly
5. Test with a fresh user account

---

**Status: Phase 1 (Real Authentication) - READY FOR TESTING**

Once you confirm authentication is working, we'll proceed to Phase 2 (Blockchain Integration).
