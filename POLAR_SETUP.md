# 🎯 Polar Payment Integration Setup Guide

This guide will help you configure Polar for marketplace payments in BloomShield.

## What is Polar?

Polar is a payment platform designed for creators and developers. It handles checkout, payments, and payouts for marketplace transactions.

## Prerequisites

- A Polar account (sign up at https://polar.sh)
- Admin access to your BloomShield deployment
- Access to Vercel environment variables (for production)

## Step 1: Create a Polar Account

1. Go to https://polar.sh
2. Sign up for a free account
3. Complete the onboarding process
4. Verify your email address

## Step 2: Get Your API Credentials

1. Navigate to **Settings** → **API Keys** in your Polar dashboard
2. Create a new API key with the following permissions:
   - `checkouts:read`
   - `checkouts:write`
   - `webhooks:read`
   - `webhooks:write`
3. Copy your **Access Token** - you'll need this for `POLAR_ACCESS_TOKEN`
4. Note your **Organization ID** - you'll need this for `NEXT_PUBLIC_POLAR_ORGANIZATION_ID`

## Step 3: Configure Environment Variables

### Local Development (.env.local)

Create a `.env.local` file in your project root:

```bash
# Polar Payment Configuration
POLAR_ACCESS_TOKEN=your_polar_access_token_here
POLAR_WEBHOOK_SECRET=your_webhook_secret_here
NEXT_PUBLIC_POLAR_ORGANIZATION_ID=your_organization_id_here

# Optional: App URL for redirects
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - `POLAR_ACCESS_TOKEN` → your access token
   - `POLAR_WEBHOOK_SECRET` → your webhook secret
   - `NEXT_PUBLIC_POLAR_ORGANIZATION_ID` → your org ID
   - `NEXT_PUBLIC_APP_URL` → your production URL (e.g., https://bloomshield.com)

## Step 4: Configure Webhooks

1. In your Polar dashboard, go to **Settings** → **Webhooks**
2. Click **Add Webhook**
3. Configure:
   - **URL**: `https://your-domain.com/api/polar/webhook`
   - **Events to subscribe**:
     - `checkout.completed`
     - `payment.succeeded`
     - `checkout.failed`
     - `payment.failed`
4. Copy the **Webhook Secret** and add it to your environment variables
5. Save the webhook configuration

## Step 5: Run Database Migration

The purchases table migration should run automatically on deployment. If you need to run it manually:

```bash
# Using Supabase CLI
supabase migration up

# Or apply the SQL directly in Supabase dashboard
# File: supabase/migrations/002_create_purchases_table.sql
```

## Step 6: Test the Integration

### Test in Development (Simulated Mode)

Without Polar configured, the app will use simulated payments:

1. Start your dev server: `npm run dev`
2. Navigate to the Marketplace
3. Try to purchase an asset
4. You'll see a "⚠️ Using simulated payment" message
5. The purchase will complete locally (useful for testing UI)

### Test with Real Polar (Production)

1. Deploy to Vercel with all environment variables configured
2. Navigate to the Marketplace
3. List an asset for sale
4. Purchase the asset (you'll be redirected to Polar checkout)
5. Complete the payment using test cards:
   - **Test Card**: 4242 4242 4242 4242
   - **Expiry**: Any future date
   - **CVC**: Any 3 digits
6. After payment, you should be redirected back to BloomShield
7. Check the webhook logs in Polar dashboard to verify webhook delivery

## How It Works

### Purchase Flow

```
User clicks "Purchase"
  → Frontend calls /api/polar/checkout
  → Creates checkout session in Polar
  → Redirects to Polar hosted checkout
  → User completes payment
  → Polar sends webhook to /api/polar/webhook
  → Webhook updates database (ownership transfer)
  → User sees success message
```

### Lease Flow

```
User clicks "Lease"
  → Frontend calls /api/polar/checkout (with lease duration)
  → Creates checkout session in Polar
  → Redirects to Polar hosted checkout
  → User completes payment
  → Polar sends webhook to /api/polar/webhook
  → Webhook creates lease record in database
  → User can use asset for lease duration
```

## Database Tables

### `purchases`
Tracks all marketplace transactions:
- `id`: Unique purchase ID
- `asset_id`: Floral ID of the asset
- `buyer_id`: User ID of buyer
- `seller_id`: User ID of seller
- `amount`: Purchase/lease price
- `status`: pending, completed, failed, refunded
- `purchase_type`: 'sale' or 'lease'
- `checkout_id`: Polar checkout session ID

### `revenue_log`
Tracks seller earnings:
- `seller_uid`: Seller user ID
- `buyer_uid`: Buyer user ID
- `asset_id`: Asset floral ID
- `amount`: Revenue amount
- `transaction_type`: 'sale' or 'lease'
- `payment_id`: Polar payment ID

## Troubleshooting

### "Using simulated payment" message

**Cause**: Polar credentials not configured or invalid

**Solution**:
1. Check that `POLAR_ACCESS_TOKEN` is set correctly
2. Verify the access token hasn't expired
3. Check Polar dashboard for API key status

### Webhook not firing

**Cause**: Webhook URL not accessible or webhook secret mismatch

**Solution**:
1. Verify webhook URL is publicly accessible (not localhost)
2. Check webhook secret matches environment variable
3. Look at webhook logs in Polar dashboard for errors
4. Test webhook delivery using Polar's "Test Webhook" feature

### Payment succeeds but ownership doesn't transfer

**Cause**: Webhook processing error

**Solution**:
1. Check application logs for errors
2. Verify database migration ran successfully
3. Check that RLS policies allow webhook to update data
4. Ensure `assets` table has the correct `creator_uid` column

### TypeScript errors about Polar SDK

**Cause**: Polar SDK API may have changed

**Solution**:
1. Check Polar SDK version: `npm list @polar-sh/sdk`
2. Update SDK: `npm update @polar-sh/sdk`
3. Review Polar SDK docs for API changes
4. The current implementation has fallback to simulated mode

## Support

- **Polar Documentation**: https://docs.polar.sh
- **Polar Discord**: https://discord.gg/polar
- **BloomShield Issues**: Create an issue in the GitHub repository

## Next Steps

Once Polar is configured:

1. ✅ Test purchase flow with test cards
2. ✅ Test lease flow
3. ✅ Verify webhook processing
4. ✅ Test with real payment (small amount)
5. ✅ Configure payout settings in Polar
6. ✅ Set up email notifications for buyers/sellers
7. ✅ Add analytics tracking for conversions

---

**Status**: Polar integration is complete and ready for configuration. The app will work in simulated mode until Polar credentials are added.
