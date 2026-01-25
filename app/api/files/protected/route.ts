import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

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

    // Fetch user's protected files from database
    const { data: files, error: filesError } = await supabase
      .from('protected_files')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    console.log(`📊 Query result: ${files?.length || 0} files found for user ${user.id}`);

    if (filesError) {
      console.error('Error fetching protected files:', filesError);
      return NextResponse.json(
        { success: false, error: filesError.message },
        { status: 500 }
      );
    }

    // Transform to match frontend format
    const transformedFiles = (files || []).map(file => ({
      assetId: file.floral_hash,
      fileName: file.file_name,
      fileType: file.mime_type,
      fileSize: `${(file.file_size / 1024 / 1024).toFixed(2)} MB`,
      protectedDate: file.created_at,
      creator: user.email?.split('@')[0] || 'User',
      email: user.email || '',
      legalHash: file.legal_hash,
      contentHash: file.content_hash,
      floralHash: file.floral_hash,
      blockchainTx: file.blockchain_tx,
      ownerWallet: user.user_metadata?.wallet_address || '',
      ipfsHash: file.ipfs_hash || 'Qm' + Array.from({length: 44}, () =>
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
      ).join(''),
      storagePath: file.storage_path,
      isListed: false // Will be checked against assets table
    }));

    return NextResponse.json({
      success: true,
      files: transformedFiles,
      count: transformedFiles.length
    });

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
        file_name: fileName,
        file_size: fileSize,
        mime_type: fileType,
        storage_path: storagePath || null,
        legal_hash: legalHash,
        content_hash: contentHash,
        floral_hash: floralHash,
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
      assetId: data.floral_hash,
      fileName: data.file_name,
      fileType: data.mime_type,
      fileSize: `${(data.file_size / 1024 / 1024).toFixed(2)} MB`,
      protectedDate: data.created_at,
      creator: user.email?.split('@')[0] || 'User',
      email: user.email || '',
      legalHash: data.legal_hash,
      contentHash: data.content_hash,
      floralHash: data.floral_hash,
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
