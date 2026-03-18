import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// BloomShieldTimestamp contract ABI (only the functions we need)
const CONTRACT_ABI = [
  'function createTimestamp(string legalHash, string contentHash, string floralHash, string ipfsHash, string fileName) external returns (bool)',
  'function getTimestamp(string legalHash) external view returns (bool exists, string contentHash, string floralHash, string ipfsHash, string fileName, uint256 timestamp, address creator)',
  'function timestampExists(string legalHash) external view returns (bool)',
  'event TimestampCreated(string indexed legalHash, string contentHash, string floralHash, string ipfsHash, string fileName, uint256 timestamp, address creator)',
];

// Polygon mainnet RPC (public, no API key needed)
const POLYGON_RPC = 'https://polygon-rpc.com';

/**
 * POST /api/blockchain/timestamp
 * Server-side blockchain timestamping via ethers.js directly on Polygon
 * No ThirdWeb dependency — just ethers + Polygon RPC
 */
export async function POST(request: Request) {
  try {
    const { legalHash, contentHash, floralHash, ipfsHash, fileName } = await request.json();

    console.log('🔗 Creating blockchain timestamp for:', legalHash);

    const privateKey = process.env.THIRDWEB_PRIVATE_KEY;
    const contractAddress = process.env.BLOOMSHIELD_CONTRACT_ADDRESS || process.env.THIRDWEB_CONTRACT_ADDRESS;

    if (!privateKey) {
      throw new Error('Blockchain private key not configured');
    }

    if (!contractAddress) {
      throw new Error('Contract address not configured');
    }

    // Connect to Polygon
    const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wallet);

    console.log('📡 Connected to Polygon. Wallet:', wallet.address);

    // Send transaction — all 5 hashes go on-chain
    const tx = await contract.createTimestamp(legalHash, contentHash, floralHash, ipfsHash, fileName, {
      gasLimit: 300000, // Safe gas limit for this operation
    });

    console.log('⏳ Transaction sent:', tx.hash, '— waiting for confirmation...');

    // Wait for 1 confirmation
    const receipt = await tx.wait(1);

    console.log('✅ Blockchain timestamp confirmed:', receipt.transactionHash, 'Block:', receipt.blockNumber);

    return NextResponse.json({
      success: true,
      blockchain: {
        chain: 'polygon',
        contractAddress: contractAddress,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        timestamp: Date.now(),
        explorer: `https://polygonscan.com/tx/${receipt.transactionHash}`,
        gasUsed: receipt.gasUsed.toString(),
      },
      hashes: {
        legalHash,
        contentHash,
        floralHash,
        ipfsHash,
      },
    });

  } catch (error: any) {
    console.error('❌ Blockchain timestamp error:', error);

    return NextResponse.json(
      {
        error: 'Failed to create blockchain timestamp',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/blockchain/timestamp - Verify a transaction or check if a file is timestamped
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const txHash = searchParams.get('txHash');
  const legalHash = searchParams.get('legalHash');

  try {
    const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);

    // If txHash provided, verify the transaction
    if (txHash) {
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt) {
        return NextResponse.json({
          success: false,
          error: 'Transaction not found',
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        verification: {
          transactionHash: txHash,
          confirmed: receipt.confirmations > 0,
          blockNumber: receipt.blockNumber,
          confirmations: receipt.confirmations,
          status: receipt.status === 1 ? 'success' : 'failed',
          explorer: `https://polygonscan.com/tx/${txHash}`,
          timestamp: Date.now(),
        },
      });
    }

    // If legalHash provided, check the contract
    if (legalHash) {
      const contractAddress = process.env.BLOOMSHIELD_CONTRACT_ADDRESS || process.env.THIRDWEB_CONTRACT_ADDRESS;

      if (!contractAddress) {
        throw new Error('Contract address not configured');
      }

      const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
      const exists = await contract.timestampExists(legalHash);

      if (exists) {
        const record = await contract.getTimestamp(legalHash);
        return NextResponse.json({
          success: true,
          verification: {
            exists: true,
            legalHash,
            contentHash: record.contentHash,
            floralHash: record.floralHash,
            ipfsHash: record.ipfsHash,
            fileName: record.fileName,
            timestamp: record.timestamp.toNumber(),
            creator: record.creator,
          },
        });
      }

      return NextResponse.json({
        success: true,
        verification: { exists: false, legalHash },
      });
    }

    return NextResponse.json(
      { error: 'Provide txHash or legalHash query parameter' },
      { status: 400 }
    );

  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to verify timestamp',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
