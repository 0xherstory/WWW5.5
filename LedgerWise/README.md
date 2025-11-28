# AI Web3 Expense Tracker (LedgerWise)

AI-powered Web3 expense tracking application built with Next.js, RainbowKit, and IPFS storage. Experience the future of personal finance with AI intelligence, decentralized storage, and complete data ownership.

## ✨ Features

### 🤖 AI-Powered Input
- **Natural Language Processing**: Input expenses in natural language (e.g., "今天吃饭30块") - automatically parsed by AI
- **OCR Image Recognition**: Upload receipt photos for automatic data extraction (supports JPG, PNG, GIF)
- **PDF Import**: Extract transaction data from PDF files
- **AI Assistant**: Chat with AI about your financial data and get personalized insights
- **Smart Fallback**: Automatically switches between Qwen API and Claude API for reliability

### 📥 Batch Import & Export
- **CSV/Excel Import**: Bulk import transactions from CSV or Excel files
- **Multi-Image Import**: Upload multiple receipt images at once
- **PDF Batch Processing**: Import multiple transactions from PDF files
- **Data Export**: Export your financial data to CSV format
- **Import Preview**: Review and edit imported data before confirmation

### 💰 Financial Management
- **Income & Expense Tracking**: Track both income and expenses with detailed categories
- **Smart Budgeting**: Set monthly budgets for different categories with visual progress tracking
- **Savings Goals**: Create and track multiple savings goals with progress visualization
- **Financial Health Score**: Get AI-powered financial health assessment with detailed insights
- **Category Breakdown**: Automatic categorization with support for:
  - Expenses: Rent & Bills, Food, Shopping, Transport, Entertainment, Investments
  - Income: Salary, Transfer, Other

### 📊 Analytics & Visualization
- **Today's Transactions**: Real-time view of today's income and expenses
- **Monthly Statistics**: Comprehensive monthly income/expense breakdown
- **Visual Charts**: 
  - Area charts for spending trends
  - Sankey diagrams for budget flow
  - Total savings charts
  - Dot grid progress indicators
- **Top Categories**: Identify your biggest spending categories

### 🔐 Web3 & Security
- **End-to-End Encryption**: All data encrypted with wallet signature before storage
- **IPFS Storage**: Decentralized data storage on Pinata IPFS
- **On-Chain Index**: IPFS CID references stored on Ethereum blockchain
- **Cross-Device Recovery**: Automatically restore all data on any device by connecting wallet
- **Wallet Integration**: Connect with MetaMask and other wallets via RainbowKit
- **Data Ownership**: You own your data through your wallet signature

### 🏆 Web3 Features
- **NFT Milestones**: Earn "First Expense NFT" when you make your first transaction
- **Blockchain Index**: Permanent record of your data on Ethereum Sepolia testnet
- **Smart Contracts**: Deployed contracts for expense tracking and NFT minting

### 🔄 Data Management
- **Auto-Restore**: Intelligent data recovery from blockchain when switching devices
- **Local Storage**: Fast local access with LocalStorage
- **Backup & Restore**: Export and import your complete financial data
- **CID Tracking**: View and copy IPFS Content IDs for each transaction

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React icons, custom components

### Web3
- **Wallet**: RainbowKit
- **Ethereum**: Wagmi, Viem
- **Blockchain**: Ethereum Sepolia testnet
- **Smart Contracts**: Solidity ^0.8.0

### AI Services
- **Primary**: Alibaba Qwen (通义千问) - qwen-turbo for text, qwen-vl-max for vision
- **Fallback**: Claude API (Anthropic)
- **Features**: Natural language parsing, OCR, PDF extraction, financial insights

### Storage & Infrastructure
- **IPFS**: Pinata (decentralized storage)
- **Encryption**: CryptoJS (AES encryption)
- **Local Storage**: LocalStorage for fast access
- **File Processing**: pdf-parse, papaparse, xlsx

### Data Visualization
- **Charts**: Chart.js, Recharts
- **Chart Types**: Area charts, Sankey diagrams, Radar charts, Progress indicators

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Edit `.env.local` with your API keys:

```env
# AI Service (provide at least one)
QWEN_API_KEY=your_qwen_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here

# IPFS Storage (Pinata)
PINATA_JWT=your_pinata_jwt_token_here

# Wallet
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Smart Contracts (will be updated after deployment)
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_TRACKER_CONTRACT_ADDRESS=0x...
```

**Note**: The app will try Qwen API first, and automatically fallback to Claude if Qwen fails or is not configured.

### 3. Deploy Smart Contracts

#### 3.1 Deploy ExpenseTracker Contract (Required for On-Chain Index)

1. Open [Remix IDE](https://remix.ethereum.org/)
2. Create new file `ExpenseTracker.sol`
3. Copy contract code from `contracts/ExpenseTracker.sol`
4. Compile with Solidity version `^0.8.0`
5. Select "Injected Provider - MetaMask" and connect to **Sepolia testnet**
6. Deploy the contract
7. Copy the deployed contract address
8. Update `.env.local`: `NEXT_PUBLIC_TRACKER_CONTRACT_ADDRESS=0x...`

#### 3.2 Deploy FirstExpenseNFT Contract (Optional - for NFT milestones)

1. In Remix, create new file `FirstExpenseNFT_V3_Standard.sol`
2. Copy contract code from `contracts/FirstExpenseNFT_V3_Standard.sol`
3. Compile and deploy to Sepolia testnet
4. Update `.env.local`: `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...`

**Note**: See `docs/标准版NFT部署完整教程.md` for detailed deployment instructions.

**Important**: Make sure you have Sepolia testnet ETH. Get free test ETH from [Sepolia Faucet](https://sepoliafaucet.com/).

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Keys Setup

### AI Services (Choose at least one)

#### Qwen API (通义千问) - Primary

1. Visit [Alibaba Cloud DashScope](https://dashscope.aliyun.com/)
2. Sign up and get your API key
3. Add to `.env.local` as `QWEN_API_KEY`

#### Claude API - Backup (Optional)

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign up and get your API key
3. Add to `.env.local` as `CLAUDE_API_KEY`

The system will automatically use Claude as a fallback if Qwen is unavailable or fails.

### Web3.Storage

1. Visit [Pinata](https://pinata.cloud/)
2. Sign up for a free account
3. Go to API Keys section
4. Create a new API key and copy the JWT token
5. Add to `.env.local` as `PINATA_JWT`

### WalletConnect Project ID

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Get your Project ID
4. Add to `.env.local` as `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

## 📖 Usage Guide

### Getting Started

1. **Connect Wallet**: 
   - Click the "Connect Wallet" button on the landing page
   - Select your preferred wallet (MetaMask recommended)
   - Sign the message to generate your encryption key

2. **Add Transactions**:
   - **Text Input**: Type natural language like "今天吃饭30块" and click "Analyze"
   - **Image Upload**: Click "Add Receipt" to upload a photo for OCR recognition
   - **Batch Import**: Click "Import File" to import CSV, Excel, PDF, or multiple images
   - Review the AI parsing results and click "Confirm" to save

3. **View Dashboard**:
   - **Overview**: See today's transactions and monthly statistics
   - **Budgeting**: Set up monthly budgets and track spending by category
   - **Savings**: Create savings goals and track progress
   - **Insights**: Get AI-powered financial insights and health scores

4. **Data Management**:
   - **Export**: Export your data to CSV format
   - **Backup**: All data is automatically backed up to IPFS
   - **Recovery**: Connect your wallet on any device to automatically restore all data

### Key Features Explained

#### AI Natural Language Input
Simply type in natural language:
- "今天吃饭30块" → Automatically parsed as: ¥30, Food category, today's date
- "昨天打车12元" → Parsed as: ¥12, Transport, yesterday's date
- "工资5000" → Parsed as: ¥5000, Salary (income), today's date

#### OCR Image Recognition
Upload a receipt photo and the AI will automatically extract:
- Total amount
- Merchant name
- Date
- Category
- Items list (if visible)

#### Batch File Import
Supported formats:
- **CSV/Excel**: Structured data with columns: Date, Amount, Category, Description, Type
- **Images**: Multiple receipt photos (JPG, PNG, GIF)
- **PDF**: Text-based PDF files with transaction data

See `docs/FILE_IMPORT_GUIDE.md` for detailed import instructions.

#### Budget Management
1. Navigate to "Budgeting" tab
2. Complete the onboarding to set monthly income and category budgets
3. View real-time spending vs. budget with visual progress indicators
4. Get alerts when approaching budget limits

#### Savings Goals
1. Navigate to "Savings" tab
2. Click "Add Goal" to create a new savings goal
3. Set target amount and estimated completion date
4. Track progress with visual charts
5. Add or withdraw money from goals

#### Financial Health Score
1. Navigate to "Insights" tab
2. Click "View Financial Health" to see your score
3. Get AI-powered insights and recommendations
4. View detailed breakdown across multiple dimensions

#### NFT Milestones
- Automatically receive "First Expense NFT" when you make your first transaction
- View your NFT in the dashboard
- NFT metadata stored on IPFS with on-chain ownership

### On-Chain Index Benefits

- **Data Permanence**: Your expense CIDs are permanently stored on Ethereum blockchain
- **Cross-Device Sync**: Access your data from any device by connecting your wallet
- **Decentralized**: No central server required - data lives on IPFS + blockchain
- **Ownership**: You own your data through your wallet signature
- **Auto-Restore**: Intelligent recovery system automatically detects and restores missing data

## 📁 Project Structure

```
/app
  /api
    /parse              # AI text parsing endpoint
    /ocr                # OCR image recognition endpoint
    /ipfs-upload        # Pinata IPFS upload endpoint
    /import-csv         # CSV/Excel file import endpoint
    /import-images      # Batch image import endpoint
    /import-pdf         # PDF file import endpoint
    /ai-assistant       # AI chat assistant endpoint
    /financial-health   # Financial health score calculation
    /insights           # Financial insights generation
  /dashboard
    page.tsx            # Main dashboard page
  layout.tsx            # Root layout with wallet provider
  page.tsx              # Landing page
  globals.css           # Global styles
  polyfills.ts          # Browser polyfills

/components
  WalletConnect.tsx     # Wallet connection setup
  ExpenseForm.tsx       # Text input form with AI parsing
  ImageUpload.tsx       # Image upload with OCR recognition
  ExpenseList.tsx       # Expense history display
  TodayTransactions.tsx # Today's income/expense summary
  MonthlyStats.tsx      # Monthly statistics with categories
  AIAssistant.tsx       # AI chat assistant component
  FinancialHealthModal.tsx # Financial health score modal
  MyNFT.tsx             # NFT display component
  ExportMenu.tsx        # Data export menu
  /ui
    Dashboard.tsx       # Main dashboard component
    AIInputHub.tsx      # Unified input hub (text, image, import)
    Sidebar.tsx         # Navigation sidebar
    Navbar.tsx          # Top navigation bar
    HeroSection.tsx     # Landing page hero
    LandingPage.tsx     # Landing page component
    OnboardingModal.tsx # Budget onboarding modal
    SavingsPage.tsx     # Savings goals page
    ImportPreviewModal.tsx # Import preview and edit modal
    /charts
      AreaChart.tsx     # Area chart component
      SankeyChart.tsx   # Sankey diagram component
      SmartBudgetFlow.tsx # Budget flow visualization
      TotalSavingsChart.tsx # Savings trend chart
      DotGridProgress.tsx  # Progress indicator

/hooks
  useExpenseTracker.ts  # Custom hooks for on-chain index
  useFirstExpenseNFT.ts # NFT minting hooks
  useClipboard.ts       # Clipboard utilities

/utils
  crypto.ts             # AES encryption utilities
  ipfs.ts               # Pinata IPFS utilities
  ai.ts                 # AI parsing utilities
  storage.ts            # LocalStorage management
  recovery.ts           # Data recovery from blockchain
  backup.ts             # Data backup and restore
  fileParser.ts         # File parsing (CSV, Excel, PDF, images)
  financial_health_score.ts # Financial health calculation

/contracts
  ExpenseTracker.sol    # On-chain index contract (stores CIDs)
  FirstExpenseNFT_V3_Standard.sol # NFT contract for milestones

/lib
  constants.ts          # App constants, types, and ABIs
  wagmi.ts             # Wagmi configuration
  budgetTypes.ts       # Budget and savings goal types
  contracts.ts         # Contract configuration

/docs
  FILE_IMPORT_GUIDE.md  # File import usage guide
  IMPLEMENTATION.md     # Implementation details
  IMPORT_FEATURE_SUMMARY.md # Import feature summary
  INTEGRATION_COMPLETE.md  # Integration documentation
  NFT_MINTING_COMPLETE.md  # NFT minting guide
  OCR_IMPLEMENTATION.md    # OCR implementation details
  PDF_IMPORT_UPDATE.md     # PDF import documentation
  标准版NFT部署完整教程.md  # NFT deployment tutorial (Chinese)

/public
  /nft-images           # NFT image assets
  import-template.csv   # CSV import template
```


## 🔧 Additional Resources

### Documentation
- **技术设计文档.md**: Complete technical design document (Chinese)
- **AUTO_RESTORE_FEATURE.md**: Auto-restore feature documentation
- **docs/FILE_IMPORT_GUIDE.md**: Detailed file import guide
- **docs/标准版NFT部署完整教程.md**: NFT deployment tutorial (Chinese)

### API Endpoints

All API routes are located in `/app/api`:

- `POST /api/parse` - AI text parsing
- `POST /api/ocr` - OCR image recognition
- `POST /api/ipfs-upload` - Upload encrypted data to IPFS
- `POST /api/import-csv` - Import CSV/Excel files
- `POST /api/import-images` - Batch image import
- `POST /api/import-pdf` - PDF file import
- `POST /api/ai-assistant` - AI chat assistant
- `POST /api/financial-health` - Calculate financial health score
- `POST /api/insights` - Generate financial insights

### Smart Contracts

- **ExpenseTracker.sol**: Stores IPFS CIDs on-chain for cross-device recovery
- **FirstExpenseNFT_V3_Standard.sol**: ERC-721 NFT contract for milestone rewards

### Environment Variables

Required environment variables (`.env.local`):

```env
# AI Services (at least one required)
QWEN_API_KEY=your_qwen_api_key
CLAUDE_API_KEY=your_claude_api_key  # Optional fallback

# IPFS Storage
PINATA_JWT=your_pinata_jwt_token

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Smart Contracts
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_TRACKER_CONTRACT_ADDRESS=0x...
```

## 🚀 Development

### Running Locally

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

## 📝 Notes

- This project uses **Sepolia testnet** for blockchain operations
- Make sure you have testnet ETH for contract interactions
- All data is encrypted before uploading to IPFS
- The app automatically falls back to Claude API if Qwen API fails
- First transaction automatically triggers NFT minting (if contract is deployed)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License
