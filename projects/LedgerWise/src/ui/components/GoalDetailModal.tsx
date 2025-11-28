'use client'

import { SavingsGoal, calculateGoalProgress, getEncouragementMessage } from '@/lib/goals'
import { updateGoal, completeGoal, deleteGoal } from '@/utils/goalStorage'
import { useState } from 'react'

interface GoalDetailModalProps {
  goal: SavingsGoal
  onClose: () => void
  onUpdate: () => void
}

export function GoalDetailModal({ goal, onClose, onUpdate }: GoalDetailModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const progress = calculateGoalProgress(goal)
  
  const handleComplete = () => {
    completeGoal(goal.id)
    onUpdate()
    onClose()
  }
  
  const handleDelete = () => {
    deleteGoal(goal.id)
    onUpdate()
    onClose()
  }
  
  // Check if any category is over budget
  const hasOverBudget = goal.controlledCategories.some(
    cat => cat.currentMonthSpending > cat.monthlyLimit
  )
  
  const hasBudgetWarning = goal.controlledCategories.some(
    cat => cat.currentMonthSpending > cat.monthlyLimit * 0.8
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-8 border-black w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b-8 border-black bg-gradient-to-r from-pink-200 to-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-6xl">{goal.emoji}</span>
              <div>
                <h2 className="text-3xl font-black">{goal.name}</h2>
                <p className="text-lg font-bold text-gray-700">
                  ${goal.savedAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-3xl font-black hover:scale-110 transition-transform"
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Progress Section */}
          <div>
            <h3 className="text-xl font-black mb-3">PROGRESS</h3>
            <div className="relative h-12 border-4 border-black bg-white overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all duration-500"
                style={{ width: `${Math.min(progress.percentage, 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-black text-black mix-blend-difference">
                  {progress.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
            
            {progress.nextMilestone && (
              <p className="text-sm text-gray-600">
                Next milestone: <span className="font-bold">{progress.nextMilestone}%</span>
                {' '}(${((goal.targetAmount * progress.nextMilestone / 100) - goal.savedAmount).toFixed(2)} to go)
              </p>
            )}
          </div>
          
          {/* Controlled Categories */}
          <div>
            <h3 className="text-xl font-black mb-3">BUDGET CONTROL</h3>
            
            {goal.controlledCategories.length === 0 ? (
              <p className="text-gray-600">No categories being controlled</p>
            ) : (
              <div className="space-y-3">
                {goal.controlledCategories.map((cat, idx) => {
                  const percentUsed = (cat.currentMonthSpending / cat.monthlyLimit) * 100
                  const isOver = percentUsed > 100
                  const isWarning = percentUsed > 80
                  
                  return (
                    <div 
                      key={idx}
                      className={`p-4 border-4 ${
                        isOver ? 'border-red-500 bg-red-50' : 
                        isWarning ? 'border-yellow-500 bg-yellow-50' : 
                        'border-green-500 bg-green-50'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-black text-lg">{cat.category}</span>
                        <span className="font-bold">
                          ${cat.currentMonthSpending.toFixed(2)} / ${cat.monthlyLimit.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="relative h-6 border-2 border-black bg-white overflow-hidden">
                        <div 
                          className={`h-full ${
                            isOver ? 'bg-red-400' : 
                            isWarning ? 'bg-yellow-400' : 
                            'bg-green-400'
                          }`}
                          style={{ width: `${Math.min(percentUsed, 100)}%` }}
                        />
                      </div>
                      
                      {isOver && (
                        <p className="text-sm text-red-600 font-bold mt-1">
                          ⚠️ Over budget by ${(cat.currentMonthSpending - cat.monthlyLimit).toFixed(2)}
                        </p>
                      )}
                      
                      {!isOver && isWarning && (
                        <p className="text-sm text-yellow-700 font-bold mt-1">
                          ⚡ {(100 - percentUsed).toFixed(0)}% remaining
                        </p>
                      )}
                      
                      {!isOver && !isWarning && (
                        <p className="text-sm text-green-700 font-bold mt-1">
                          ✓ ${(cat.monthlyLimit - cat.currentMonthSpending).toFixed(2)} remaining
                        </p>
                      )}
                    </div>
                  )
                })}
                
                {!hasOverBudget && (
                  <div className="p-4 border-4 border-green-400 bg-green-100">
                    <p className="font-bold text-center">
                      {getEncouragementMessage()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Stats Grid */}
          <div>
            <h3 className="text-xl font-black mb-3">STATS</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border-4 border-black bg-pink-100">
                <p className="text-sm font-bold text-gray-600">Created</p>
                <p className="text-lg font-black">
                  {new Date(goal.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div className="p-4 border-4 border-black bg-purple-100">
                <p className="text-sm font-bold text-gray-600">Remaining</p>
                <p className="text-lg font-black">
                  ${progress.amountRemaining.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="space-y-3 pt-4 border-t-4 border-black">
            {progress.percentage >= 100 && (
              <button
                onClick={handleComplete}
                className="w-full neo-btn bg-green-400 hover:bg-green-500"
              >
                🎉 MARK AS COMPLETE
              </button>
            )}
            
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full neo-btn bg-red-400 hover:bg-red-500"
              >
                DELETE GOAL
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-center font-bold text-red-600">
                  Are you sure? This cannot be undone.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDelete}
                    className="neo-btn bg-red-500 hover:bg-red-600 text-white"
                  >
                    YES, DELETE
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="neo-btn bg-gray-300 hover:bg-gray-400"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
