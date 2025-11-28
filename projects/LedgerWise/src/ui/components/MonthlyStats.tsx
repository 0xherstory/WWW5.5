'use client'

import { Transaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/constants'

interface MonthlyStatsProps {
  transactions: Transaction[]
}

export default function MonthlyStats({ transactions }: MonthlyStatsProps) {
  const currentDate = new Date()
  const currentMonth = currentDate.toISOString().slice(0, 7) // YYYY-MM format
  
  // Filter transactions for current month
  const monthlyTransactions = transactions.filter(t => 
    t.date.startsWith(currentMonth)
  )

  const expenses = monthlyTransactions.filter(t => t.type === 'expense')
  const incomes = monthlyTransactions.filter(t => t.type === 'income')

  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0)
  const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0)
  const netIncome = totalIncome - totalExpense
  
  // Calculate expense category totals
  const expenseCategoryTotals: Record<string, number> = {}
  expenses.forEach(t => {
    expenseCategoryTotals[t.category] = (expenseCategoryTotals[t.category] || 0) + t.amount
  })
  
  // Calculate income category totals
  const incomeCategoryTotals: Record<string, number> = {}
  incomes.forEach(t => {
    incomeCategoryTotals[t.category] = (incomeCategoryTotals[t.category] || 0) + t.amount
  })

  const expenseEntries = Object.entries(expenseCategoryTotals).sort((a, b) => b[1] - a[1])
  const incomeEntries = Object.entries(incomeCategoryTotals).sort((a, b) => b[1] - a[1])

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">本月统计</h2>
      
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-3">
          {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
        </div>
        
        {/* Net Income/Expense */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">本月净收入:</span>
            <span className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netIncome >= 0 ? '+' : ''}¥{netIncome.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Income Summary */}
        <div className="mb-4 p-4 border border-green-200 rounded-lg bg-green-50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-green-800">总收入</h3>
            <span className="text-xl font-bold text-green-600">
              +¥{totalIncome.toFixed(2)}
            </span>
          </div>
          
          {incomeEntries.length > 0 && (
            <div className="space-y-2">
              {incomeEntries.map(([category, amount]) => (
                <div key={category} className="flex justify-between text-sm">
                  <span className="text-green-700">{category}:</span>
                  <span className="font-medium text-green-600">¥{amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          
          {incomes.length === 0 && (
            <p className="text-sm text-green-700">本月暂无收入记录</p>
          )}
        </div>

        {/* Expense Summary */}
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-red-800">总支出</h3>
            <span className="text-xl font-bold text-red-600">
              -¥{totalExpense.toFixed(2)}
            </span>
          </div>
          
          {expenseEntries.length > 0 && (
            <div className="space-y-2">
              {expenseEntries.map(([category, amount]) => (
                <div key={category} className="flex justify-between text-sm">
                  <span className="text-red-700">{category}:</span>
                  <span className="font-medium text-red-600">¥{amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          
          {expenses.length === 0 && (
            <p className="text-sm text-red-700">本月暂无支出记录</p>
          )}
        </div>
      </div>
    </div>
  )
}
