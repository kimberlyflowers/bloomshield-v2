import { NextResponse } from 'next/server';
import { pinMetadataToIPFS } from '@/lib/pinata-service';
import { getServerUser } from '@/lib/supabase/server';

export async function POST(request: Request) {
  if (!await getServerUser()) {
    return NextResponse.json({ error: 'Sign in to protect a file.' }, { status: 401 });
  }

  try {
    const { legalHash, contentHash, floralHash } = await request.json();
    if (!/^[a-f0-9]{64}$/.test(legalHash ?? '') || !/^0x[a-f0-9]{16}$/.test(contentHash ?? '') ||
      floralHash !== `🌸 BS-${legalHash.slice(0, 4)}-${legalHash.slice(4, 8)}-${legalHash.slice(8, 12)}`) {
      return NextResponse.json({ error: 'Invalid protection hashes.' }, { status: 400 });
    }
    const ipfsHash = await pinMetadataToIPFS({ legalHash, contentHash, floralHash });
    return NextResponse.json({ success: true, ipfsHash });
  } catch (error) {
    console.error('Could not pin protection metadata', error);
    return NextResponse.json({ error: 'Metadata storage unavailable.' }, { status: 502 });
  }
}
