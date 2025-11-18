const { ThirdwebSDK } = require('@thirdweb-dev/sdk');
require('dotenv').config({ path: '.env.local' });

async function deployContract() {
  console.log('🚀 Deploying BloomShield Timestamp Contract on Base Sepolia Testnet...\n');

  // Initialize SDK on Base Sepolia testnet
  const sdk = ThirdwebSDK.fromPrivateKey(
    process.env.THIRDWEB_PRIVATE_KEY,
    'base-sepolia-testnet',
    {
      clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
      secretKey: process.env.THIRDWEB_SECRET_KEY,
    }
  );

  console.log('✅ SDK initialized on Base Sepolia testnet');
  console.log('📍 Wallet address:', await sdk.wallet.getAddress());

  // Check wallet balance
  const balance = await sdk.wallet.balance();
  console.log('💰 Wallet balance:', balance.displayValue, 'ETH\n');

  if (parseFloat(balance.displayValue) === 0) {
    console.log('⚠️  Wallet has 0 ETH!');
    console.log('');
    console.log('To get FREE testnet ETH:');
    console.log('1. Go to: https://www.alchemy.com/faucets/base-sepolia');
    console.log('2. Enter wallet address:', await sdk.wallet.getAddress());
    console.log('3. Click "Send Me ETH"');
    console.log('4. Wait 30 seconds and run this script again\n');
    process.exit(1);
  }

  // Contract source code
  const contractSource = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BloomShieldTimestamp {
    struct Timestamp {
        string legalHash;
        string contentHash;
        string floralHash;
        string fileName;
        address creator;
        uint256 blockNumber;
        uint256 timestamp;
    }

    mapping(string => Timestamp) public timestamps;

    event TimestampCreated(
        string indexed legalHash,
        address indexed creator,
        uint256 timestamp
    );

    function createTimestamp(
        string memory legalHash,
        string memory contentHash,
        string memory floralHash,
        string memory fileName
    ) public {
        require(bytes(timestamps[legalHash].legalHash).length == 0, "Already timestamped");

        timestamps[legalHash] = Timestamp({
            legalHash: legalHash,
            contentHash: contentHash,
            floralHash: floralHash,
            fileName: fileName,
            creator: msg.sender,
            blockNumber: block.number,
            timestamp: block.timestamp
        });

        emit TimestampCreated(legalHash, msg.sender, block.timestamp);
    }

    function getTimestamp(string memory legalHash) public view returns (Timestamp memory) {
        return timestamps[legalHash];
    }
}
  `;

  try {
    console.log('📝 Deploying contract...');

    // Deploy the contract
    const address = await sdk.deployer.deployContractFromUri(
      'https://ipfs.thirdweb.com/ipfs/QmUQfbvhZ6s4Ly9dDH3JVJvYJx9TxkZYFYK2QRJCBZJXLu', // Pre-compiled timestamp contract
      [],
      {
        name: 'BloomShield Timestamp Registry',
        symbol: 'BLOOM',
        description: 'Immutable timestamp registry for BloomShield file protection'
      }
    );

    console.log('\n✅ CONTRACT DEPLOYED SUCCESSFULLY!\n');
    console.log('Contract Address:', address);
    console.log('Network: Base Sepolia Testnet');
    console.log('Explorer:', `https://sepolia.basescan.org/address/${address}`);
    console.log('\n📋 Next steps:');
    console.log('1. Add to .env.local: THIRDWEB_CONTRACT_ADDRESS=' + address);
    console.log('2. Add to Vercel environment variables');
    console.log('3. Deploy to production!\n');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

deployContract().catch(console.error);
