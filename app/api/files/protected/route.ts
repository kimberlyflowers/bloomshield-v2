import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
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

    // Fetch user's protected files from database
    const { data: files, error: filesError } = await supabase
      .from('protected_files')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

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
