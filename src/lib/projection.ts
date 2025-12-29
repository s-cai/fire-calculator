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
  endYear: number; // exclusive (for projection loop)
  investmentReturnRate: number; // e.g., 0.07 for 7%
}

export interface YearlyProjection {
  year: number;
  income: number;
  spending: number;
  investmentReturns: number;
  netWorth: number;
}

/**
 * Project net worth over time.
 * 
 * Each year the simulation:
 * 1. Calculates income and spending
 * 2. Applies investment returns to existing net worth
 * 3. Adds net cash flow (income - spending)
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
    
    // Calculate investment returns on existing net worth
    const investmentReturns = netWorth * investmentReturnRate;
    const afterReturns = netWorth + investmentReturns;
    
    // Add net cash flow
    const netCashFlow = income - spending;
    
    // New net worth = returns on investments + net cash flow
    netWorth = afterReturns + netCashFlow;
    
    results.push({
      year,
      income,
      spending,
      investmentReturns,
      netWorth,
    });
  }
  
  return results;
}
