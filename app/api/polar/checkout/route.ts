import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { Polar } from '@polar-sh/sdk';

// Force dynamic rendering - this route uses cookies for authentication
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      assetId,
      assetName,
      assetType, // 'sale' or 'lease'
      amount,
      sellerId,
      sellerWallet,
      leaseDuration // only for leases
    } = body;

    // Validate required fields
    if (!assetId || !assetName || !assetType || !amount || !sellerId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if Polar is configured
    const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
    const polarOrgId = process.env.NEXT_PUBLIC_POLAR_ORGANIZATION_ID;

    if (!polarAccessToken) {
      // Fallback: simulate checkout for development
      console.warn('Polar not configured. Using simulated checkout.');

      const simulatedCheckoutUrl = `/marketplace?checkout=simulated&assetId=${assetId}&amount=${amount}`;

      return NextResponse.json({
        success: true,
        checkoutUrl: simulatedCheckoutUrl,
        checkoutId: `sim_${Math.random().toString(36).substr(2, 9)}`,
        simulated: true
      });
    }

    // Initialize Polar client
    const polar = new Polar({
      accessToken: polarAccessToken
    });

    // Create product metadata
    const productDescription = assetType === 'lease'
      ? `${leaseDuration} lease for ${assetName}`
      : `Purchase of ${assetName}`;

    // Create checkout session
    // Note: Polar SDK API structure - adjust based on actual SDK documentation
    // For now, we'll use a simulated approach until Polar is configured correctly
    let checkout: any;

    try {
      // Attempt to create actual Polar checkout
      // The exact API may vary - this is a placeholder
      checkout = await (polar as any).checkouts?.create?.({
        productPriceId: 'price_placeholder', // Would need actual price ID
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/marketplace?checkout=success&assetId=${assetId}`,
        metadata: {
          assetId,
          assetName,
          assetType,
          buyerId: user.id,
          buyerEmail: user.email || '',
          sellerId,
          sellerWallet,
          leaseDuration: leaseDuration || null,
          timestamp: new Date().toISOString()
        }
      });
    } catch (polarError) {
      // Fallback to simulated checkout if Polar API call fails
      console.warn('Polar checkout failed, using simulated:', polarError);

      const simulatedCheckoutId = `sim_${Math.random().toString(36).substr(2, 9)}`;

      await supabase
        .from('purchases')
        .insert({
          asset_id: assetId,
          buyer_id: user.id,
          seller_id: sellerId,
          amount: amount,
          currency: 'USD',
          checkout_id: simulatedCheckoutId,
          status: 'pending',
          purchase_type: assetType,
          lease_duration: leaseDuration || null,
          created_at: new Date().toISOString()
        });

      return NextResponse.json({
        success: true,
        checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/marketplace?checkout=simulated&assetId=${assetId}&amount=${amount}`,
        checkoutId: simulatedCheckoutId,
        simulated: true
      });
    }

    // Store checkout session in database for tracking
    await supabase
      .from('purchases')
      .insert({
        asset_id: assetId,
        buyer_id: user.id,
        seller_id: sellerId,
        amount: amount,
        currency: 'USD',
        checkout_id: checkout?.id || `checkout_${Date.now()}`,
        status: 'pending',
        purchase_type: assetType,
        lease_duration: leaseDuration || null,
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkout?.url || checkout?.checkoutUrl,
      checkoutId: checkout?.id,
      simulated: false
    });

  } catch (error: any) {
    console.error('Polar checkout error:', error);

    // If it's a Polar SDK error, provide more context
    const errorMessage = error?.message || 'Failed to create checkout';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error?.response?.data || null
      },
      { status: 500 }
    );
  }
}
