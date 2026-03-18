/**
 * Deploy BloomShieldTimestamp contract to Polygon mainnet
 *
 * Usage (from the bloomshield-v2 directory):
 *   PRIVATE_KEY=your_key_here node scripts/deploy-contract.js
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load compiled contract
const compiled = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../contracts/BloomShieldTimestamp.json'), 'utf8')
);

// Polygon mainnet RPCs (fallback list)
const POLYGON_RPCS = [
  'https://polygon-rpc.com',
  'https://polygon-bor-rpc.publicnode.com',
  'https://rpc.ankr.com/polygon',
];

async function main() {
  const privateKey = process.env.PRIVATE_KEY || process.env.THIRDWEB_PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ Set PRIVATE_KEY env var. Example:');
    console.error('   PRIVATE_KEY=0x... node scripts/deploy-contract.js');
    process.exit(1);
  }

  const key = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;

  console.log('🚀 Deploying BloomShieldTimestamp to Polygon mainnet...\n');

  // Try RPCs until one works
  let provider;
  for (const rpc of POLYGON_RPCS) {
    try {
      provider = new ethers.providers.JsonRpcProvider(rpc);
      await provider.getBlockNumber();
      console.log('📡 Connected via:', rpc);
      break;
    } catch (e) {
      console.log('   RPC failed:', rpc);
      provider = null;
    }
  }

  if (!provider) {
    console.error('❌ Could not connect to any Polygon RPC');
    process.exit(1);
  }

  const wallet = new ethers.Wallet(key, provider);
  console.log('👛 Wallet:', wallet.address);

  const balance = await wallet.getBalance();
  console.log('💰 Balance:', ethers.utils.formatEther(balance), 'MATIC\n');

  if (balance.lt(ethers.utils.parseEther('0.01'))) {
    console.error('❌ Need at least 0.01 MATIC. Send MATIC to:', wallet.address);
    process.exit(1);
  }

  console.log('📦 Deploying contract...');
  const factory = new ethers.ContractFactory(compiled.abi, compiled.bytecode, wallet);
  const contract = await factory.deploy({ gasLimit: 3000000 });

  console.log('⏳ TX sent:', contract.deployTransaction.hash);
  console.log('   Waiting for confirmation...\n');

  await contract.deployed();

  console.log('✅ DEPLOYED!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Contract Address:', contract.address);
  console.log('🔗 Explorer: https://polygonscan.com/address/' + contract.address);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('👉 Add to Vercel env vars:');
  console.log('   BLOOMSHIELD_CONTRACT_ADDRESS=' + contract.address);
}

main().catch((error) => {
  console.error('❌ Failed:', error.message);
  process.exit(1);
});
