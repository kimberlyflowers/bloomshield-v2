import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

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
      floralId,
      fileName,
      fileType,
      fileSize,
      creatorName,
      creatorWallet,
      legalHash,
      ipfsHash,
      blockchainTx,
      blockNumber,
      salePrice,
      allowLease,
      leasePrice1Month,
      leasePrice6Month,
      leasePrice1Year,
      commercialUse,
      attribution,
      description
    } = body;

    // Validate required fields
    if (!floralId || !fileName || !legalHash || !blockchainTx) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if asset already exists
    const { data: existingAsset } = await supabase
      .from('assets')
      .select('id, is_listed')
      .eq('floral_id', floralId)
      .single();

    let result;

    if (existingAsset) {
      // Update existing asset
      const { data, error } = await supabase
        .from('assets')
        .update({
          is_listed: true,
          sale_price: salePrice || 0,
          allow_lease: allowLease || false,
          commercial_use: commercialUse !== undefined ? commercialUse : true,
          attribution: attribution !== undefined ? attribution : true,
          description: description || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAsset.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating asset:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Insert new asset
      const { data, error } = await supabase
        .from('assets')
        .insert({
          floral_id: floralId,
          file_name: fileName,
          file_type: fileType || 'unknown',
          file_size: fileSize || 0,
          creator_name: creatorName || user.email || 'Unknown',
          creator_uid: user.id,
          creator_wallet: creatorWallet || '0x0000000000000000000000000000000000000000',
          legal_hash: legalHash,
          ipfs_hash: ipfsHash || null,
          blockchain_tx: blockchainTx,
          block_number: blockNumber || null,
          is_listed: true,
          sale_price: salePrice || 0,
          allow_lease: allowLease || false,
          commercial_use: commercialUse !== undefined ? commercialUse : true,
          attribution: attribution !== undefined ? attribution : true,
          description: description || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating asset:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      result = data;
    }

    // Store lease pricing in a separate metadata structure (if needed)
    // For now, we'll return it in the response but not store in DB
    // You can add a lease_pricing JSONB column if you want to store this

    return NextResponse.json({
      success: true,
      asset: {
        ...result,
        leasePrice1Month,
        leasePrice6Month,
        leasePrice1Year
      }
    });

  } catch (error) {
    console.error('Marketplace list error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Unlist an asset
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const floralId = searchParams.get('floralId');

    if (!floralId) {
      return NextResponse.json(
        { success: false, error: 'Missing floralId' },
        { status: 400 }
      );
    }

    // Update the asset to unlist it
    const { data, error } = await supabase
      .from('assets')
      .update({
        is_listed: false,
        updated_at: new Date().toISOString()
      })
      .eq('floral_id', floralId)
      .eq('creator_uid', user.id) // Ensure user owns the asset
      .select()
      .single();

    if (error) {
      console.error('Error unlisting asset:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      asset: data
    });

  } catch (error) {
    console.error('Marketplace unlist error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
