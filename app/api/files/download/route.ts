import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

/**
 * Secure file download endpoint
 * Verifies user ownership or purchase before allowing download
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ Unauthorized download attempt');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get file ID from query params
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const floralHash = searchParams.get('floralHash');

    if (!fileId && !floralHash) {
      return NextResponse.json(
        { success: false, error: 'File ID or Floral Hash required' },
        { status: 400 }
      );
    }

    // Query the protected_files table to verify ownership
    let query = supabase
      .from('protected_files')
      .select('*');

    if (fileId) {
      query = query.eq('id', fileId);
    } else if (floralHash) {
      query = query.eq('floral_hash', floralHash);
    }

    const { data: file, error: fileError } = await query.single();

    if (fileError || !file) {
      console.log(`❌ File not found: ${fileId || floralHash}`);
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    console.log(`🔍 Download request for file: ${file.file_name}`);
    console.log(`  - Owner: ${file.user_id}`);
    console.log(`  - Requester: ${user.id}`);

    // Check if user is the owner
    const isOwner = file.user_id === user.id;

    // Check if user has purchased access (lease or outright purchase)
    let hasPurchaseAccess = false;
    if (!isOwner) {
      // Check assets table for purchase
      const { data: asset } = await supabase
        .from('assets')
        .select('*')
        .eq('floral_id', file.floral_hash)
        .single();

      if (asset) {
        // Check if user purchased outright
        hasPurchaseAccess = asset.buyer_uid === user.id;

        // Check if user has active lease
        if (!hasPurchaseAccess) {
          const { data: lease } = await supabase
            .from('leases')
            .select('*')
            .eq('floral_id', file.floral_hash)
            .eq('lessee_uid', user.id)
            .eq('active', true)
            .single();

          if (lease) {
            // Verify lease is not expired
            const endDate = new Date(lease.end_date);
            hasPurchaseAccess = endDate > new Date();
          }
        }
      }
    }

    // Deny access if user doesn't own and hasn't purchased
    if (!isOwner && !hasPurchaseAccess) {
      console.log(`❌ Access denied: User does not own or have purchase rights`);
      return NextResponse.json(
        { success: false, error: 'Access denied. You do not own this file.' },
        { status: 403 }
      );
    }

    // Generate signed URL from Supabase Storage (valid for 1 hour)
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('protected-files')
      .createSignedUrl(file.storage_path, 3600); // 1 hour expiry

    if (urlError || !signedUrl) {
      console.error('❌ Failed to generate download URL:', urlError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate download URL' },
        { status: 500 }
      );
    }

    console.log(`✅ Download authorized for ${user.email}`);

    return NextResponse.json({
      success: true,
      downloadUrl: signedUrl.signedUrl,
      fileName: file.file_name,
      fileSize: file.file_size,
      mimeType: file.mime_type,
      expiresIn: 3600, // seconds
      accessType: isOwner ? 'owner' : 'purchased'
    });

  } catch (error: any) {
    console.error('❌ Download endpoint error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
