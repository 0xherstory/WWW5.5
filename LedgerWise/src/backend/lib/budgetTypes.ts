export interface BudgetCategory {
  name: string; // 'Rent & Bills', 'Food', etc.
  budgetLimit: number;
  currentSpent: number; // Connect to real-time tracker
}

export interface BudgetGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentSaved: number;
}

export interface BudgetState {
  monthlyIncome: number;
  categories: BudgetCategory[];
  goals: BudgetGoal[];
}

