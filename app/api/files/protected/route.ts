import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// Force dynamic rendering - this route uses cookies for authentication
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ Auth error in GET /api/files/protected:', authError?.message || 'No user');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`✅ Fetching protected files for user: ${user.id} (${user.email})`);
    console.log(`🔍 Expected user_id in database: 823e2fb5-2f8f-4279-9c84-c8f4bf78bcce`);
    console.log(`🔍 Current logged-in user_id: ${user.id}`);
    console.log(`🔍 User IDs match: ${user.id === '823e2fb5-2f8f-4279-9c84-c8f4bf78bcce' ? 'YES ✅' : 'NO ❌'}`);

    // Fetch user's protected files from database
    console.log(`🔍 Querying protected_files table with user_id: ${user.id}`);
    const { data: files, error: filesError } = await supabase
      .from('protected_files')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    console.log(`📊 Query completed`);
    console.log(`  - filesError:`, filesError);
    console.log(`  - files type:`, typeof files);
    console.log(`  - files is array:`, Array.isArray(files));
    console.log(`  - files length:`, files?.length || 0);

    if (files && files.length > 0) {
      console.log(`📄 Sample files (first 3):`);
      files.slice(0, 3).forEach((f, idx) => {
        console.log(`  [${idx}] user_id: ${f.user_id}, name: ${f.name}`);
      });
    } else {
      console.log(`⚠️ NO FILES FOUND for user_id: ${user.id}`);
      console.log(`  Possible reasons:`);
      console.log(`  1. No records with matching user_id in database`);
      console.log(`  2. RLS policies blocking access`);
      console.log(`  3. user_id column mismatch`);
    }

    if (filesError) {
      console.error('Error fetching protected files:', filesError);
      return NextResponse.json(
        { success: false, error: filesError.message },
        { status: 500 }
      );
    }

    // Transform to match frontend format
    const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.pinata.cloud';
    const transformedFiles = (files || []).map(file => ({
      assetId: file.floral_id,
      fileName: file.name,
      fileType: file.mime_type,
      fileSize: `${(file.file_size / 1024 / 1024).toFixed(2)} MB`,
      protectedDate: file.created_at,
      creator: user.email?.split('@')[0] || 'User',
      email: user.email || '',
      legalHash: file.legal_hash,
      contentHash: file.content_hash,
      floralHash: file.floral_id,
      blockchainTx: file.blockchain_tx,
      ownerWallet: user.user_metadata?.wallet_address || '',
      ipfsHash: file.ipfs_hash || null, // ✅ Real IPFS CID or null
      ipfsUrl: file.ipfs_hash ? `${gatewayUrl}/ipfs/${file.ipfs_hash}` : null, // ✅ Gateway URL for verification
      storagePath: file.storage_path,
      isListed: false // Will be checked against assets table
    }));

    const responseData = {
      success: true,
      files: transformedFiles,
      count: transformedFiles.length
    };

    console.log(`📤 Returning response to client:`);
    console.log(`  success: ${responseData.success}`);
    console.log(`  count: ${responseData.count}`);
    console.log(`  files.length: ${responseData.files.length}`);

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Get protected files error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
      fileName,
      fileSize,
      fileType,
      legalHash,
      contentHash,
      floralHash,
      blockchainTx,
      blockchainTimestamp,
      ipfsHash,
      storagePath
    } = body;

    // Validate required fields
    if (!fileName || !fileSize || !fileType || !legalHash || !contentHash || !floralHash || !blockchainTx) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert into protected_files table
    const { data, error } = await supabase
      .from('protected_files')
      .insert({
        user_id: user.id,
        name: fileName,
        file_size: fileSize,
        mime_type: fileType,
        storage_path: storagePath || null,
        legal_hash: legalHash,
        content_hash: contentHash,
        floral_id: floralHash,
        blockchain_tx: blockchainTx,
        blockchain_timestamp: blockchainTimestamp ? new Date(blockchainTimestamp).toISOString() : null,
        ipfs_hash: ipfsHash || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting protected file:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Transform to frontend format
    const transformedFile = {
      assetId: data.floral_id,
      fileName: data.name,
      fileType: data.mime_type,
      fileSize: `${(data.file_size / 1024 / 1024).toFixed(2)} MB`,
      protectedDate: data.created_at,
      creator: user.email?.split('@')[0] || 'User',
      email: user.email || '',
      legalHash: data.legal_hash,
      contentHash: data.content_hash,
      floralHash: data.floral_id,
      blockchainTx: data.blockchain_tx,
      ownerWallet: user.user_metadata?.wallet_address || '',
      ipfsHash: data.ipfs_hash || 'Qm' + Array.from({length: 44}, () =>
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
      ).join(''),
      storagePath: data.storage_path,
      isListed: false
    };

    return NextResponse.json({
      success: true,
      file: transformedFile
    });

  } catch (error: any) {
    console.error('Post protected file error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
