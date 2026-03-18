import { NextResponse } from 'next/server';
import { pinMetadataToIPFS, FileMetadata } from '@/lib/pinata-service';

/**
 * POST /api/ipfs/pin
 * Server-side IPFS pinning via Pinata
 * Never expose Pinata API keys on the client
 */
export async function POST(request: Request) {
  try {
    const metadata: FileMetadata = await request.json();

    // Validate required fields
    const requiredFields = [
      'legalHash',
      'contentHash',
      'floralHash',
      'fileName',
      'fileType',
      'fileSize',
      'creator',
      'timestamp',
    ];

    for (const field of requiredFields) {
      if (!metadata[field as keyof FileMetadata]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    console.log('📌 Pinning metadata to IPFS:', metadata.legalHash);

    // Pin to Pinata IPFS
    const ipfsHash = await pinMetadataToIPFS(metadata);

    console.log('✅ Metadata pinned successfully:', ipfsHash);

    return NextResponse.json(
      {
        success: true,
        ipfsHash: ipfsHash,
        gateway: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ IPFS pinning error:', error);

    // Check if it's a Pinata API error
    if (error.message?.includes('Pinata API')) {
      return NextResponse.json(
        {
          error: 'Pinata IPFS service error',
          details: error.message,
        },
        { status: 502 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Failed to pin metadata to IPFS',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ipfs/pin
 * Optional: Verify that a hash is pinned
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ipfsHash = searchParams.get('hash');

  if (!ipfsHash) {
    return NextResponse.json(
      { error: 'Missing IPFS hash parameter' },
      { status: 400 }
    );
  }

  try {
    console.log('🔍 Verifying IPFS pin:', ipfsHash);

    // In production, you might want to implement actual verification
    // For now, just confirm the format is valid
    if (!ipfsHash.startsWith('Qm') && !ipfsHash.startsWith('bafy')) {
      return NextResponse.json(
        { error: 'Invalid IPFS hash format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        ipfsHash: ipfsHash,
        gateway: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ IPFS verification error:', error);

    return NextResponse.json(
      {
        error: 'Failed to verify IPFS pin',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
