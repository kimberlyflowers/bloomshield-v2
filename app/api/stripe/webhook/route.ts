import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { RevenueSplitter } from '@/lib/revenue-splitter'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events for automated gas wallet funding
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('⚠️  Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }

  console.log(`🔔 Webhook received: ${event.type}`)

  // Initialize Supabase client with service role key for admin operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Handle successful payment
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const amount = paymentIntent.amount / 100 // Convert cents to dollars
    const tier = paymentIntent.metadata.tier || 'VERIFY'
    const userId = paymentIntent.metadata.userId

    console.log(`💰 Payment succeeded: $${amount} for tier ${tier}`)

    // Split the revenue
    const splitter = new RevenueSplitter()
    const split = splitter.splitPayment(tier, amount)

    console.log('📊 Revenue split:', {
      total: split.totalAmount,
      stripe: split.stripeFee,
      gas: split.gasFund,
      profit: split.profit,
      margin: `${split.profitMargin.toFixed(2)}%`
    })

    // Store gas fund in holding account
    const { error: holdingError } = await supabase
      .from('gas_wallet_holding')
      .insert({
        user_id: userId,
        tier: tier,
        amount: split.gasFund,
        currency: 'USD',
        status: 'pending',
        created_at: new Date().toISOString()
      })

    if (holdingError) {
      console.error('❌ Error storing gas fund:', holdingError)
    } else {
      console.log(`✅ Added $${split.gasFund.toFixed(4)} to gas wallet holding account`)
    }

    // Log the revenue transaction
    const { error: revenueError } = await supabase
      .from('revenue_log')
      .insert({
        payment_id: paymentIntent.id,
        user_id: userId,
        tier: tier,
        total_amount: split.totalAmount,
        stripe_fee: split.stripeFee,
        gas_fund: split.gasFund,
        profit: split.profit,
        profit_margin: split.profitMargin,
        created_at: new Date().toISOString()
      })

    if (revenueError) {
      console.error('❌ Error logging revenue:', revenueError)
    }
  }

  // Handle subscription created
  if (event.type === 'customer.subscription.created') {
    const subscription = event.data.object as Stripe.Subscription
    const priceId = subscription.items.data[0].price.id
    const customerId = subscription.customer as string

    console.log(`🔄 New subscription created: ${subscription.id}`)

    // Map price ID to tier (you'll need to set these up in Stripe)
    const tier = mapPriceIdToTier(priceId)

    // Calculate total gas needed for subscription period
    const splitter = new RevenueSplitter()
    const gasNeeded = splitter.calculateGasFundNeeded(tier, 1) // 1 month

    console.log(`💳 Subscription tier: ${tier}, Gas reserve needed: $${gasNeeded.toFixed(4)}`)
  }

  // Handle subscription cancelled
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    console.log(`❌ Subscription cancelled: ${subscription.id}`)

    // Could implement logic to handle unused gas fund credits
  }

  return NextResponse.json({ received: true })
}

/**
 * Map Stripe Price ID to BLOOM tier
 * Update these with your actual Stripe price IDs
 */
function mapPriceIdToTier(priceId: string): string {
  const priceMap: Record<string, string> = {
    'price_verify': 'VERIFY',
    'price_creator': 'SENTINEL_CREATOR',
    'price_studio': 'SENTINEL_STUDIO',
    'price_agency': 'SENTINEL_AGENCY',
  }

  return priceMap[priceId] || 'VERIFY'
}
