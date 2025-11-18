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

    // Check if contract address is configured
    const contractAddress = process.env.THIRDWEB_CONTRACT_ADDRESS || '';

    // If no contract address, return simulated blockchain response
    if (!contractAddress || contractAddress === '0x_your_contract_address_here') {
      console.log('⚠️  No contract deployed - using simulated blockchain mode');

      const simulatedTxHash = `0xSIM${Date.now().toString(16)}${Math.random().toString(16).slice(2, 18)}`;
      const simulatedBlockNumber = Math.floor(Date.now() / 1000);

      return NextResponse.json({
        success: true,
        simulated: true,
        blockchain: {
          chain: 'base',
          contractAddress: 'Not deployed (simulated mode)',
          transactionHash: simulatedTxHash,
          blockNumber: simulatedBlockNumber,
          timestamp: Date.now(),
          explorer: `https://basescan.org/tx/${simulatedTxHash}`,
        },
        hashes: {
          legalHash,
          contentHash,
          floralHash,
        },
      });
    }

    // Real blockchain mode - Initialize ThirdWeb SDK on Base network
    const sdk = ThirdwebSDK.fromPrivateKey(
      process.env.THIRDWEB_PRIVATE_KEY || '',
      'base',
      {
        clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
        secretKey: process.env.THIRDWEB_SECRET_KEY,
      }
    );

    // Get the contract
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
      simulated: false,
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
