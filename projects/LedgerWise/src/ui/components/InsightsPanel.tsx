'use client'

import { Transaction } from '@/lib/constants'
import { useState, useEffect } from 'react'

interface InsightsPanelProps {
  transactions: Transaction[]
}

interface Insights {
  tip: string
  encouragement: string
}

export default function InsightsPanel({ transactions }: InsightsPanelProps) {
  const [insights, setInsights] = useState<Insights | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [yesterdayStats, setYesterdayStats] = useState({ income: 0, expense: 0 })

  // Calculate yesterday's stats
  useEffect(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const yesterdayTransactions = transactions.filter(t => t.date === yesterdayStr)

    const income = yesterdayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const expense = yesterdayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    setYesterdayStats({ income, expense })
  }, [transactions])

  // Fetch insights when component mounts or transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      fetchInsights()
    }
  }, [transactions])

  const fetchInsights = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactions }),
      })

      if (response.ok) {
        const data = await response.json()
        setInsights(data)
      } else {
        console.error('Failed to fetch insights')
        // Set fallback insights
        setInsights({
          tip: '继续保持良好的记账习惯',
          encouragement: '每一笔记录都是进步！'
        })
      }
    } catch (error) {
      console.error('Error fetching insights:', error)
      setInsights({
        tip: '继续保持良好的记账习惯',
        encouragement: '每一笔记录都是进步！'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">💡 回顾&建议</h2>

      {/* Yesterday's Review */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-gray-700">
          <span className="text-lg">📊</span>
          <span className="font-medium">昨日回顾:</span>
          <span className="text-green-600">收入 ¥{yesterdayStats.income.toFixed(2)}</span>
          <span className="text-gray-400">|</span>
          <span className="text-red-600">支出 ¥{yesterdayStats.expense.toFixed(2)}</span>
        </div>
      </div>

      {/* AI Insights */}
      <div className="space-y-3">
        {/* Section Header with Disclaimer */}
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">理财建议</h3>
          <span className="text-xs text-orange-600 flex items-center gap-1">
            <span>⚠️</span>
            <span>本建议由AI生成，仅供参考</span>
          </span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-sm text-gray-600">生成建议中...</p>
          </div>
        )}

        {/* Insights Content */}
        {!isLoading && insights && (
          <>
            {/* Optimization Tip */}
            <div className="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-xl flex-shrink-0">💡</span>
              <p className="text-sm text-gray-800 leading-relaxed">{insights.tip}</p>
            </div>

            {/* Encouragement */}
            <div className="flex gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
              <span className="text-xl flex-shrink-0">🎉</span>
              <p className="text-sm text-gray-800 leading-relaxed">{insights.encouragement}</p>
            </div>
          </>
        )}

        {/* No Data State */}
        {!isLoading && !insights && transactions.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            暂无数据，开始记账后即可获得理财建议
          </div>
        )}
      </div>
    </div>
  )
}
