// Configuration constants
export const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
export const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

// Contract addresses (will be updated after deployment)
export const FIRST_EXPENSE_NFT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || ''
export const EXPENSE_TRACKER_ADDRESS = process.env.NEXT_PUBLIC_TRACKER_CONTRACT_ADDRESS || ''

// IPFS configuration (Pinata)
export const PINARA_JWT = process.env.PINATA_JWT || ''
export const PINARA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'

// Transaction types
export const TRANSACTION_TYPES = ['expense', 'income'] as const
export type TransactionType = typeof TRANSACTION_TYPES[number]

// Expense categories
export const EXPENSE_CATEGORIES = [
  'Rent & Bills',
  'Food',
  'Shopping',
  'Transport',
  'Entertainment',
  'Investments'
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]

// Income categories
export const INCOME_CATEGORIES = [
  'Salary',
  'Transfer',
  'Other'
] as const

export type IncomeCategory = typeof INCOME_CATEGORIES[number]

// All categories combined
export type Category = ExpenseCategory | IncomeCategory

// Base transaction interface
export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: Category
  date: string
  description: string
  cid?: string
  encrypted?: boolean
}

// Expense data structure (for backward compatibility)
export interface Expense extends Transaction {
  type: 'expense'
  category: ExpenseCategory
}

// Income data structure
export interface Income extends Transaction {
  type: 'income'
  category: IncomeCategory
}

// ExpenseTracker 合约 ABI
export const EXPENSE_TRACKER_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "cid",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "recordIndex",
        "type": "uint256"
      }
    ],
    "name": "RecordAdded",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_cid",
        "type": "string"
      }
    ],
    "name": "addRecord",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_index",
        "type": "uint256"
      }
    ],
    "name": "getRecordByIndex",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "cid",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct ExpenseTracker.Record",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "getRecordCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "getRecords",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "cid",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct ExpenseTracker.Record[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// ===== 储蓄目标 =====
export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  savedAmount: number
  color: string
  icon: string
  estimatedDate: string | null
  controlledCategories: string[]
}

// ===== 图表数据 =====
export interface SankeyNode {
  name: string
}

export interface SankeyLink {
  source: number
  target: number
  value: number
}

export interface SankeyData {
  nodes: SankeyNode[]
  links: SankeyLink[]
}

export interface TrendData {
  date: string
  amount: number
}

// FirstExpenseNFT 合约 ABI
export const FIRST_EXPENSE_NFT_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_metadataURI",
        "type": "string"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "FirstExpenseMinted",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "mintFirstExpense",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "hasMinted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tokenCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "metadataURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "tokenURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const
