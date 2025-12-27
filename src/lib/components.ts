/**
 * Financial Components
 * 
 * Multi-component income/spending/investment modeling.
 */

import { TimeSeries, evaluate } from './timeseries';

export type ComponentCategory = 'income' | 'spending' | 'investment';

export interface FinancialComponent {
  name: string;
  category: ComponentCategory;
  series: TimeSeries;
}

export interface FinancialPlan {
  components: FinancialComponent[];
  baseYear: number; // The "year 0" for all series
}

export interface YearlyBreakdown {
  year: number;
  income: number;
  spending: number;
  investment: number;
  netCashFlow: number;
}

/**
 * Sum all components of a category for a given year.
 */
export function totalByCategory(
  plan: FinancialPlan,
  category: ComponentCategory,
  year: number
): number {
  return plan.components
    .filter(c => c.category === category)
    .reduce((sum, c) => sum + evaluate(c.series, year, plan.baseYear), 0);
}

/**
 * Calculate net cash flow for a given year.
 * Net cash flow = Income - Spending
 * (Investment contributions are separate from this calculation)
 */
export function netCashFlow(plan: FinancialPlan, year: number): number {
  const income = totalByCategory(plan, 'income', year);
  const spending = totalByCategory(plan, 'spending', year);
  return income - spending;
}

/**
 * Get yearly breakdown for a range of years.
 * 
 * @param plan - The financial plan
 * @param startYear - First year (inclusive)
 * @param endYear - Last year (exclusive)
 * @returns Array of yearly breakdowns
 */
export function aggregateByYear(
  plan: FinancialPlan,
  startYear: number,
  endYear: number
): YearlyBreakdown[] {
  const results: YearlyBreakdown[] = [];
  
  for (let year = startYear; year < endYear; year++) {
    const income = totalByCategory(plan, 'income', year);
    const spending = totalByCategory(plan, 'spending', year);
    const investment = totalByCategory(plan, 'investment', year);
    
    results.push({
      year,
      income,
      spending,
      investment,
      netCashFlow: income - spending,
    });
  }
  
  return results;
}

// --- Helper to create components ---

export function component(
  name: string,
  category: ComponentCategory,
  series: TimeSeries
): FinancialComponent {
  return { name, category, series };
}

export function plan(baseYear: number, components: FinancialComponent[]): FinancialPlan {
  return { baseYear, components };
}

