import { NextResponse } from 'next/server';
import { ThirdwebSDK } from '@thirdweb-dev/sdk';

/**
 * POST /api/blockchain/timestamp
 * Server-side blockchain timestamping with ThirdWeb
 */
export async function POST(request: Request) {
  try {
    const { legalHash, contentHash, floralHash, fileName, fileSize, mimeType } = await request.json();

    console.log('🔗 Creating blockchain timestamp for:', legalHash);

    // Initialize ThirdWeb SDK on Base network (90% cheaper gas than Polygon)
    const sdk = ThirdwebSDK.fromPrivateKey(
      process.env.THIRDWEB_PRIVATE_KEY || '',
      'base',
      {
        clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
        secretKey: process.env.THIRDWEB_SECRET_KEY,
      }
    );

    // Get the contract
    const contractAddress = process.env.THIRDWEB_CONTRACT_ADDRESS || '';
    const contract = await sdk.getContract(contractAddress);

    // Create blockchain timestamp transaction
    const tx = await contract.call('createTimestamp', [
      legalHash,
      contentHash,
      floralHash,
      fileName,
    ]);

    console.log('✅ Blockchain timestamp created:', tx.receipt.transactionHash);

    return NextResponse.json({
      success: true,
      blockchain: {
        chain: 'base',
        contractAddress: contractAddress,
        transactionHash: tx.receipt.transactionHash,
        blockNumber: tx.receipt.blockNumber,
        timestamp: Date.now(),
        explorer: `https://basescan.org/tx/${tx.receipt.transactionHash}`,
      },
      hashes: {
        legalHash,
        contentHash,
        floralHash,
      },
    });

  } catch (error: any) {
    console.error('❌ Blockchain timestamp error:', error);

    return NextResponse.json(
      {
        error: 'Failed to create blockchain timestamp',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/blockchain/timestamp - For verification
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const txHash = searchParams.get('txHash');

  try {
    const sdk = ThirdwebSDK.fromPrivateKey(
      process.env.THIRDWEB_PRIVATE_KEY || '',
      'base',
      {
        clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
        secretKey: process.env.THIRDWEB_SECRET_KEY,
      }
    );

    // Get transaction receipt to verify
    const provider = sdk.getProvider();
    const receipt = await provider.getTransactionReceipt(txHash || '');

    return NextResponse.json({
      success: true,
      verification: {
        transactionHash: txHash,
        confirmed: receipt?.confirmations > 0,
        blockNumber: receipt?.blockNumber,
        timestamp: Date.now(),
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to verify timestamp',
        details: error.message
      },
      { status: 500 }
    );
  }
}
