'use client'

import React, { useState, useEffect } from 'react'
import { X, Shield, TrendingUp, Loader2 } from 'lucide-react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { StoredTransaction } from '@/utils/storage'
import { computeAllScores, InputData, Scores } from '@/utils/financial_health_score'

interface FinancialHealthModalProps {
  isOpen: boolean
  onClose: () => void
  transactions: StoredTransaction[]
}

const FinancialHealthModal: React.FC<FinancialHealthModalProps> = ({
  isOpen,
  onClose,
  transactions
}) => {
  const [scores, setScores] = useState<Scores | null>(null)
  const [aiInsights, setAiInsights] = useState<string>('')
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [financialData, setFinancialData] = useState<InputData | null>(null)

  const hasTransactions = transactions.length > 0

  // Calculate scores when modal opens
  useEffect(() => {
    if (isOpen && hasTransactions) {
      calculateScores()
    }
  }, [isOpen, transactions])

  // Fetch AI insights after scores are calculated
  useEffect(() => {
    if (scores && financialData) {
      fetchAIInsights()
    }
  }, [scores])

  const calculateScores = () => {
    const now = new Date()
    const thisMonth = transactions.filter(t => {
      const txDate = new Date(t.date)
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear()
    })

    const income = thisMonth
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const total_expense = thisMonth
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const savings = Math.max(0, income - total_expense)
    const debt_payment = 0 // Could be enhanced

    const inputData: InputData = { income, total_expense, savings, debt_payment }
    setFinancialData(inputData)

    const calculatedScores = computeAllScores(inputData)
    setScores(calculatedScores)
  }

  const fetchAIInsights = async () => {
    if (!scores || !financialData) return

    setIsLoadingAI(true)
    try {
      const response = await fetch('/api/financial-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          financial_data: {
            ...financialData,
            ...scores
          }
        })
      })

      const data = await response.json()
      if (data.success) {
        setAiInsights(data.response)
      } else {
        setAiInsights('Unable to generate insights at this time.')
      }
    } catch (error) {
      console.error('Failed to fetch AI insights:', error)
      setAiInsights('Unable to generate insights at this time.')
    } finally {
      setIsLoadingAI(false)
    }
  }

  if (!isOpen) return null

  // Grade color mapping
  const gradeColors: Record<string, string> = {
    'Excellent': 'bg-emerald-500 text-white',
    'Good': 'bg-blue-500 text-white',
    'Fair': 'bg-amber-500 text-white',
    'Poor': 'bg-red-500 text-white'
  }

  // Radar chart data
  const radarData = scores ? [
    { dimension: 'Savings', value: scores.score_savings, fullMark: 100 },
    { dimension: 'Debt', value: scores.score_debt, fullMark: 100 },
    { dimension: 'Cash Flow', value: scores.score_cashflow, fullMark: 100 },
    { dimension: 'Spending', value: scores.score_spending_pressure, fullMark: 100 },
  ] : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-xl font-serif font-bold text-gray-900">Financial Health Score</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {!hasTransactions ? (
            /* No Records State */
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">No Records Yet</h3>
              <p className="text-gray-500 mb-6">
                You haven't recorded any transactions yet.<br />
                Start tracking to see your financial health!
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
              >
                Start Recording
              </button>
            </div>
          ) : (
            /* Score Display */
            <>
              {/* Score and Radar Chart Row */}
              <div className="flex flex-col md:flex-row gap-8 mb-8">
                {/* Left: Total Score */}
                <div className="flex-shrink-0 md:w-2/5 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl">
                  {/* Circular Score Display */}
                  <div className="relative w-40 h-40 mb-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="#E5E7EB"
                        strokeWidth="8"
                        fill="none"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="#D4AF37"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${(scores?.score_total || 0) * 2.64} 264`}
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-serif font-bold text-gray-900">
                        {scores?.score_total || 0}
                      </span>
                      <span className="text-sm text-gray-500">/ 100</span>
                    </div>
                  </div>

                  {/* Grade Badge */}
                  <div className={`px-4 py-1.5 rounded-full text-sm font-medium ${gradeColors[scores?.grade || 'Fair']}`}>
                    {scores?.grade || 'Calculating...'}
                  </div>

                  {/* Score Breakdown */}
                  <div className="mt-4 w-full space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Savings (30%)</span>
                      <span className="font-medium">{scores?.score_savings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Debt (30%)</span>
                      <span className="font-medium">{scores?.score_debt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cash Flow (20%)</span>
                      <span className="font-medium">{scores?.score_cashflow}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Spending (20%)</span>
                      <span className="font-medium">{scores?.score_spending_pressure}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Radar Chart */}
                <div className="flex-1 md:w-3/5 bg-gray-50 rounded-2xl p-4">
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#E5E7EB" />
                      <PolarAngleAxis
                        dataKey="dimension"
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                      />
                      <Radar
                        name="Score"
                        dataKey="value"
                        stroke="#D4AF37"
                        fill="#D4AF37"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Insights Section */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">✨</span>
                  </div>
                  <h3 className="font-serif font-bold text-gray-900">AI Insights & Recommendations</h3>
                </div>

                {isLoadingAI ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                    <span className="ml-2 text-gray-500">Generating insights...</span>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                    {aiInsights}
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-4 text-center">
                  ⚠️ AI-generated advice is for reference only. Not financial advice.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default FinancialHealthModal
