import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// BloomShieldTimestamp contract ABI (only the functions we need)
const CONTRACT_ABI = [
  'function createTimestamp(string legalHash, string contentHash, string floralHash, string ipfsHash, string fileName) external returns (bool)',
  'function getTimestamp(string legalHash) external view returns (bool exists, string contentHash, string floralHash, string ipfsHash, string fileName, uint256 timestamp, address creator)',
  'function timestampExists(string legalHash) external view returns (bool)',
  'event TimestampCreated(string indexed legalHash, string contentHash, string floralHash, string ipfsHash, string fileName, uint256 timestamp, address creator)',
];

// Polygon mainnet RPCs (fallback list for reliability)
const POLYGON_RPCS = [
  'https://polygon-bor-rpc.publicnode.com',
  'https://polygon-rpc.com',
  'https://rpc.ankr.com/polygon',
  'https://polygon.llamarpc.com',
];

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

    // Connect to Polygon — try multiple RPCs for reliability
    let provider: ethers.providers.JsonRpcProvider | null = null;
    for (const rpc of POLYGON_RPCS) {
      try {
        const p = new ethers.providers.JsonRpcProvider(rpc);
        await p.getNetwork(); // verify connection
        provider = p;
        console.log('📡 Connected via:', rpc);
        break;
      } catch (e) {
        console.log('   RPC failed:', rpc);
      }
    }

    if (!provider) {
      throw new Error('Could not connect to any Polygon RPC');
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wallet);

    console.log('👛 Wallet:', wallet.address);

    // Get current gas prices — Polygon needs a minimum tip
    const feeData = await provider.getFeeData();
    const minTip = ethers.utils.parseUnits('30', 'gwei');
    const tip = feeData.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas.gt(minTip)
      ? feeData.maxPriorityFeePerGas : minTip;
    const maxFee = feeData.maxFeePerGas && feeData.maxFeePerGas.gt(ethers.utils.parseUnits('60', 'gwei'))
      ? feeData.maxFeePerGas : ethers.utils.parseUnits('60', 'gwei');

    // Send transaction — all 5 hashes go on-chain
    const tx = await contract.createTimestamp(legalHash, contentHash, floralHash, ipfsHash, fileName, {
      gasLimit: 300000,
      maxPriorityFeePerGas: tip,
      maxFeePerGas: maxFee,
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
