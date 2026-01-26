import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// Force dynamic rendering - this route uses cookies for authentication
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const search = searchParams.get('search') || '';
    const assetType = searchParams.get('assetType') || 'all';
    const licenseType = searchParams.get('licenseType') || 'all';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('assets')
      .select('*')
      .eq('is_listed', true);

    // Search filter
    if (search) {
      query = query.or(`file_name.ilike.%${search}%,description.ilike.%${search}%,creator_name.ilike.%${search}%`);
    }

    // Asset type filter
    if (assetType !== 'all') {
      const typeMap: { [key: string]: string } = {
        'images': 'image/%',
        'videos': 'video/%',
        'audio': 'audio/%',
        'documents': 'application/%'
      };

      if (typeMap[assetType]) {
        query = query.like('file_type', typeMap[assetType]);
      }
    }

    // License type filter
    if (licenseType === 'sale') {
      query = query.gt('sale_price', 0);
    } else if (licenseType === 'lease') {
      query = query.eq('allow_lease', true);
    } else if (licenseType === 'commercial') {
      query = query.eq('commercial_use', true);
    }

    // Price range filter
    if (minPrice) {
      query = query.gte('sale_price', parseFloat(minPrice));
    }
    if (maxPrice) {
      query = query.lte('sale_price', parseFloat(maxPrice));
    }

    // Sorting
    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'price-low':
        query = query.order('sale_price', { ascending: true });
        break;
      case 'price-high':
        query = query.order('sale_price', { ascending: false });
        break;
      case 'name':
        query = query.order('file_name', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching listings:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Transform data to match frontend format
    const listings = (data || []).map(asset => ({
      assetId: asset.floral_id,
      fileName: asset.file_name,
      fileType: asset.file_type,
      fileSize: asset.file_size,
      creator: asset.creator_name,
      creatorWallet: asset.creator_wallet,
      legalHash: asset.legal_hash,
      ipfsHash: asset.ipfs_hash,
      blockchainTx: asset.blockchain_tx,
      blockNumber: asset.block_number,
      protectedDate: asset.timestamp || asset.created_at,
      isListed: asset.is_listed,
      salePrice: parseFloat(asset.sale_price || '0'),
      allowLease: asset.allow_lease,
      commercialUse: asset.commercial_use,
      attribution: asset.attribution,
      description: asset.description,
      listedDate: asset.updated_at || asset.created_at
    }));

    return NextResponse.json({
      success: true,
      listings,
      total: count || listings.length,
      limit,
      offset
    });

  } catch (error) {
    console.error('Marketplace listings error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
