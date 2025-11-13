/**
 * Client-side blockchain service
 * Communicates with server-side API for secure blockchain operations
 * NO CSP ISSUES because all blockchain code runs on the server!
 */

export interface BlockchainTimestampRequest {
  legalHash: string;
  contentHash: string;
  floralHash: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  userId?: string;
}

export interface BlockchainTimestampResponse {
  success: boolean;
  blockchain: {
    chain: string;
    contractAddress: string;
    transactionHash: string;
    blockNumber: number;
    timestamp: number;
    explorer: string;
  };
  hashes: {
    legalHash: string;
    contentHash: string;
    floralHash: string;
  };
  error?: string;
  details?: string;
}

/**
 * Create a blockchain timestamp for file protection
 * Calls the server-side API which handles blockchain interaction
 */
export async function createBlockchainTimestamp(
  data: BlockchainTimestampRequest
): Promise<BlockchainTimestampResponse> {
  try {
    console.log('📤 Sending blockchain timestamp request...', data);
    
    const response = await fetch('/api/blockchain/timestamp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create blockchain timestamp');
    }

    console.log('✅ Blockchain timestamp created successfully!', result);
    return result;
  } catch (error) {
    console.error('❌ Blockchain timestamp error:', error);
    throw error;
  }
}

/**
 * Verify a blockchain timestamp
 * Can verify by transaction hash or by legal hash
 */
export async function verifyBlockchainTimestamp(
  txHashOrLegalHash: string,
  type: 'txHash' | 'legalHash' = 'txHash'
) {
  try {
    console.log(`🔍 Verifying blockchain timestamp by ${type}...`);
    
    const params = new URLSearchParams();
    if (type === 'txHash') {
      params.set('txHash', txHashOrLegalHash);
    } else {
      params.set('legalHash', txHashOrLegalHash);
    }

    const response = await fetch(`/api/blockchain/timestamp?${params.toString()}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to verify timestamp');
    }

    console.log('✅ Timestamp verified successfully!', result);
    return result;
  } catch (error) {
    console.error('❌ Blockchain verification error:', error);
    throw error;
  }
}
