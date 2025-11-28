'use client'

import { Transaction } from '@/lib/constants'

interface ExpenseListProps {
  transactions: Transaction[]
}

export default function ExpenseList({ transactions }: ExpenseListProps) {
  const sortedTransactions = [...transactions].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  if (transactions.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">所有记账记录</h2>
        <p className="text-gray-500 text-center py-8">暂无记账记录</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">所有记账记录</h2>
        <span className="text-sm text-gray-500">共 {transactions.length} 条</span>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className={`flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 ${
              transaction.type === 'expense'
                ? 'border-red-200 bg-red-50/30'
                : 'border-green-200 bg-green-50/30'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 min-w-[80px]">
                {transaction.date}
              </div>
              <div className={`text-xs px-2 py-1 rounded font-medium ${
                transaction.type === 'expense'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {transaction.type === 'expense' ? '支出' : '收入'}
              </div>
              <div className="text-sm bg-gray-100 px-2 py-1 rounded">
                {transaction.category}
              </div>
              <div className="text-sm text-gray-700">
                {transaction.description}
              </div>
            </div>

            <div className={`font-medium text-lg ${
              transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
            }`}>
              {transaction.type === 'expense' ? '-' : '+'}¥{transaction.amount.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
