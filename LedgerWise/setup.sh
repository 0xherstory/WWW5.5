#!/bin/bash

echo "🚀 Setting up AI Web3 Expense Tracker..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ npm version: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Copy .env.local.example to .env.local"
    echo "2. Add your API keys to .env.local"
    echo "3. Run 'npm run dev' to start the development server"
    echo ""
else
    echo ""
    echo "❌ Failed to install dependencies"
    exit 1
fi
