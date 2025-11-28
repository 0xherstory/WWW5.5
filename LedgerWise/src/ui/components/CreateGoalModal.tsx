'use client'

import { useState, useEffect } from 'react'
import { SavingsGoal, ControlledCategory, GOAL_EMOJIS } from '@/lib/goals'
import { addGoal } from '@/utils/goalStorage'
import { Transaction } from '@/lib/constants'

interface CreateGoalModalProps {
  onClose: () => void
  onCreate: () => void
  transactions: Transaction[]
}

interface CategorySuggestion {
  category: string
  currentMonthlyAverage: number
  suggestedLimit: number
}

export function CreateGoalModal({ onClose, onCreate, transactions }: CreateGoalModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [goalName, setGoalName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('🎯')
  const [controlledCategories, setControlledCategories] = useState<ControlledCategory[]>([])
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  
  // Generate AI suggestions when modal opens
  useEffect(() => {
    generateSuggestions()
  }, [])
  
  const generateSuggestions = async () => {
    if (transactions.length === 0) {
      setSuggestions([])
      return
    }
    
    setIsLoadingSuggestions(true)
    
    try {
      const response = await fetch('/api/suggest-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      } else {
        // Fallback: Calculate basic suggestions locally
        const localSuggestions = calculateLocalSuggestions()
        setSuggestions(localSuggestions)
      }
    } catch (error) {
      console.error('Failed to get AI suggestions:', error)
      // Fallback to local calculation
      const localSuggestions = calculateLocalSuggestions()
      setSuggestions(localSuggestions)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }
  
  const calculateLocalSuggestions = (): CategorySuggestion[] => {
    // Get last 30 days of expenses
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentExpenses = transactions.filter(t => 
      t.type === 'expense' && 
      new Date(t.date) > thirtyDaysAgo
    )
    
    if (recentExpenses.length === 0) return []
    
    // Calculate monthly average per category
    const categoryTotals: Record<string, number[]> = {}
    
    recentExpenses.forEach(t => {
      if (!categoryTotals[t.category]) {
        categoryTotals[t.category] = []
      }
      categoryTotals[t.category].push(t.amount)
    })
    
    // Calculate suggestions for top spending categories
    const suggestions: CategorySuggestion[] = Object.entries(categoryTotals)
      .map(([category, amounts]) => {
        const total = amounts.reduce((sum, amt) => sum + amt, 0)
        const average = total / amounts.length
        const suggested = Math.floor(total * 0.8) // Suggest 20% reduction
        
        return {
          category,
          currentMonthlyAverage: total,
          suggestedLimit: suggested
        }
      })
      .sort((a, b) => b.currentMonthlyAverage - a.currentMonthlyAverage)
      .slice(0, 5) // Top 5 categories
    
    return suggestions
  }
  
  const handleCreate = () => {
    if (!goalName.trim() || !targetAmount || parseFloat(targetAmount) <= 0) {
      alert('Please enter a valid goal name and target amount')
      return
    }
    
    const newGoal: SavingsGoal = {
      id: `goal_${Date.now()}`,
      name: goalName.trim(),
      targetAmount: parseFloat(targetAmount),
      savedAmount: 0,
      createdAt: new Date().toISOString(),
      completedAt: undefined,
      isActive: true,
      controlledCategories,
      emoji: selectedEmoji
    }
    
    addGoal(newGoal)
    onCreate()
    onClose()
  }
  
  const toggleCategory = (suggestion: CategorySuggestion) => {
    const exists = controlledCategories.find(c => c.category === suggestion.category)
    
    if (exists) {
      setControlledCategories(controlledCategories.filter(c => c.category !== suggestion.category))
    } else {
      setControlledCategories([
        ...controlledCategories,
        {
          category: suggestion.category,
          monthlyLimit: suggestion.suggestedLimit,
          currentMonthSpending: 0
        }
      ])
    }
  }
  
  const updateCategoryLimit = (category: string, limit: string) => {
    setControlledCategories(
      controlledCategories.map(c =>
        c.category === category
          ? { ...c, monthlyLimit: parseFloat(limit) || 0 }
          : c
      )
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-8 border-black w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b-8 border-black bg-gradient-to-r from-pink-200 to-purple-200">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black">设立存钱目标</h2>
            <button
              onClick={onClose}
              className="text-3xl font-black hover:scale-110 transition-transform"
            >
              ✕
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex gap-2 mt-4">
            <div className={`flex-1 h-2 border-2 border-black ${step >= 1 ? 'bg-pink-400' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-2 border-2 border-black ${step >= 2 ? 'bg-purple-400' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-2 border-2 border-black ${step >= 3 ? 'bg-blue-400' : 'bg-gray-200'}`} />
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black mb-2">目标名称 *</label>
                <input
                  type="text"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="e.g., 新电脑, 旅行"
                  className="w-full p-3 border-4 border-black font-bold text-lg"
                  maxLength={50}
                />
              </div>
              
              <div>
                <label className="block text-sm font-black mb-2">目标金额 (¥) *</label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="1000"
                  className="w-full p-3 border-4 border-black font-bold text-lg"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div>
                <label className="block text-sm font-black mb-3">选择emoji</label>
                <div className="grid grid-cols-8 gap-2">
                  {GOAL_EMOJIS.map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`p-3 text-3xl border-4 border-black hover:scale-110 transition-transform ${
                        selectedEmoji === emoji ? 'bg-yellow-300' : 'bg-white'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => setStep(2)}
                disabled={!goalName.trim() || !targetAmount || parseFloat(targetAmount) <= 0}
                className="w-full neo-btn bg-pink-400 hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一步: 预算控制 →
              </button>
            </div>
          )}
          
          {/* Step 2: AI Suggestions */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black mb-2">AI建议</h3>
                <p className="text-sm text-gray-600 mb-4">
                  根据您的消费记录，我们建议您控制以下类别的支出，以便更快达成目标哦：
                </p>
                
                {isLoadingSuggestions ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin text-4xl">⚡</div>
                    <p className="font-bold mt-2">Analyzing your spending...</p>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="p-6 border-4 border-gray-300 bg-gray-50 text-center">
                    <p className="font-bold text-gray-600">
                      目前尚无消费数据。您可以跳过此步骤，或在步骤 3 中手动添加类别
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suggestions.map((suggestion, idx) => {
                      const isSelected = controlledCategories.some(c => c.category === suggestion.category)
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => toggleCategory(suggestion)}
                          className={`w-full p-4 border-4 border-black text-left hover:translate-x-1 hover:translate-y-1 transition-transform ${
                            isSelected ? 'bg-purple-200' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-black text-lg">{suggestion.category}</p>
                              <p className="text-sm text-gray-600">
                                Current: <span className="font-bold">${suggestion.currentMonthlyAverage.toFixed(2)}/month</span>
                              </p>
                              <p className="text-sm text-gray-600">
                                Suggested limit: <span className="font-bold text-purple-600">${suggestion.suggestedLimit.toFixed(2)}/month</span>
                              </p>
                            </div>
                            
                            <div className="text-2xl">
                              {isSelected ? '✓' : '○'}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 neo-btn bg-gray-300 hover:bg-gray-400"
                >
                  ← 返回
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 neo-btn bg-purple-400 hover:bg-purple-500"
                >
                  下一步 →
                </button>
              </div>
            </div>
          )}
          
          {/* Step 3: Review & Adjust */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black mb-4">确认目标</h3>
                
                <div className="space-y-4">
                  <div className="p-4 border-4 border-black bg-pink-50">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-4xl">{selectedEmoji}</span>
                      <div>
                        <p className="text-sm font-bold text-gray-600">目标名称</p>
                        <p className="text-xl font-black">{goalName}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-600">目标金额</p>
                    <p className="text-2xl font-black text-purple-600">¥{parseFloat(targetAmount).toFixed(2)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-black mb-2">
                      限制类别 ({controlledCategories.length})
                    </p>
                    
                    {controlledCategories.length === 0 ? (
                      <div className="p-4 border-4 border-gray-300 bg-gray-50">
                        <p className="text-sm text-gray-600 text-center">
                          未选择任何类别。您仍然可以手动跟进目标。
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {controlledCategories.map((cat, idx) => (
                          <div key={idx} className="p-3 border-4 border-black bg-white">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-black">{cat.category}</span>
                              <button
                                onClick={() => setControlledCategories(controlledCategories.filter((_, i) => i !== idx))}
                                className="text-red-500 font-black hover:scale-110"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold">每月限制:</span>
                              <input
                                type="number"
                                value={cat.monthlyLimit}
                                onChange={(e) => updateCategoryLimit(cat.category, e.target.value)}
                                className="flex-1 p-2 border-2 border-black font-bold"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 neo-btn bg-gray-300 hover:bg-gray-400"
                >
                  ← 返回
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 neo-btn bg-green-400 hover:bg-green-500"
                >
                  建立目标 🎯
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
