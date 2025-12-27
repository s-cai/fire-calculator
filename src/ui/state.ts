/**
 * UI State Management
 * 
 * Simple pub/sub reactive state for the FIRE calculator.
 */

import { FinancialPlan, FinancialComponent } from '../lib/components';
import { projectNetWorth, YearlyProjection } from '../lib/projection';
import { constant, ratio, TimeSeries } from '../lib/timeseries';

export interface UIState {
  // Core plan parameters
  baseYear: number;
  projectionYears: number;
  initialNetWorth: number;
  investmentReturnRate: number;
  
  // Simplified inputs for MVP (single values, not full time series)
  annualIncome: number;
  incomeGrowthRate: number;
  annualSpending: number;
  annualInvestment: number;
  
  // Computed
  plan: FinancialPlan;
  projection: YearlyProjection[];
}

type Listener = () => void;

export interface StateManager {
  get(): UIState;
  set(partial: Partial<UIState>): void;
  onChange(listener: Listener): () => void;
}

/**
 * Build a FinancialPlan from simplified UI inputs.
 */
function buildPlan(state: Pick<UIState, 'baseYear' | 'annualIncome' | 'incomeGrowthRate' | 'annualSpending' | 'annualInvestment'>): FinancialPlan {
  const components: FinancialComponent[] = [
    {
      name: 'Income',
      category: 'income',
      series: state.incomeGrowthRate > 0 
        ? ratio(state.annualIncome, state.incomeGrowthRate)
        : constant(state.annualIncome),
    },
    {
      name: 'Spending',
      category: 'spending',
      series: constant(state.annualSpending),
    },
    {
      name: 'Investment',
      category: 'investment',
      series: constant(state.annualInvestment),
    },
  ];
  
  return {
    baseYear: state.baseYear,
    components,
  };
}

/**
 * Run projection based on current state.
 */
function runProjection(state: UIState): YearlyProjection[] {
  return projectNetWorth({
    plan: state.plan,
    initialNetWorth: state.initialNetWorth,
    startYear: state.baseYear,
    endYear: state.baseYear + state.projectionYears,
    investmentReturnRate: state.investmentReturnRate,
  });
}

/**
 * Create a reactive state manager.
 */
export function createState(initial?: Partial<UIState>): StateManager {
  const currentYear = new Date().getFullYear();
  
  // Default values
  let state: UIState = {
    baseYear: currentYear,
    projectionYears: 20,
    initialNetWorth: 50000,
    investmentReturnRate: 0.07,
    annualIncome: 80000,
    incomeGrowthRate: 0.03,
    annualSpending: 45000,
    annualInvestment: 20000,
    plan: { baseYear: currentYear, components: [] },
    projection: [],
    ...initial,
  };
  
  // Build initial plan and projection
  state.plan = buildPlan(state);
  state.projection = runProjection(state);
  
  const listeners: Set<Listener> = new Set();
  
  return {
    get(): UIState {
      return state;
    },
    
    set(partial: Partial<UIState>): void {
      const inputFields = ['baseYear', 'projectionYears', 'initialNetWorth', 'investmentReturnRate', 'annualIncome', 'incomeGrowthRate', 'annualSpending', 'annualInvestment'];
      const needsRebuild = inputFields.some(key => key in partial);
      
      state = { ...state, ...partial };
      
      if (needsRebuild) {
        state.plan = buildPlan(state);
        state.projection = runProjection(state);
      }
      
      // Notify all listeners
      listeners.forEach(listener => listener());
    },
    
    onChange(listener: Listener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * Get the income series from the state for preview.
 */
export function getIncomeSeries(state: UIState): TimeSeries {
  return state.incomeGrowthRate > 0 
    ? ratio(state.annualIncome, state.incomeGrowthRate)
    : constant(state.annualIncome);
}

/**
 * Get the spending series from the state for preview.
 */
export function getSpendingSeries(state: UIState): TimeSeries {
  return constant(state.annualSpending);
}

/**
 * Get the investment series from the state for preview.
 */
export function getInvestmentSeries(state: UIState): TimeSeries {
  return constant(state.annualInvestment);
}

