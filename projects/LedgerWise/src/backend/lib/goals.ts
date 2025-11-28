// Goal-related types and interfaces

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  savedAmount: number
  createdAt: string
  completedAt?: string
  isActive: boolean
  controlledCategories: ControlledCategory[]
  emoji?: string // Optional emoji for visual appeal
}

export interface ControlledCategory {
  category: string
  monthlyLimit: number
  currentMonthSpending: number
}

export interface GoalProgress {
  percentage: number
  amountRemaining: number
  milestone: number // 0, 25, 50, 75, or 100
  nextMilestone: number // Next milestone to celebrate
}

// Calculate goal progress
export function calculateGoalProgress(goal: SavingsGoal): GoalProgress {
  const percentage = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100)
  const amountRemaining = Math.max(goal.targetAmount - goal.savedAmount, 0)
  
  // Determine current milestone
  let milestone = 0
  if (percentage >= 100) milestone = 100
  else if (percentage >= 75) milestone = 75
  else if (percentage >= 50) milestone = 50
  else if (percentage >= 25) milestone = 25
  
  // Determine next milestone
  let nextMilestone = 25
  if (milestone >= 100) nextMilestone = 100
  else if (milestone >= 75) nextMilestone = 100
  else if (milestone >= 50) nextMilestone = 75
  else if (milestone >= 25) nextMilestone = 50
  
  return {
    percentage,
    amountRemaining,
    milestone,
    nextMilestone
  }
}

// Check if a category is controlled by any active goal
export function isCategoryControlled(
  category: string,
  goals: SavingsGoal[]
): { isControlled: boolean; goal?: SavingsGoal; limit?: number } {
  for (const goal of goals.filter(g => g.isActive)) {
    const controlled = goal.controlledCategories.find(c => c.category === category)
    if (controlled) {
      return {
        isControlled: true,
        goal,
        limit: controlled.monthlyLimit
      }
    }
  }
  return { isControlled: false }
}

// Get celebration message based on milestone
export function getCelebrationMessage(milestone: number, goalName: string): string {
  const messages = {
    25: `🎉 太棒了！你离"${goalName}"又进了一步!`,
    50: `🌟 已经完成一半啦！你已经为"${goalName}"攒够了50%的钱!`,
    75: `🚀 已完成四分之三！已为"${goalName}"目标存下75%！终点就在眼前！`,
    100: `🎊 目标达成！恭喜你达成"${goalName}"目标! 🏆`
  }
  return messages[milestone as keyof typeof messages] || 'Great progress!'
}

// Get encouragement message for staying under budget
export function getEncouragementMessage(): string {
  const messages = [
    `💪 继续保持`,
    `👏 自制力真不错`,
    `🎯 一切顺利！继续加油！`,
    `🚀 你的目标越来越近了！`
  ]
  return messages[Math.floor(Math.random() * messages.length)]
}

// Goal emojis for selection
export const GOAL_EMOJIS = [
  '🎯', '✈️', '🏠', '🚗', '💍', '🎓', '💻', '📱', 
  '🎸', '🎮', '📷', '🏖️', '🎪', '🎭', '🎨', '⚡'
]
