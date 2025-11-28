import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, TransactionType } from '@/lib/constants'

export interface ParseResult {
  type: TransactionType
  amount: number
  category: string
  date: string
  description: string
}

export async function parseTransactionText(text: string): Promise<ParseResult | null> {
  const today = new Date().toISOString().split('T')[0]
  
  // Improved prompt with better structure and examples for both expenses and income
  const prompt = `You are a professional expense tracking assistant. Extract accounting information from user input and return it in strict JSON format.

Determine type:
- If it's an expense (spending, buying, paying, etc.): type = "expense"
- If it's income (receiving, salary, transfer in, etc.): type = "income"

Rules:
1. type: Must be "expense" or "income"
2. amount: Extract the number, must be positive
3. category:
   - For expenses, must be one of: ${EXPENSE_CATEGORIES.join(', ')}
   - For income, must be one of: ${INCOME_CATEGORIES.join(', ')}
4. date: If user mentions "today" or no date specified, use ${today}; if "yesterday", use previous date; if specific date mentioned, parse that date
5. description: Brief summary of the transaction (user's original language is fine)

Expense examples:
Input: "今天吃饭花了30块" (spent 30 on food today)
Output: {"type": "expense", "amount": 30, "category": "Food", "date": "${today}", "description": "吃饭"}

Input: "昨天打车12元" (taxi 12 yesterday)
Output: {"type": "expense", "amount": 12, "category": "Transport", "date": "${getPreviousDay(today)}", "description": "打车"}

Input: "paid rent 1200 dollars"
Output: {"type": "expense", "amount": 1200, "category": "Rent & Bills", "date": "${today}", "description": "paid rent"}

Income examples:
Input: "今天收到工资5000元" (received salary 5000 today)
Output: {"type": "income", "amount": 5000, "category": "Salary", "date": "${today}", "description": "工资"}

Input: "朋友转账500" (friend transferred 500)
Output: {"type": "income", "amount": 500, "category": "Transfer", "date": "${today}", "description": "朋友转账"}

Now process:
Input: "${text}"

Return ONLY the JSON result, no other text or explanation. If unable to parse, return {"error": "Unable to parse"}.`

  try {
    const response = await fetch('/api/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, prompt }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to parse expense text')
    }

    const result = await response.json()
    
    if (result.data?.error) {
      throw new Error(result.data.error)
    }
    
    return result.data
  } catch (error) {
    console.error('AI parsing failed:', error)
    throw error
  }
}

function getPreviousDay(dateString: string): string {
  const date = new Date(dateString)
  date.setDate(date.getDate() - 1)
  return date.toISOString().split('T')[0]
}
