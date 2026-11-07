import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { createClient, getServerUser } from '@/lib/supabase/server';

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
  'https://polygon.drpc.org',
];

async function getPolygonProvider() {
  const providers = [process.env.POLYGON_RPC_URL, ...POLYGON_RPCS].filter((url): url is string => !!url);
  return Promise.any(providers.map(async url => {
    const provider = new ethers.providers.StaticJsonRpcProvider({ url, timeout: 4500 }, { name: 'matic', chainId: 137 });
    if (Number(await provider.send('eth_chainId', [])) !== 137) {
      throw new Error('RPC is not on Polygon mainnet');
    }
    return provider;
  }));
}

function hasTimestampEvent(receipt: ethers.providers.TransactionReceipt, contractAddress: string, legalHash: string) {
  const event = new ethers.utils.Interface(CONTRACT_ABI).getEventTopic('TimestampCreated');
  const indexedHash = ethers.utils.id(legalHash);
  return receipt.status === 1 && receipt.logs.some(log =>
    log.address.toLowerCase() === contractAddress.toLowerCase() &&
    log.topics[0] === event && log.topics[1] === indexedHash
  );
}

/**
 * POST /api/blockchain/timestamp
 * Server-side blockchain timestamping via ethers.js directly on Polygon
 * No ThirdWeb dependency — just ethers + Polygon RPC
 */
export async function POST(request: Request) {
  if (!await getServerUser()) return NextResponse.json({ error: 'Sign in to timestamp a file.' }, { status: 401 });

  try {
    const { legalHash, contentHash, floralHash, ipfsHash } = await request.json();
    if (!/^[a-f0-9]{64}$/.test(legalHash ?? '') || !/^0x[a-f0-9]{16}$/.test(contentHash ?? '') ||
      floralHash !== `🌸 BS-${legalHash.slice(0, 4)}-${legalHash.slice(4, 8)}-${legalHash.slice(8, 12)}` ||
      !/^bafy[a-z2-7]+$/.test(ipfsHash ?? '')) {
      return NextResponse.json({ error: 'Invalid timestamp payload.' }, { status: 400 });
    }

    console.log('🔗 Creating blockchain timestamp for:', legalHash);

    const { data: plan, error: planError } = await (await createClient()).rpc('bloomshield_plan');
    if (planError || !plan) return NextResponse.json({ error: 'Workspace limit unavailable.' }, { status: 503 });
    if (plan.limit !== null && plan.used >= plan.limit) {
      return NextResponse.json({ error: 'Monthly asset limit reached.' }, { status: 409 });
    }

    const privateKey = process.env.THIRDWEB_PRIVATE_KEY;
    const contractAddress = process.env.BLOOMSHIELD_CONTRACT_ADDRESS || process.env.THIRDWEB_CONTRACT_ADDRESS;

    if (!privateKey) {
      throw new Error('Blockchain private key not configured');
    }

    if (!contractAddress) {
      throw new Error('Contract address not configured');
    }

    const provider = await getPolygonProvider();

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
    const tx = await contract.createTimestamp(legalHash, contentHash, floralHash, ipfsHash, 'BloomShield asset', {
      gasLimit: 300000,
      maxPriorityFeePerGas: tip,
      maxFeePerGas: maxFee,
    });

    console.log('⏳ Transaction sent:', tx.hash, '— waiting for confirmation...');

    // Wait for 1 confirmation
    const receipt = await tx.wait(1);
    if (!hasTimestampEvent(receipt, contractAddress, legalHash)) {
      throw new Error('Polygon receipt does not contain the expected timestamp');
    }

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
    if (!txHash && !legalHash || txHash && !/^0x[a-f0-9]{64}$/i.test(txHash) ||
      legalHash && !/^[a-f0-9]{64}$/i.test(legalHash)) {
      return NextResponse.json({ error: 'Provide a valid transaction hash or file hash.' }, { status: 400 });
    }

    const provider = await getPolygonProvider();

    // If txHash provided, verify the transaction
    if (txHash) {
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt) {
        return NextResponse.json({
          success: false,
          error: 'Transaction not found',
        }, { status: 404 });
      }

      const contractAddress = process.env.BLOOMSHIELD_CONTRACT_ADDRESS || process.env.THIRDWEB_CONTRACT_ADDRESS;
      const matchesFile = !!(legalHash && contractAddress && hasTimestampEvent(receipt, contractAddress, legalHash));

      return NextResponse.json({
        success: true,
        verification: {
          matchesFile,
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
