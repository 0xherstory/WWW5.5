'use client'

import { Transaction } from '@/lib/constants'

interface TodayTransactionsProps {
  transactions: Transaction[]
}

export default function TodayTransactions({ transactions }: TodayTransactionsProps) {
  const today = new Date().toISOString().split('T')[0]
  
  // Filter today's transactions
  const todayTransactions = transactions.filter(t => t.date === today)
  
  // Separate by type
  const todayExpenses = todayTransactions.filter(t => t.type === 'expense')
  const todayIncomes = todayTransactions.filter(t => t.type === 'income')

  if (todayTransactions.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">今日记录</h2>
        <p className="text-gray-500 text-center py-8">今天还没有记录</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">今日记录</h2>
      
      {/* Today's Expenses */}
      {todayExpenses.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-red-600 mb-3">支出</h3>
          <div className="space-y-2">
            {todayExpenses.map((transaction) => (
              <div 
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-md"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-sm bg-red-100 px-2 py-1 rounded">
                    {transaction.category}
                  </div>
                  <div className="text-sm text-gray-700">
                    {transaction.description}
                  </div>
                </div>
                <div className="font-medium text-lg text-red-600">
                  -¥{transaction.amount}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-right text-sm text-gray-600">
            今日支出小计: <span className="font-medium text-red-600">
              ¥{todayExpenses.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Today's Incomes */}
      {todayIncomes.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-green-600 mb-3">收入</h3>
          <div className="space-y-2">
            {todayIncomes.map((transaction) => (
              <div 
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-md"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-sm bg-green-100 px-2 py-1 rounded">
                    {transaction.category}
                  </div>
                  <div className="text-sm text-gray-700">
                    {transaction.description}
                  </div>
                </div>
                <div className="font-medium text-lg text-green-600">
                  +¥{transaction.amount}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-right text-sm text-gray-600">
            今日收入小计: <span className="font-medium text-green-600">
              ¥{todayIncomes.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
