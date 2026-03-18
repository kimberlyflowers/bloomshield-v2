/**
 * Pinata IPFS Service
 * Handles pinning file metadata to IPFS via Pinata
 * Supports JWT auth (PINATA_JWT) or API Key/Secret auth (PINATA_API_KEY + PINATA_API_SECRET)
 */

export interface FileMetadata {
  legalHash: string;
  contentHash: string;
  floralHash: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  creator: string;
  creatorEmail?: string;
  blockchainTx?: string;
  timestamp: string;
  ipfsHash?: string;
}

/**
 * Get Pinata auth headers - supports JWT or API Key/Secret
 */
function getPinataHeaders(): Record<string, string> {
  const jwt = process.env.PINATA_JWT;
  const apiKey = process.env.PINATA_API_KEY;
  const apiSecret = process.env.PINATA_API_SECRET;

  if (jwt) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    };
  }

  if (apiKey && apiSecret) {
    return {
      'Content-Type': 'application/json',
      pinata_api_key: apiKey,
      pinata_secret_api_key: apiSecret,
    };
  }

  throw new Error('Pinata credentials not configured. Set PINATA_JWT or PINATA_API_KEY + PINATA_API_SECRET');
}

/**
 * Pin metadata JSON to Pinata IPFS
 * @param metadata File metadata to pin
 * @returns IPFS CID hash
 */
export async function pinMetadataToIPFS(metadata: FileMetadata): Promise<string> {
  const headers = getPinataHeaders();

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        pinataMetadata: {
          name: `BloomShield-${metadata.legalHash.substring(0, 8)}-metadata`,
          keyvalues: {
            creator: metadata.creator,
            fileName: metadata.fileName,
            legalHash: metadata.legalHash,
            blockchainTx: metadata.blockchainTx || 'pending',
          },
        },
        pinataOptions: {
          cidVersion: 1,
        },
        pinataContent: metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Pinata API error (${response.status}): ${error.error || error.message}`
      );
    }

    const data = await response.json();

    if (!data.IpfsHash) {
      throw new Error('No IPFS hash returned from Pinata');
    }

    console.log(`✅ Metadata pinned to IPFS: ${data.IpfsHash}`);
    return data.IpfsHash;
  } catch (error) {
    console.error('❌ Pinata IPFS pinning error:', error);
    throw error;
  }
}

/**
 * Unpin metadata from Pinata
 * @param ipfsHash IPFS hash to unpin
 */
export async function unpinFromIPFS(ipfsHash: string): Promise<void> {
  const headers = getPinataHeaders();
  // Remove Content-Type for DELETE
  delete headers['Content-Type'];

  try {
    const response = await fetch(
      `https://api.pinata.cloud/pinning/unpin/${ipfsHash}`,
      {
        method: 'DELETE',
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Pinata API error (${response.status}): ${error.error || error.message}`
      );
    }

    console.log(`✅ Metadata unpinned from IPFS: ${ipfsHash}`);
  } catch (error) {
    console.error('❌ Pinata IPFS unpinning error:', error);
    throw error;
  }
}

/**
 * Verify that a hash is pinned on IPFS
 * @param ipfsHash IPFS hash to verify
 */
export async function verifyIPFSPin(ipfsHash: string): Promise<boolean> {
  const headers = getPinataHeaders();

  try {
    const response = await fetch(
      `https://api.pinata.cloud/data/pinList?hashContains=${ipfsHash}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Pinata API error (${response.status})`);
    }

    const data = await response.json();
    const pinned = data.rows?.some((row: any) => row.ipfs_pin_hash === ipfsHash);

    return !!pinned;
  } catch (error) {
    console.error('❌ Pinata IPFS verification error:', error);
    return false;
  }
}
