#!/bin/bash
# BloomShield Session Start Hook
# Auto-creates .env.local from .env.example if missing

echo "🔧 BloomShield: Checking environment setup..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "⚠️  .env.local not found - creating from template..."

  # Copy .env.example to .env.local
  if [ -f .env.example ]; then
    cp .env.example .env.local
    echo "✅ .env.local created successfully!"
    echo ""
    echo "📝 IMPORTANT: Please add your actual credentials to .env.local"
    echo "   Required variables:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - THIRDWEB_PRIVATE_KEY (optional, for real blockchain)"
    echo "   - NEXT_PUBLIC_THIRDWEB_CLIENT_ID (optional)"
    echo "   - THIRDWEB_SECRET_KEY (optional)"
    echo "   - THIRDWEB_CONTRACT_ADDRESS (optional)"
    echo ""
    echo "   See PHASE1_AUTH_SETUP.md and BLOCKCHAIN_SETUP.md for details"
    echo ""
  else
    echo "❌ Error: .env.example not found!"
  fi
else
  echo "✅ .env.local already exists"
fi

echo "🚀 Ready to develop!"
