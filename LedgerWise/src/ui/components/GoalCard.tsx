'use client'

import { SavingsGoal, calculateGoalProgress, getCelebrationMessage } from '@/lib/goals'
import { useState } from 'react'
import { GoalDetailModal } from './GoalDetailModal'

interface GoalCardProps {
  goal: SavingsGoal
  onUpdate: () => void
}

export function GoalCard({ goal, onUpdate }: GoalCardProps) {
  const [showDetail, setShowDetail] = useState(false)
  const progress = calculateGoalProgress(goal)
  
  // Get color based on progress
  const getProgressColor = () => {
    if (progress.percentage >= 100) return 'bg-green-400'
    if (progress.percentage >= 75) return 'bg-blue-400'
    if (progress.percentage >= 50) return 'bg-purple-400'
    if (progress.percentage >= 25) return 'bg-pink-400'
    return 'bg-gray-300'
  }
  
  // Get border color based on progress
  const getBorderColor = () => {
    if (progress.percentage >= 100) return 'border-green-400'
    if (progress.percentage >= 75) return 'border-blue-400'
    if (progress.percentage >= 50) return 'border-purple-400'
    if (progress.percentage >= 25) return 'border-pink-400'
    return 'border-gray-400'
  }
  
  const celebrationMsg = progress.milestone ? getCelebrationMessage(progress.milestone, goal.name) : null

  return (
    <>
      <div 
        className={`neo-card cursor-pointer hover:translate-x-1 hover:translate-y-1 transition-transform ${getBorderColor()}`}
        onClick={() => setShowDetail(true)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{goal.emoji}</span>
            <div>
              <h3 className="text-xl font-black">{goal.name}</h3>
              <p className="text-sm text-gray-600">
                ${goal.savedAmount.toFixed(2)} of ${goal.targetAmount.toFixed(2)}
              </p>
            </div>
          </div>
          
          {progress.milestone && (
            <div className="animate-bounce-slow">
              <span className="text-2xl">🎉</span>
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="relative h-8 border-4 border-black bg-white overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${Math.min(progress.percentage, 100)}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-black text-black mix-blend-difference">
                {progress.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
          
          {/* Milestone markers */}
          <div className="flex justify-between text-xs font-bold mt-1 px-1">
            <span className={progress.percentage >= 25 ? 'text-pink-600' : 'text-gray-400'}>25%</span>
            <span className={progress.percentage >= 50 ? 'text-purple-600' : 'text-gray-400'}>50%</span>
            <span className={progress.percentage >= 75 ? 'text-blue-600' : 'text-gray-400'}>75%</span>
            <span className={progress.percentage >= 100 ? 'text-green-600' : 'text-gray-400'}>100%</span>
          </div>
        </div>
        
        {/* Celebration Message */}
        {celebrationMsg && (
          <div className="p-3 border-4 border-yellow-400 bg-yellow-100 mb-3">
            <p className="text-sm font-bold text-center">{celebrationMsg}</p>
          </div>
        )}
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 border-4 border-black bg-pink-100">
            <p className="text-xs font-bold text-gray-600">Remaining</p>
            <p className="text-lg font-black">${progress.amountRemaining.toFixed(2)}</p>
          </div>
          
          <div className="p-2 border-4 border-black bg-purple-100">
            <p className="text-xs font-bold text-gray-600">Categories</p>
            <p className="text-lg font-black">{goal.controlledCategories.length}</p>
          </div>
        </div>
        
        {/* Click hint */}
        <p className="text-xs text-gray-500 text-center mt-3">
          Click for details →
        </p>
      </div>
      
      {/* Detail Modal */}
      {showDetail && (
        <GoalDetailModal 
          goal={goal}
          onClose={() => setShowDetail(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  )
}
