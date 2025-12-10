import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { Polar } from '@polar-sh/sdk';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Get webhook secret
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('Polar webhook secret not configured');
      return NextResponse.json(
        { success: false, error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Get the raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('polar-signature') || request.headers.get('x-polar-signature');

    // Verify webhook signature
    if (signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { success: false, error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse the event
    const event = JSON.parse(body);

    console.log('Polar webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.completed':
      case 'payment.succeeded':
        await handleSuccessfulPayment(supabase, event);
        break;

      case 'checkout.failed':
      case 'payment.failed':
        await handleFailedPayment(supabase, event);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ success: true, received: true });

  } catch (error: any) {
    console.error('Polar webhook error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSuccessfulPayment(supabase: any, event: any) {
  try {
    const { data: checkout, metadata } = event;
    const {
      assetId,
      assetName,
      assetType,
      buyerId,
      buyerEmail,
      sellerId,
      sellerWallet,
      leaseDuration
    } = metadata || {};

    console.log(`Processing successful payment for asset: ${assetId}`);

    // Update purchase record
    const { error: updateError } = await supabase
      .from('purchases')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        payment_id: checkout?.id || event.id,
        transaction_hash: event.transactionHash || null
      })
      .eq('checkout_id', checkout?.id);

    if (updateError) {
      console.error('Error updating purchase:', updateError);
    }

    if (assetType === 'sale') {
      // Handle asset sale - transfer ownership
      const { error: assetError } = await supabase
        .from('assets')
        .update({
          creator_uid: buyerId,
          is_listed: false,
          updated_at: new Date().toISOString()
        })
        .eq('floral_id', assetId);

      if (assetError) {
        console.error('Error transferring asset ownership:', assetError);
      }

      console.log(`Asset ${assetId} ownership transferred to buyer ${buyerId}`);
    } else if (assetType === 'lease') {
      // Handle lease - create lease record
      const durationDays = leaseDuration === '1 Month' ? 30
        : leaseDuration === '6 Months' ? 180
        : 365;

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      const { error: leaseError } = await supabase
        .from('leases')
        .insert({
          asset_id: assetId,
          lessee_uid: buyerId,
          lessor_uid: sellerId,
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
          duration: leaseDuration,
          amount: checkout?.amount || 0,
          status: 'active',
          created_at: new Date().toISOString()
        });

      if (leaseError) {
        console.error('Error creating lease:', leaseError);
      }

      console.log(`Lease created for asset ${assetId}, buyer ${buyerId}`);
    }

    // Record revenue for seller
    const { error: revenueError } = await supabase
      .from('revenue_log')
      .insert({
        seller_uid: sellerId,
        buyer_uid: buyerId,
        asset_id: assetId,
        amount: checkout?.amount || 0,
        transaction_type: assetType,
        transaction_date: new Date().toISOString(),
        payment_id: checkout?.id || event.id,
        created_at: new Date().toISOString()
      });

    if (revenueError) {
      console.error('Error logging revenue:', revenueError);
    }

    // TODO: Send email notification to buyer with license details
    // TODO: Send email notification to seller about sale/lease

    console.log(`Payment processed successfully for ${assetId}`);

  } catch (error) {
    console.error('Error handling successful payment:', error);
    throw error;
  }
}

async function handleFailedPayment(supabase: any, event: any) {
  try {
    const { data: checkout } = event;

    console.log(`Processing failed payment, checkout: ${checkout?.id}`);

    // Update purchase record
    const { error: updateError } = await supabase
      .from('purchases')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
        error_message: event.error?.message || 'Payment failed'
      })
      .eq('checkout_id', checkout?.id);

    if (updateError) {
      console.error('Error updating failed purchase:', updateError);
    }

    // TODO: Send email notification to buyer about failed payment

    console.log(`Failed payment processed for checkout ${checkout?.id}`);

  } catch (error) {
    console.error('Error handling failed payment:', error);
    throw error;
  }
}
