import { SavingsGoal } from '@/lib/goals'

const GOALS_STORAGE_KEY = 'savings_goals'
const GOALS_HISTORY_KEY = 'savings_goals_history'

// Load all active goals
export function loadGoals(): SavingsGoal[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(GOALS_STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error('Failed to load goals:', error)
    return []
  }
}

// Save goals to localStorage
export function saveGoals(goals: SavingsGoal[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals))
  } catch (error) {
    console.error('Failed to save goals:', error)
  }
}

// Add a new goal
export function addGoal(goal: SavingsGoal): SavingsGoal[] {
  const goals = loadGoals()
  goals.push(goal)
  saveGoals(goals)
  return goals
}

// Update a goal
export function updateGoal(goalId: string, updates: Partial<SavingsGoal>): SavingsGoal[] {
  const goals = loadGoals()
  const index = goals.findIndex(g => g.id === goalId)
  
  if (index !== -1) {
    goals[index] = { ...goals[index], ...updates }
    saveGoals(goals)
  }
  
  return goals
}

// Delete a goal
export function deleteGoal(goalId: string): SavingsGoal[] {
  const goals = loadGoals()
  const filtered = goals.filter(g => g.id !== goalId)
  saveGoals(filtered)
  return filtered
}

// Complete a goal and move to history
export function completeGoal(goalId: string): SavingsGoal[] {
  const goals = loadGoals()
  const goal = goals.find(g => g.id === goalId)
  
  if (goal) {
    // Mark as completed
    goal.isActive = false
    goal.completedAt = new Date().toISOString()
    
    // Add to history
    const history = loadGoalsHistory()
    history.push(goal)
    saveGoalsHistory(history)
    
    // Remove from active goals
    const filtered = goals.filter(g => g.id !== goalId)
    saveGoals(filtered)
    
    return filtered
  }
  
  return goals
}

// Update saved amount for a goal
export function updateGoalSavings(goalId: string, amount: number): SavingsGoal[] {
  const goals = loadGoals()
  const goal = goals.find(g => g.id === goalId)
  
  if (goal) {
    goal.savedAmount += amount
    saveGoals(goals)
  }
  
  return goals
}

// Update category spending for current month
export function updateCategorySpending(
  goalId: string, 
  category: string, 
  amount: number
): SavingsGoal[] {
  const goals = loadGoals()
  const goal = goals.find(g => g.id === goalId)
  
  if (goal) {
    const controlled = goal.controlledCategories.find(c => c.category === category)
    if (controlled) {
      controlled.currentMonthSpending += amount
      saveGoals(goals)
    }
  }
  
  return goals
}

// Reset monthly spending for all categories (call at start of new month)
export function resetMonthlySpending(): void {
  const goals = loadGoals()
  
  goals.forEach(goal => {
    goal.controlledCategories.forEach(cat => {
      cat.currentMonthSpending = 0
    })
  })
  
  saveGoals(goals)
}

// Get goals history
export function loadGoalsHistory(): SavingsGoal[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(GOALS_HISTORY_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error('Failed to load goals history:', error)
    return []
  }
}

// Save goals history
function saveGoalsHistory(history: SavingsGoal[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(GOALS_HISTORY_KEY, JSON.stringify(history))
  } catch (error) {
    console.error('Failed to save goals history:', error)
  }
}

// Check if it's a new month and reset spending if needed
export function checkAndResetMonthlySpending(): void {
  if (typeof window === 'undefined') return
  
  const lastResetKey = 'last_monthly_reset'
  const lastReset = localStorage.getItem(lastResetKey)
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${now.getMonth()}`
  
  if (lastReset !== currentMonth) {
    resetMonthlySpending()
    localStorage.setItem(lastResetKey, currentMonth)
  }
}
