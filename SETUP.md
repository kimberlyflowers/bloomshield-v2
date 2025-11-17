# BloomShield Setup Guide

## 🌸 Welcome to BloomShield!

BloomShield is a blockchain-powered creative protection platform that helps you protect, verify, and license your creative work.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (https://supabase.com)
- A ThirdWeb account (https://thirdweb.com)
- A Polygon wallet with some MATIC tokens (for blockchain transactions)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your credentials in `.env.local`:

#### Supabase Configuration

1. Go to https://supabase.com and create a new project
2. Go to Settings > API
3. Copy your Project URL and anon/public key
4. Update `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

5. **Important:** Set up the database schema:
   - Go to your Supabase project SQL Editor
   - Run this SQL to create the required tables:

   ```sql
   -- Create storage bucket for protected files
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('protected-files', 'protected-files', false);

   -- Create protected_files table
   CREATE TABLE protected_files (
     id BIGSERIAL PRIMARY KEY,
     file_name TEXT NOT NULL,
     file_size BIGINT NOT NULL,
     mime_type TEXT,
     storage_path TEXT NOT NULL,
     legal_hash TEXT NOT NULL,
     content_hash TEXT NOT NULL,
     floral_hash TEXT NOT NULL,
     blockchain_tx TEXT NOT NULL,
     blockchain_timestamp TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     user_id UUID REFERENCES auth.users(id)
   );

   -- Enable Row Level Security
   ALTER TABLE protected_files ENABLE ROW LEVEL SECURITY;

   -- Create policy for authenticated users
   CREATE POLICY "Users can view their own files"
     ON protected_files FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert their own files"
     ON protected_files FOR INSERT
     WITH CHECK (auth.uid() = user_id);
   ```

6. **Set up OAuth providers (optional but recommended):**
   - Go to Authentication > Providers in Supabase
   - Enable Google and/or Facebook authentication
   - Follow the provider-specific setup instructions

#### ThirdWeb Configuration

1. Go to https://thirdweb.com and create an account
2. Create a new project
3. Get your Client ID and Secret Key from the project settings
4. Deploy a contract (or use an existing one):
   - Use the "Timestamping" or "Custom" contract template
   - Deploy to Polygon network
   - Copy the contract address

5. Create a wallet for server-side transactions:
   - Export your wallet's private key (NEVER share this!)
   - Or create a new wallet specifically for this app

6. Update `.env.local`:
   ```
   NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-client-id
   THIRDWEB_SECRET_KEY=your-secret-key
   THIRDWEB_PRIVATE_KEY=your-wallet-private-key
   THIRDWEB_CONTRACT_ADDRESS=your-contract-address
   ```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

## Features

### File Protection
- Upload files to generate cryptographic hashes
- Create blockchain timestamps on Polygon
- Generate protection certificates

### Dashboard
- View all your protected files
- Monitor your content (Pro feature)
- Manage infringement cases (Pro feature)
- Handle license requests

### Wallet
- Virtual BloomCard for payments
- Track earnings from licenses
- Withdraw funds

### Marketplace
- List your protected content for licensing
- Set licensing terms
- Earn passive income

## Demo Mode

If environment variables are not configured, the app will run in **Demo Mode**:
- ✅ UI and file upload works
- ✅ Hash generation works
- ⚠️ Blockchain uses simulated transactions (not real)
- ⚠️ Authentication is simulated
- ⚠️ Files are not actually stored in Supabase

Demo mode is perfect for testing the UI and user experience!

## Troubleshooting

### "Blockchain timestamp failed"
- Check that your ThirdWeb credentials are correct
- Ensure your wallet has enough MATIC for gas fees
- Verify your contract address is correct

### "Failed to initialize Supabase client"
- Verify your Supabase URL and anon key are correct
- Check that your Supabase project is active

### "Login doesn't work"
- Make sure OAuth providers are enabled in Supabase
- Check that redirect URLs are configured in your OAuth app settings
- Verify your Supabase credentials in `.env.local`

## Security Notes

- **NEVER** commit `.env.local` to git (it's already in `.gitignore`)
- **NEVER** share your private keys or secret keys
- Keep your Supabase anon key secure (use RLS policies)
- Use a dedicated wallet for the app, not your personal wallet

## Support

For issues and feature requests, please visit our GitHub repository.

## License

Copyright © 2024 BloomShield. All rights reserved.
