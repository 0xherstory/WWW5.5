// financial_health_score.ts
// Simplified Financial Health Score Function

export type InputData = {
  income: number;
  total_expense: number;
  savings: number;
  debt_payment: number;
};

export type Scores = {
  score_savings: number;
  score_debt: number;
  score_cashflow: number;
  score_spending_pressure: number;
  score_total: number;
  grade: 'Poor' | 'Fair' | 'Good' | 'Excellent';
};

function clamp100(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function computeSavingsScore(income: number, savings: number): number {
  if (!isFinite(income) || income <= 0) return 10;
  const rate = savings / income;
  if (rate >= 0.2) return 100;
  if (rate >= 0.1) return 70;
  if (rate > 0) return 40;
  return 10;
}

export function computeDebtScore(income: number, debt_payment: number): number {
  if (!isFinite(income) || income <= 0) return 10;
  const ratio = debt_payment / income;
  if (ratio <= 0.2) return 100;
  if (ratio <= 0.35) return 70;
  if (ratio <= 0.5) return 40;
  return 10;
}

export function computeCashflowScore(income: number, total_expense: number): number {
  if (!isFinite(income) || income <= 0) return 10;
  const surplus = income - total_expense;
  const rate = surplus / income;
  if (rate >= 0.2) return 100;
  if (rate >= 0.1) return 70;
  if (rate >= 0) return 40;
  return 10;
}

export function computeSpendingPressureScore(income: number, total_expense: number): number {
  if (!isFinite(income) || income <= 0) return 10;
  const ratio = total_expense / income;
  if (ratio <= 0.7) return 100;
  if (ratio <= 0.9) return 70;
  if (ratio <= 1.0) return 40;
  return 10;
}

export function computeTotalScore(
  score_savings: number,
  score_debt: number,
  score_cashflow: number,
  score_spending_pressure: number
): number {
  const total =
    score_savings * 0.3 + score_debt * 0.3 + score_cashflow * 0.2 + score_spending_pressure * 0.2;
  return clamp100(total);
}

export function scoreToGrade(score: number): Scores['grade'] {
  if (score >= 81) return 'Excellent';
  if (score >= 61) return 'Good';
  if (score >= 41) return 'Fair';
  return 'Poor';
}

export function computeAllScores(input: InputData): Scores {
  const { income, total_expense, savings, debt_payment } = input;

  const sSavings = computeSavingsScore(income, savings);
  const sDebt = computeDebtScore(income, debt_payment);
  const sCashflow = computeCashflowScore(income, total_expense);
  const sSpending = computeSpendingPressureScore(income, total_expense);

  const total = computeTotalScore(sSavings, sDebt, sCashflow, sSpending);
  const grade = scoreToGrade(total);

  return {
    score_savings: sSavings,
    score_debt: sDebt,
    score_cashflow: sCashflow,
    score_spending_pressure: sSpending,
    score_total: total,
    grade,
  };
}
