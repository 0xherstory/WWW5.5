import { Transaction } from '@/lib/constants'

const TRANSACTIONS_KEY = 'transactions'
const CID_LIST_KEY = 'cidList'

export interface StoredTransaction extends Transaction {
  cid?: string
  encrypted?: boolean
}

// Save transactions to localStorage
export function saveTransactions(transactions: StoredTransaction[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions))
    
    // Also maintain a separate CID list for IPFS references
    const cids = transactions.filter(t => t.cid).map(t => t.cid!)
    localStorage.setItem(CID_LIST_KEY, JSON.stringify(cids))
  } catch (error) {
    console.error('Failed to save transactions:', error)
  }
}

// Load transactions from localStorage
export function loadTransactions(): StoredTransaction[] {
  if (typeof window === 'undefined') return []
  
  try {
    const saved = localStorage.getItem(TRANSACTIONS_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Failed to load transactions:', error)
  }
  return []
}

// Add a single transaction
export function addTransaction(transaction: StoredTransaction): StoredTransaction[] {
  const transactions = loadTransactions()
  const updated = [...transactions, transaction]
  saveTransactions(updated)
  return updated
}

// Delete a transaction by ID
export function deleteTransaction(id: string): StoredTransaction[] {
  const transactions = loadTransactions()
  const updated = transactions.filter(t => t.id !== id)
  saveTransactions(updated)
  return updated
}

// Get CID list
export function getCIDList(): string[] {
  if (typeof window === 'undefined') return []
  
  try {
    const saved = localStorage.getItem(CID_LIST_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Failed to load CID list:', error)
  }
  return []
}

// Clear all data
export function clearAllData(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(TRANSACTIONS_KEY)
    localStorage.removeItem(CID_LIST_KEY)
  } catch (error) {
    console.error('Failed to clear data:', error)
  }
}
