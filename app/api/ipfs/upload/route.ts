import { NextRequest, NextResponse } from 'next/server';

/**
 * IPFS Upload Endpoint - Pins files to IPFS via Pinata
 * Returns real IPFS CID that can be verified on public gateways
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Pinata is configured
    const pinataJwt = process.env.PINATA_JWT;
    const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.pinata.cloud';

    if (!pinataJwt) {
      console.warn('⚠️ PINATA_JWT not configured - IPFS upload skipped');
      return NextResponse.json({
        success: false,
        error: 'IPFS service not configured',
        fallback: true
      }, { status: 503 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const floralHash = formData.get('floralHash') as string;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    console.log(`📤 Uploading to IPFS via Pinata: ${fileName}`);
    console.log(`  File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

    // Prepare form data for Pinata API
    const pinataFormData = new FormData();
    pinataFormData.append('file', file);

    // Add optional metadata
    const metadata = JSON.stringify({
      name: fileName || file.name,
      keyvalues: {
        floralHash: floralHash || '',
        protectedDate: new Date().toISOString(),
        source: 'BloomShield V2'
      }
    });
    pinataFormData.append('pinataMetadata', metadata);

    // Upload to Pinata IPFS
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataJwt}`
      },
      body: pinataFormData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const ipfsCid = result.IpfsHash;
    const ipfsUrl = `${gatewayUrl}/ipfs/${ipfsCid}`;

    console.log(`✅ File pinned to IPFS successfully`);
    console.log(`  CID: ${ipfsCid}`);
    console.log(`  Gateway URL: ${ipfsUrl}`);

    return NextResponse.json({
      success: true,
      ipfsCid: ipfsCid,
      ipfsUrl: ipfsUrl,
      gatewayUrl: gatewayUrl,
      pinataUrl: `https://app.pinata.cloud/pinmanager?search=${ipfsCid}`,
      timestamp: result.Timestamp
    });

  } catch (error: any) {
    console.error('❌ IPFS upload failed:', error);

    // Return graceful error - don't block file protection
    return NextResponse.json({
      success: false,
      error: error.message || 'IPFS upload failed',
      fallback: true
    }, { status: 500 });
  }
}
