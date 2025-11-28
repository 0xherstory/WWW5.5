'use client';

import React, { useState } from 'react';
import { X, Plus, Trash, ArrowRight, Check, Coins } from 'lucide-react';
import { BudgetCategory, BudgetGoal } from '@/lib/budgetTypes';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (income: number, categories: BudgetCategory[], goals: BudgetGoal[]) => void;
  existingGoals?: BudgetGoal[]; // Pass existing goals to add to them
  mode?: 'setup' | 'add-goals'; // 'setup' for first time, 'add-goals' for adding more
}

const FIXED_CATEGORIES = [
  'Rent & Bills',
  'Food',
  'Shopping',
  'Transport',
  'Entertainment',
  'Investments'
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  existingGoals = [],
  mode = 'setup'
}) => {
  const [step, setStep] = useState(mode === 'add-goals' ? 2 : 1);
  const [categoryLimits, setCategoryLimits] = useState<Record<string, string>>({});
  const [goals, setGoals] = useState<Omit<BudgetGoal, 'currentSaved'>[]>([
    { id: Date.now().toString(), name: '', targetAmount: 0 }
  ]);

  if (!isOpen) return null;

  const handleCategoryLimitChange = (category: string, value: string) => {
    setCategoryLimits(prev => ({ ...prev, [category]: value }));
  };

  const handleGoalChange = (id: string, field: 'name' | 'targetAmount', value: string | number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const addGoal = () => {
    if (goals.length < 4) {
      setGoals(prev => [...prev, { id: Date.now().toString(), name: '', targetAmount: 0 }]);
    }
  };

  const removeGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleNext = () => {
    if (step === 1) {
      // Move to goals step
      setStep(2);
    } else {
      // Complete
      const finalCategories: BudgetCategory[] = FIXED_CATEGORIES.map(name => ({
        name,
        budgetLimit: parseFloat(categoryLimits[name] || '0'),
        currentSpent: 0 // Initialize with 0, will be updated by real data later
      }));

      // Filter new goals that are valid
      const newGoals: BudgetGoal[] = goals
        .filter(g => g.name && g.targetAmount > 0)
        .map(g => ({ ...g, currentSaved: 0 }));

      // If in 'add-goals' mode, merge with existing goals
      const allGoals = mode === 'add-goals'
        ? [...existingGoals, ...newGoals]
        : newGoals;

      // Pass 0 for income since it's now calculated dynamically
      onComplete(0, finalCategories, allGoals);

      // Reset form
      setGoals([{ id: Date.now().toString(), name: '', targetAmount: 0 }]);
      setStep(mode === 'add-goals' ? 2 : 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {step === 1 ? "Set Up Your Budget" : "Set Your Saving Goals"}
              </h2>
              <p className="text-gray-500 mt-2">
                {step === 1
                  ? "Define spending limits for each category."
                  : "What are you saving for? Add up to 4 goals."}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Category Budget Limits (Optional)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FIXED_CATEGORIES.map(category => (
                    <div key={category} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <span className="block text-sm text-gray-600 mb-2">{category}</span>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-400">$</span>
                        </div>
                        <input
                          type="number"
                          value={categoryLimits[category] || ''}
                          onChange={(e) => handleCategoryLimitChange(category, e.target.value)}
                          className="w-full pl-8 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-amber-500 outline-none"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal, index) => (
                <div key={goal.id} className="flex gap-4 items-start animate-in slide-in-from-bottom-2 fade-in duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex-1 space-y-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Goal Name</label>
                      <input
                        type="text"
                        value={goal.name}
                        onChange={(e) => handleGoalChange(goal.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm focus:border-amber-500 outline-none"
                        placeholder="e.g., New Laptop, Vacation"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Target Amount</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-400 text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          value={goal.targetAmount || ''}
                          onChange={(e) => handleGoalChange(goal.id, 'targetAmount', parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-3 py-2 bg-white border border-amber-200 rounded-lg text-sm focus:border-amber-500 outline-none"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                  {goals.length > 1 && (
                    <button
                      onClick={() => removeGoal(goal.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-2"
                    >
                      <Trash className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              
              {goals.length < 4 && (
                <button
                  onClick={addGoal}
                  className="w-full py-4 border-2 border-dashed border-amber-200 rounded-xl text-amber-600 hover:bg-amber-50 hover:border-amber-300 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Another Goal (Optional)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100 flex justify-end gap-4">
          {step === 2 && mode === 'setup' && (
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
          >
            {step === 1 ? (
              <>Next Step <ArrowRight className="w-4 h-4" /></>
            ) : mode === 'add-goals' ? (
              <>Add Goals <Check className="w-4 h-4" /></>
            ) : (
              <>Complete Setup <Check className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

