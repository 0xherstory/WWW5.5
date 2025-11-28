#!/bin/bash

echo "🚀 AI Web3 Expense Tracker - Quick Setup"
echo "========================================"
echo ""

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js version is $NODE_VERSION. Recommended: v18 or higher."
fi

echo "✅ Node.js: $(node -v)"
echo "✅ npm: $(npm -v)"
echo ""

# Clean up old installations
echo "🧹 Cleaning up old installations..."
rm -rf node_modules
rm -rf .next
rm -f package-lock.json

# Install dependencies
echo ""
echo "📦 Installing dependencies (this may take a few minutes)..."
npm install --legacy-peer-deps

# Check installation status
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Installation complete!"
    echo ""
    echo "📝 Next steps:"
    echo ""
    echo "1. Setup environment variables:"
    echo "   cp .env.local.example .env.local"
    echo "   # Then edit .env.local with your API keys"
    echo ""
    echo "2. Get your API keys:"
    echo "   • Qwen: https://dashscope.aliyun.com/"
    echo "   • Claude (backup): https://console.anthropic.com/"
    echo "   • Web3.Storage: https://web3.storage/"
    echo "   • WalletConnect: https://cloud.walletconnect.com/"
    echo ""
    echo "3. Start development server:"
    echo "   npm run dev"
    echo ""
    echo "4. Open your browser:"
    echo "   http://localhost:3000"
    echo ""
else
    echo ""
    echo "❌ Installation failed!"
    echo ""
    echo "Try alternative installation:"
    echo "1. Using yarn instead:"
    echo "   npm install -g yarn"
    echo "   yarn install"
    echo ""
    echo "2. Or manual installation:"
    echo "   npm install --force"
    echo ""
    echo "See TROUBLESHOOTING.md for more help."
fi
