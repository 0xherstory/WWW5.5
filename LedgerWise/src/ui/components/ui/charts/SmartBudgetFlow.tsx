'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Wallet, Loader2, AlertTriangle } from 'lucide-react';
import { BudgetCategory } from '@/lib/budgetTypes';
import { Transaction } from '@/lib/constants';

interface SmartBudgetFlowProps {
  transactions: Transaction[];
  categories: BudgetCategory[];
}

export const SmartBudgetFlow: React.FC<SmartBudgetFlowProps> = ({
  transactions,
  categories,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const incomeRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [paths, setPaths] = useState<string[]>([]);

  // Calculate current month's income
  const currentMonthIncome = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return transactions
      .filter(t => t.type === 'income' && t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Calculate current month spending per category
  const getCurrentMonthSpending = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const spending: Record<string, number> = {};

    transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
      .forEach(t => {
        spending[t.category] = (spending[t.category] || 0) + t.amount;
      });

    return spending;
  }, [transactions]);

  // Update categories with current month spending
  const categoriesWithCurrentSpending = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      currentSpent: getCurrentMonthSpending[cat.name] || 0
    }));
  }, [categories, getCurrentMonthSpending]);

  // Update paths on resize or data change
  useEffect(() => {
    const updatePaths = () => {
      if (!containerRef.current || !incomeRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const incomeRect = incomeRef.current.getBoundingClientRect();

      const startX = incomeRect.right - containerRect.left;
      const startY = incomeRect.top + incomeRect.height / 2 - containerRect.top;

      const newPaths = categoriesWithCurrentSpending.map((_, index) => {
        const categoryEl = categoryRefs.current[index];
        if (!categoryEl) return '';

        const categoryRect = categoryEl.getBoundingClientRect();
        const endX = categoryRect.left - containerRect.left;
        const endY = categoryRect.top + categoryRect.height / 2 - containerRect.top;

        // Control points for Bezier curve
        const cp1X = startX + (endX - startX) / 2;
        const cp1Y = startY;
        const cp2X = startX + (endX - startX) / 2;
        const cp2Y = endY;

        return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
      });

      setPaths(newPaths);
    };

    updatePaths();
    window.addEventListener('resize', updatePaths);

    // Small delay to ensure DOM is ready
    const timeout = setTimeout(updatePaths, 100);

    return () => {
      window.removeEventListener('resize', updatePaths);
      clearTimeout(timeout);
    };
  }, [categoriesWithCurrentSpending]);

  return (
    <div className="relative w-full p-6 bg-amber-50/30 rounded-3xl border border-amber-100" ref={containerRef}>
      {/* SVG Layer */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="#d4b062" // Golden brown similar to accent color
            strokeWidth="3"
            strokeOpacity="0.4"
            className="transition-all duration-500 ease-in-out"
          />
        ))}
      </svg>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
        {/* Left Column: Income Pool */}
        <div className="flex items-center justify-center">
          <div
            ref={incomeRef}
            className="w-full max-w-xs bg-gradient-to-br from-amber-100 to-amber-50 p-6 rounded-2xl border border-amber-200 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-2 mb-4 text-amber-800">
              <Wallet className="w-5 h-5" />
              <span className="font-semibold">Income Pool (Dynamic)</span>
            </div>

            <div className="text-4xl font-bold text-amber-900">
              ${currentMonthIncome.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Right Column: Categories */}
        <div className="md:col-span-2 space-y-4">
          {categoriesWithCurrentSpending.map((category, index) => {
            const hasLimit = category.budgetLimit > 0;
            const percentage = hasLimit ? Math.min((category.currentSpent / category.budgetLimit) * 100, 100) : 0;
            const isWarning = percentage > 80;
            const remaining = category.budgetLimit - category.currentSpent;

            return (
              <div
                key={index}
                ref={el => { categoryRefs.current[index] = el; }}
                className={`bg-white p-4 rounded-xl border transition-all ${
                  isWarning ? 'border-red-200 shadow-red-50' : 'border-amber-100 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">{category.name}</span>
                  {!hasLimit ? (
                    <span className="text-xs text-gray-400 italic">No budget set</span>
                  ) : isWarning ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">
                      <AlertTriangle className="w-3 h-3" /> 90% Alert!
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">
                      {percentage.toFixed(0)}% Used
                    </span>
                  )}
                </div>

                {hasLimit ? (
                  <>
                    <div className="relative h-3 w-full bg-amber-50 rounded-full overflow-hidden mb-2">
                      <div
                        className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                          isWarning ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-amber-400 to-amber-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-gray-500">
                      <span>${category.currentSpent.toLocaleString()} / ${category.budgetLimit.toLocaleString()}</span>
                      <span className={remaining < 0 ? 'text-red-500 font-medium' : ''}>
                        Remaining: ${Math.abs(remaining).toLocaleString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-gray-400 italic">
                    Set up your budget to track this category
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

