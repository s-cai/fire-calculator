/**
 * Example Scenarios
 * 
 * Pre-built financial plans demonstrating different use cases.
 */

import { FinancialPlan } from './components';
import { constant, linear, ratio, composite } from './timeseries';

export interface ExampleScenario {
  id: string;
  name: string;
  description: string;
  plan: FinancialPlan;
}

/**
 * High-earning professional with aggressive savings.
 * Single income, steady career growth.
 */
export const highSaverProfessional: ExampleScenario = {
  id: 'high-saver',
  name: 'High Saver Professional',
  description: 'Software engineer with 3% annual raises, high savings rate',
  plan: {
    baseYear: 2025,
    components: [
      {
        name: 'Salary',
        category: 'income',
        series: ratio(150000, 0.03), // $150k with 3% raises
      },
      {
        name: 'Living Expenses',
        category: 'spending',
        series: constant(48000), // $4k/month
      },
      {
        name: 'Discretionary',
        category: 'spending',
        series: constant(12000), // $1k/month
      },
      {
        name: '401k + Match',
        category: 'investment',
        series: constant(23000), // Max 401k
      },
      {
        name: 'Brokerage',
        category: 'investment',
        series: constant(30000), // Additional savings
      },
    ],
  },
};

/**
 * Dual income household with two careers.
 */
export const dualIncomeHousehold: ExampleScenario = {
  id: 'dual-income',
  name: 'Dual Income Household',
  description: 'Two professionals, combined income with different growth rates',
  plan: {
    baseYear: 2025,
    components: [
      {
        name: 'Primary Salary',
        category: 'income',
        series: ratio(120000, 0.03), // $120k with 3% raises
      },
      {
        name: 'Spouse Salary',
        category: 'income',
        series: ratio(85000, 0.025), // $85k with 2.5% raises
      },
      {
        name: 'Housing',
        category: 'spending',
        series: constant(36000), // $3k/month
      },
      {
        name: 'Other Expenses',
        category: 'spending',
        series: constant(48000), // $4k/month
      },
      {
        name: 'Childcare',
        category: 'spending',
        series: composite([
          { series: constant(24000), startYear: 2025, endYear: 2030 }, // 5 years of childcare
        ]),
      },
      {
        name: '401k (Both)',
        category: 'investment',
        series: constant(40000), // Combined 401k contributions
      },
    ],
  },
};

/**
 * Mid-career professional planning a career change.
 */
export const careerChange: ExampleScenario = {
  id: 'career-change',
  name: 'Career Change',
  description: 'Professional taking a pay cut to switch careers at 40',
  plan: {
    baseYear: 2025,
    components: [
      {
        name: 'Salary',
        category: 'income',
        series: composite([
          // Current career: $130k with 2% raises for 5 years
          { series: ratio(130000, 0.02), startYear: 2025, endYear: 2030 },
          // Gap year (minimal income)
          { series: constant(20000), startYear: 2030, endYear: 2031 },
          // New career: $80k starting, 5% growth potential
          { series: ratio(80000, 0.05), startYear: 2031, endYear: 2050 },
        ]),
      },
      {
        name: 'Living Expenses',
        category: 'spending',
        series: constant(54000), // $4.5k/month
      },
      {
        name: 'Career Transition Costs',
        category: 'spending',
        series: composite([
          { series: constant(15000), startYear: 2030, endYear: 2031 }, // Training, certification
        ]),
      },
      {
        name: 'Retirement Savings',
        category: 'investment',
        series: composite([
          { series: constant(25000), startYear: 2025, endYear: 2030 }, // Aggressive before change
          { series: constant(0), startYear: 2030, endYear: 2031 }, // Gap year
          { series: constant(10000), startYear: 2031, endYear: 2050 }, // Reduced after
        ]),
      },
    ],
  },
};

/**
 * Variable income with unpredictable expenses.
 */
export const variableIncome: ExampleScenario = {
  id: 'variable-income',
  name: 'Variable Income',
  description: 'Freelancer with variable income and major planned expenses',
  plan: {
    baseYear: 2025,
    components: [
      {
        name: 'Freelance Income',
        category: 'income',
        series: linear(75000, 5000), // Starting at $75k, adding $5k/year from growth
      },
      {
        name: 'Base Expenses',
        category: 'spending',
        series: constant(42000), // $3.5k/month baseline
      },
      {
        name: 'Home Purchase',
        category: 'spending',
        series: composite([
          { series: constant(50000), startYear: 2027, endYear: 2028 }, // Down payment
        ]),
      },
      {
        name: 'College Fund (Child)',
        category: 'spending',
        series: composite([
          { series: constant(30000), startYear: 2035, endYear: 2039 }, // 4 years of tuition
        ]),
      },
      {
        name: 'SEP IRA',
        category: 'investment',
        series: linear(15000, 1000), // Growing contributions
      },
    ],
  },
};

/**
 * All available example scenarios.
 */
export const allExamples: ExampleScenario[] = [
  highSaverProfessional,
  dualIncomeHousehold,
  careerChange,
  variableIncome,
];

/**
 * Get an example by ID.
 */
export function getExample(id: string): ExampleScenario | undefined {
  return allExamples.find(ex => ex.id === id);
}

