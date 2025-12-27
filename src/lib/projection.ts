/**
 * Projection Engine
 * 
 * Simulates net worth over time and detects FIRE milestone.
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
  fireNumber: number; // spending * 25
  fireProgress: number; // percentage toward FIRE number (0-100+)
  isFIRE: boolean; // true if netWorth >= fireNumber
}

/**
 * Project net worth over time and detect FIRE milestone.
 * 
 * Each year the simulation:
 * 1. Calculates income, spending, and investment contributions
 * 2. Applies investment returns to existing net worth + new contributions
 * 3. Adds remaining cash flow (income - spending - investment contributions)
 * 4. Checks if FIRE threshold is reached (net worth >= 25x annual spending)
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
    
    // FIRE number = 25x annual spending (4% rule)
    const fireNumber = spending * 25;
    
    // Calculate progress (can exceed 100%)
    const fireProgress = fireNumber > 0 ? (netWorth / fireNumber) * 100 : 
                         netWorth > 0 ? Infinity : 0;
    
    results.push({
      year,
      income,
      spending,
      investment,
      netWorth,
      fireNumber,
      fireProgress,
      isFIRE: netWorth >= fireNumber && fireNumber > 0,
    });
  }
  
  return results;
}

/**
 * Find the first year when FIRE is achieved.
 * 
 * @param projections - Array of yearly projections
 * @returns The year FIRE is achieved, or null if never achieved
 */
export function findFIREYear(projections: YearlyProjection[]): number | null {
  const fireYear = projections.find(p => p.isFIRE);
  return fireYear ? fireYear.year : null;
}

/**
 * Calculate years until FIRE from a given starting year.
 * 
 * @param projections - Array of yearly projections
 * @param fromYear - The year to count from
 * @returns Number of years until FIRE, or null if never achieved
 */
export function yearsToFIRE(projections: YearlyProjection[], fromYear: number): number | null {
  const fireYear = findFIREYear(projections);
  if (fireYear === null) return null;
  return fireYear - fromYear;
}

