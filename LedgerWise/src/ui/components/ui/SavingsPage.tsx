'use client';

import React from 'react';
import { Plus, Target, Wallet, TrendingUp, TrendingDown, X } from 'lucide-react';
import { BudgetGoal } from '@/lib/budgetTypes';
import { DotGridProgress } from './charts/DotGridProgress';
import { PREMIUM_THEMES, PremiumTheme } from '@/lib/utils';

interface SavingsPageProps {
  goals: BudgetGoal[];
  onOpenOnboarding: () => void;
  onGoalAction?: (goalId: string, amount: number, actionType: 'add' | 'withdraw') => void;
}

interface GoalActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: BudgetGoal;
  actionType: 'add' | 'withdraw';
  onConfirm: (goalId: string, amount: number) => void;
}

// Goal Action Modal Component (Add Money / Withdraw)
const GoalActionModal: React.FC<GoalActionModalProps> = ({ isOpen, onClose, goal, actionType, onConfirm }) => {
  const [amount, setAmount] = React.useState('');

  if (!isOpen) return null;

  const isAdd = actionType === 'add';
  const maxAmount = isAdd ? Infinity : goal.currentSaved;

  const handleConfirm = () => {
    const numAmount = parseFloat(amount);
    if (numAmount > 0 && (!isAdd ? numAmount <= maxAmount : true)) {
      onConfirm(goal.id, numAmount);
      setAmount('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isAdd ? 'bg-green-100' : 'bg-amber-100'
              }`}>
                {isAdd ? (
                  <TrendingUp className="w-6 h-6 text-green-600" strokeWidth={2} />
                ) : (
                  <TrendingDown className="w-6 h-6 text-amber-600" strokeWidth={2} />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {isAdd ? 'Add Money' : 'Withdraw'}
                </h3>
                <p className="text-sm text-gray-500">{goal.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500 text-lg">$</span>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-4 text-2xl font-bold bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                placeholder="0.00"
                step="0.01"
                min="0"
                max={!isAdd ? maxAmount : undefined}
              />
            </div>
          </div>

          {/* Current Balance Info */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <div className="flex justify-between text-sm">
              <span className="text-amber-900/60 font-medium">Current Saved</span>
              <span className="text-amber-900 font-bold">${goal.currentSaved.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-amber-900/60 font-medium">Target</span>
              <span className="text-amber-900 font-bold">${goal.targetAmount.toLocaleString()}</span>
            </div>
          </div>

          {!isAdd && parseFloat(amount) > maxAmount && (
            <p className="text-red-500 text-sm">
              Withdrawal amount cannot exceed current savings.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!amount || parseFloat(amount) <= 0 || (!isAdd && parseFloat(amount) > maxAmount)}
            className={`
              flex-1 px-6 py-3 rounded-xl font-bold shadow-lg transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isAdd
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20'
                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
              }
            `}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper to cycle through themes based on index
const getTheme = (index: number): PremiumTheme => {
  const themes: PremiumTheme[] = ['ruby', 'sapphire', 'gold', 'emerald'];
  return themes[index % themes.length];
};

export const SavingsPage: React.FC<SavingsPageProps> = ({ goals, onOpenOnboarding, onGoalAction }) => {
  const [modalState, setModalState] = React.useState<{
    isOpen: boolean;
    goalId: string | null;
    actionType: 'add' | 'withdraw';
  }>({ isOpen: false, goalId: null, actionType: 'add' });

  const [openDropdownId, setOpenDropdownId] = React.useState<string | null>(null);

  const handleOpenModal = (goalId: string, actionType: 'add' | 'withdraw') => {
    setModalState({ isOpen: true, goalId, actionType });
    setOpenDropdownId(null);
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, goalId: null, actionType: 'add' });
  };

  const handleConfirmAction = (goalId: string, amount: number) => {
    if (onGoalAction) {
      onGoalAction(goalId, amount, modalState.actionType);
    }
  };

  const toggleDropdown = (goalId: string) => {
    setOpenDropdownId(openDropdownId === goalId ? null : goalId);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId) {
        const target = event.target as HTMLElement;
        if (!target.closest('.wallet-dropdown-container')) {
          setOpenDropdownId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  if (goals.length === 0) {
    return (
      <div className="
        flex flex-col items-center justify-center
        py-32 px-8
        bg-white/95 backdrop-blur-sm rounded-[2.5rem]
        border border-amber-100/60
        shadow-sm hover:shadow-xl
        text-center max-w-2xl mx-auto mt-10
        transition-all duration-500
      ">
        <div className="
          w-32 h-32 rounded-full flex items-center justify-center mb-10
          bg-gradient-to-br from-amber-50 to-amber-100/50
          border-2 border-amber-100/80
          shadow-sm
          animate-pulse
        ">
          <Target className="w-16 h-16 text-amber-600" strokeWidth={1.5} />
        </div>
        <h3 className="
          text-4xl font-serif font-bold text-amber-950 mb-5
          tracking-tight
        ">
          No Savings Goals Yet
        </h3>
        <p className="
          text-amber-900/50 max-w-md mb-12
          text-lg font-light leading-relaxed tracking-wide
        ">
          Set your savings goals and start building your financial future with precision and elegance.
        </p>
        <button
          onClick={onOpenOnboarding}
          className="
            group px-12 py-5
            bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600
            hover:from-amber-500 hover:via-yellow-600 hover:to-amber-700
            text-white rounded-2xl font-semibold
            shadow-lg shadow-amber-500/30
            hover:shadow-2xl hover:shadow-amber-500/40
            hover:scale-105 active:scale-95
            transition-all duration-300
            flex items-center gap-4
            text-lg tracking-wide
          "
        >
          <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" strokeWidth={2} />
          Set Goals
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {goals.map((goal, index) => {
        const percentage = Math.min((goal.currentSaved / goal.targetAmount) * 100, 100);
        const themeKey = getTheme(index);
        const theme = PREMIUM_THEMES[themeKey];

        return (
          <div
            key={goal.id}
            className={`
              group relative
              p-10 rounded-[2rem] border
              bg-white/95 backdrop-blur-sm
              transition-all duration-500 ease-out
              hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1
              ${theme.border}
            `}
            style={{
              boxShadow: '0 1px 3px rgba(0,0,0,0.03), 0 10px 20px rgba(0,0,0,0.02)',
              overflow: 'visible'
            }}
          >
            {/* Top Section: Header & Percentage */}
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className="space-y-3">
                <h3 className={`
                  font-serif text-sm font-semibold tracking-[0.2em] uppercase
                  ${theme.subtext} transition-colors duration-300
                `}>
                  {goal.name}
                </h3>
                <div className={`
                  text-6xl font-serif font-bold tracking-tight
                  ${theme.text} transition-all duration-300
                  group-hover:scale-105
                `}>
                  {percentage.toFixed(0)}%
                </div>
              </div>

              {/* Dot Matrix Visualization */}
              <div className="pt-1">
                <DotGridProgress
                  percentage={percentage}
                  theme={themeKey}
                  columns={5}
                  rows={3}
                />
              </div>
            </div>

            {/* Bottom Section: Data & Action */}
            <div className="flex justify-between items-end relative z-10 mt-8">
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className={`
                    text-3xl font-bold font-sans tracking-tight
                    ${theme.text} transition-colors duration-300
                  `}>
                    ${goal.currentSaved.toLocaleString()}
                  </span>
                  <span className={`text-sm font-medium tracking-wide ${theme.subtext}`}>
                    saved
                  </span>
                </div>
                <div className={`
                  text-xs font-medium tracking-wider uppercase
                  ${theme.subtext} opacity-70
                `}>
                  of ${goal.targetAmount.toLocaleString()} • Goal: Dec 2025
                </div>
              </div>

              <div className="relative wallet-dropdown-container">
                <button
                  onClick={() => toggleDropdown(goal.id)}
                  className={`
                    p-5 rounded-2xl transition-all duration-300
                    ${theme.bg} hover:${theme.bg} hover:opacity-100
                    hover:scale-110 hover:rotate-3
                    active:scale-95
                    shadow-sm hover:shadow-md
                    ${openDropdownId === goal.id ? 'scale-110 rotate-3' : ''}
                  `}
                >
                  <Wallet className={`w-6 h-6 ${theme.icon}`} strokeWidth={1.5} />
                </button>

                {/* Dropdown Menu */}
                {openDropdownId === goal.id && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
                    <button
                      onClick={() => handleOpenModal(goal.id, 'add')}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-green-50 transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-100 group-hover:bg-green-200 flex items-center justify-center transition-colors">
                        <TrendingUp className="w-4 h-4 text-green-600" strokeWidth={2} />
                      </div>
                      <span className="font-medium text-gray-900">Add Money</span>
                    </button>
                    <button
                      onClick={() => handleOpenModal(goal.id, 'withdraw')}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-amber-50 transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
                        <TrendingDown className="w-4 h-4 text-amber-600" strokeWidth={2} />
                      </div>
                      <span className="font-medium text-gray-900">Withdraw</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Background Effects Container - Clipped */}
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
              {/* Subtle Background Gradient Effects */}
              <div className={`
                absolute -top-24 -right-24 w-72 h-72 rounded-full
                blur-3xl opacity-[0.08]
                transition-opacity duration-700
                group-hover:opacity-[0.15]
                ${theme.bg}
              `} />
              <div className={`
                absolute -bottom-16 -left-16 w-56 h-56 rounded-full
                blur-3xl opacity-[0.05]
                transition-opacity duration-700
                group-hover:opacity-[0.1]
                ${theme.bg}
              `} />

              {/* Premium border glow effect on hover */}
              <div className={`
                absolute inset-0 rounded-[2rem] opacity-0
                transition-opacity duration-500
                group-hover:opacity-100
                ${theme.glow} blur-sm
              `} style={{ boxShadow: `inset 0 0 20px var(--glow-color, rgba(0,0,0,0.05))` }} />
            </div>
          </div>
        );
      })}
      
      {/* Add Goal Card - Minimalist & Elegant */}
      <button
        onClick={onOpenOnboarding}
        className="
          group flex flex-col items-center justify-center
          p-10 rounded-[2rem]
          border-2 border-dashed border-stone-200/60
          hover:border-amber-400/60 hover:bg-gradient-to-br hover:from-amber-50/40 hover:to-yellow-50/30
          transition-all duration-500 ease-out
          min-h-[280px]
          hover:shadow-lg hover:shadow-amber-100/50
          hover:scale-[1.01]
          active:scale-95
        "
      >
        <div className="
          w-20 h-20 rounded-full flex items-center justify-center mb-6
          bg-gradient-to-br from-stone-50 to-stone-100/50
          group-hover:from-amber-50 group-hover:to-amber-100/80
          transition-all duration-500
          shadow-sm group-hover:shadow-md group-hover:shadow-amber-200/30
          border border-stone-100 group-hover:border-amber-200/80
          group-hover:scale-110 group-hover:rotate-6
        ">
          <Plus className="
            w-10 h-10
            text-stone-400 group-hover:text-amber-700
            transition-all duration-500
            group-hover:rotate-90
          " strokeWidth={2} />
        </div>
        <span className="
          font-serif text-lg font-medium tracking-[0.15em] uppercase
          text-stone-400 group-hover:text-amber-900
          transition-colors duration-500
        ">
          Add New Goal
        </span>
      </button>

      {/* Goal Action Modal */}
      {modalState.isOpen && modalState.goalId && (
        <GoalActionModal
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          goal={goals.find(g => g.id === modalState.goalId)!}
          actionType={modalState.actionType}
          onConfirm={handleConfirmAction}
        />
      )}
    </div>
  );
};
