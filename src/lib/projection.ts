/**
 * Projection Engine
 * 
 * Simulates net worth over time.
 */

import { FinancialPlan, totalByCategory } from './components';

export interface ProjectionParams {
  plan: FinancialPlan;
  initialNetWorth: number;
  startYear: number;
  endYear: number; // exclusive
  investmentReturnRate: number; // e.g., 0.07 for 7%
}

export interface YearlyProjection {
  year: number;
  income: number;
  spending: number;
  investment: number; // contributions
  netWorth: number;
}

/**
 * Project net worth over time.
 * 
 * Each year the simulation:
 * 1. Calculates income, spending, and investment contributions
 * 2. Applies investment returns to existing net worth + new contributions
 * 3. Adds remaining cash flow (income - spending - investment contributions)
 * 
 * @param params - Projection parameters
 * @returns Array of yearly projections
 */
export function projectNetWorth(params: ProjectionParams): YearlyProjection[] {
  const { plan, initialNetWorth, startYear, endYear, investmentReturnRate } = params;
  const results: YearlyProjection[] = [];
  
  let netWorth = initialNetWorth;
  
  for (let year = startYear; year < endYear; year++) {
    const income = totalByCategory(plan, 'income', year);
    const spending = totalByCategory(plan, 'spending', year);
    const investment = totalByCategory(plan, 'investment', year);
    
    // Investment contributions grow with returns
    // Remaining cash flow is added after (not invested)
    const investedAmount = netWorth + investment;
    const afterReturns = investedAmount * (1 + investmentReturnRate);
    
    // Net cash flow after investment contributions
    const remainingCashFlow = income - spending - investment;
    
    // New net worth = returns on investments + remaining cash
    netWorth = afterReturns + remainingCashFlow;
    
    results.push({
      year,
      income,
      spending,
      investment,
      netWorth,
    });
  }
  
  return results;
}
