# 🌸 BloomShield v2

Blockchain-based file protection and digital asset management platform for creators, photographers, and digital artists.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account (for database & auth)
- ThirdWeb account (optional, for blockchain integration)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup ⚠️ IMPORTANT

**The `.env.local` file will be automatically created from template, but you MUST add your actual credentials.**

```bash
# The session-start hook automatically creates .env.local
# Or create it manually:
cp .env.example .env.local
```

**Then edit `.env.local` with your actual credentials:**

```bash
# Required - Get from Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...YOUR_ACTUAL_KEY

# Optional - For real blockchain (falls back to simulated if not set)
THIRDWEB_PRIVATE_KEY=0x...YOUR_PRIVATE_KEY
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=YOUR_CLIENT_ID
THIRDWEB_SECRET_KEY=YOUR_SECRET_KEY
THIRDWEB_CONTRACT_ADDRESS=0x...YOUR_CONTRACT_ADDRESS
```

**📌 Why does .env.local keep disappearing?**
See [ENV_FILE_DISAPPEARING_ISSUE.md](./ENV_FILE_DISAPPEARING_ISSUE.md) for detailed explanation.

**TL;DR:** `.env.local` is gitignored for security (correct!), so it won't survive branch changes or new sessions. The session-start hook auto-recreates it, but you still need to add your credentials.

### 3. Database Setup

Run these SQL migrations in your **Supabase SQL Editor**:

```bash
# 1. Go to: https://supabase.com/dashboard → Your Project → SQL Editor
# 2. Copy and paste the contents of:
supabase/migrations/001_create_users_table.sql
# 3. Click "Run"
# 4. Repeat for:
supabase/migrations/002_create_storage_bucket.sql
```

See [PHASE1_AUTH_SETUP.md](./PHASE1_AUTH_SETUP.md) for detailed database setup instructions.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📚 Documentation

- **[PHASE1_AUTH_SETUP.md](./PHASE1_AUTH_SETUP.md)** - Authentication & database setup guide
- **[BLOCKCHAIN_SETUP.md](./BLOCKCHAIN_SETUP.md)** - Blockchain integration guide (ThirdWeb + Polygon)
- **[ENV_FILE_DISAPPEARING_ISSUE.md](./ENV_FILE_DISAPPEARING_ISSUE.md)** - Why .env.local disappears & how to fix it

---

## 🏗️ Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Blockchain:** ThirdWeb SDK, Ethers.js (Polygon network)
- **Deployment:** Vercel

---

## ✨ Features

### ✅ Phase 1 (Complete)
- Real authentication system (email/password, password reset)
- User profiles with wallet generation
- Dashboard and file management UI
- Certificate generation and sharing
- Marketplace framework

### 🚧 Phase 2 (In Progress)
- Real blockchain timestamping on Polygon
- IPFS file storage
- Marketplace transactions

### 📋 Phase 3+ (Planned)
- Stripe payments integration
- Advanced licensing options
- Mobile responsiveness
- API for third-party integrations

---

## 🔐 Security

- Row Level Security (RLS) enabled on all database tables
- Environment variables for sensitive credentials
- Email verification enforcement
- Content Security Policy (CSP) headers
- ⚠️ **TODO:** Encrypt wallet seed phrases before production (currently stored in plain text)

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel Dashboard → Settings → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `THIRDWEB_PRIVATE_KEY` (optional)
   - `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` (optional)
   - `THIRDWEB_SECRET_KEY` (optional)
   - `THIRDWEB_CONTRACT_ADDRESS` (optional)
4. Deploy!

**⚠️ Never commit `.env.local` to git!** It's gitignored for security. Use Vercel Environment Variables for production.

---

## 🧪 Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint (needs configuration)
```

---

## 🐛 Known Issues

1. **Build fails without Supabase env vars** - Expected behavior. Add credentials to `.env.local`
2. **16 npm vulnerabilities** - Run `npm audit fix` and consider upgrading Next.js to 14.2.33+
3. **ESLint not configured** - Run `npm run lint` and select "Strict (recommended)"
4. **Wallet seed phrases not encrypted** - Encrypt before production use

---

## 📝 License

Private repository - All rights reserved

---

## 🙋 Support

For issues or questions, see the documentation files or create an issue in the repository.

---

**Built with 💜 for creators and digital artists**
