/**
 * UI State Management
 * 
 * Component-based reactive state for the FIRE calculator.
 */

import { FinancialPlan, FinancialComponent, ComponentCategory } from '../lib/components';
import { projectNetWorth, YearlyProjection } from '../lib/projection';
import { constant, ratio, linear, composite, TimeSeries } from '../lib/timeseries';

// --- UI Component Types ---

export type SeriesType = 'constant' | 'linear' | 'ratio' | 'composite';

export interface UISegment {
  id: string;
  startYear: number;
  endYear: number;
  seriesType: 'constant' | 'linear' | 'ratio';
  value: number;
  startValue: number;
  yearlyIncrement: number;
  yearlyGrowthRate: number;
}

export interface UIComponent {
  id: string;
  name: string;
  category: ComponentCategory;
  seriesType: SeriesType;
  
  // Type-specific fields
  value: number;              // constant
  startValue: number;         // linear, ratio
  yearlyIncrement: number;    // linear
  yearlyGrowthRate: number;   // ratio
  segments: UISegment[];      // composite
}

export interface UIState {
  // Core parameters
  baseYear: number;
  projectionYears: number;
  initialNetWorth: number;
  investmentReturnRate: number;
  
  // Full component list
  components: UIComponent[];
  
  // Computed
  plan: FinancialPlan;
  projection: YearlyProjection[];
}

type Listener = () => void;

export interface StateManager {
  get(): UIState;
  set(partial: Partial<UIState>): void;
  updateComponent(id: string, updates: Partial<UIComponent>): void;
  addComponent(category: ComponentCategory): void;
  deleteComponent(id: string): void;
  updateSegment(componentId: string, segmentId: string, updates: Partial<UISegment>): void;
  addSegment(componentId: string): void;
  deleteSegment(componentId: string, segmentId: string): void;
  onChange(listener: Listener): () => void;
}

// --- ID Generation ---

function generateId(): string {
  return crypto.randomUUID();
}

// --- Default Values ---

const DEFAULT_VALUES: Record<ComponentCategory, { name: string; value: number }> = {
  income: { name: 'Income', value: 80000 },
  spending: { name: 'Spending', value: 45000 },
  investment: { name: 'Investment', value: 20000 },
};

function createDefaultComponent(category: ComponentCategory, existingCount: number): UIComponent {
  const defaults = DEFAULT_VALUES[category];
  const suffix = existingCount > 0 ? ` ${existingCount + 1}` : '';
  
  return {
    id: generateId(),
    name: `${defaults.name}${suffix}`,
    category,
    seriesType: 'constant',
    value: defaults.value,
    startValue: defaults.value,
    yearlyIncrement: 0,
    yearlyGrowthRate: 0.03,
    segments: [],
  };
}

function createDefaultSegment(baseYear: number, existingSegments: UISegment[]): UISegment {
  // Find the end of the last segment, or use baseYear
  const lastEnd = existingSegments.length > 0 
    ? Math.max(...existingSegments.map(s => s.endYear))
    : baseYear;
  
  return {
    id: generateId(),
    startYear: lastEnd,
    endYear: lastEnd + 5,
    seriesType: 'constant',
    value: 50000,
    startValue: 50000,
    yearlyIncrement: 0,
    yearlyGrowthRate: 0.03,
  };
}

// --- Series Building ---

function buildSegmentSeries(segment: UISegment): TimeSeries {
  switch (segment.seriesType) {
    case 'constant':
      return constant(segment.value);
    case 'linear':
      return linear(segment.startValue, segment.yearlyIncrement);
    case 'ratio':
      return ratio(segment.startValue, segment.yearlyGrowthRate);
  }
}

function buildTimeSeries(component: UIComponent): TimeSeries {
  switch (component.seriesType) {
    case 'constant':
      return constant(component.value);
    case 'linear':
      return linear(component.startValue, component.yearlyIncrement);
    case 'ratio':
      return ratio(component.startValue, component.yearlyGrowthRate);
    case 'composite':
      if (component.segments.length === 0) {
        return constant(0);
      }
      return composite(component.segments.map(seg => ({
        startYear: seg.startYear,
        endYear: seg.endYear,
        series: buildSegmentSeries(seg),
      })));
  }
}

/**
 * Build a FinancialPlan from UI components.
 */
function buildPlan(state: UIState): FinancialPlan {
  return {
    baseYear: state.baseYear,
    components: state.components.map(c => ({
      name: c.name,
      category: c.category,
      series: buildTimeSeries(c),
    })),
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
 * Convert a FinancialComponent to a UIComponent.
 */
export function convertToUIComponent(c: FinancialComponent): UIComponent {
  const base: UIComponent = {
    id: generateId(),
    name: c.name,
    category: c.category,
    seriesType: 'constant',
    value: 0,
    startValue: 0,
    yearlyIncrement: 0,
    yearlyGrowthRate: 0,
    segments: [],
  };
  
  const series = c.series;
  switch (series.type) {
    case 'constant':
      base.seriesType = 'constant';
      base.value = series.value;
      base.startValue = series.value;
      break;
    case 'linear':
      base.seriesType = 'linear';
      base.startValue = series.startValue;
      base.yearlyIncrement = series.yearlyIncrement;
      base.value = series.startValue;
      break;
    case 'ratio':
      base.seriesType = 'ratio';
      base.startValue = series.startValue;
      base.yearlyGrowthRate = series.yearlyGrowthRate;
      base.value = series.startValue;
      break;
    case 'composite':
      base.seriesType = 'composite';
      base.segments = series.segments.map(seg => {
        const segBase: UISegment = {
          id: generateId(),
          startYear: seg.startYear,
          endYear: seg.endYear,
          seriesType: 'constant',
          value: 0,
          startValue: 0,
          yearlyIncrement: 0,
          yearlyGrowthRate: 0,
        };
        
        const s = seg.series;
        if (s.type === 'constant') {
          segBase.seriesType = 'constant';
          segBase.value = s.value;
          segBase.startValue = s.value;
        } else if (s.type === 'linear') {
          segBase.seriesType = 'linear';
          segBase.startValue = s.startValue;
          segBase.yearlyIncrement = s.yearlyIncrement;
          segBase.value = s.startValue;
        } else if (s.type === 'ratio') {
          segBase.seriesType = 'ratio';
          segBase.startValue = s.startValue;
          segBase.yearlyGrowthRate = s.yearlyGrowthRate;
          segBase.value = s.startValue;
        }
        // Note: nested composite not supported in UI
        return segBase;
      });
      break;
  }
  
  return base;
}

/**
 * Create initial default components.
 */
function createDefaultComponents(): UIComponent[] {
  return [
    {
      id: generateId(),
      name: 'Salary',
      category: 'income',
      seriesType: 'ratio',
      value: 80000,
      startValue: 80000,
      yearlyIncrement: 0,
      yearlyGrowthRate: 0.03,
      segments: [],
    },
    {
      id: generateId(),
      name: 'Living Expenses',
      category: 'spending',
      seriesType: 'constant',
      value: 45000,
      startValue: 45000,
      yearlyIncrement: 0,
      yearlyGrowthRate: 0,
      segments: [],
    },
    {
      id: generateId(),
      name: 'Retirement Savings',
      category: 'investment',
      seriesType: 'constant',
      value: 20000,
      startValue: 20000,
      yearlyIncrement: 0,
      yearlyGrowthRate: 0,
      segments: [],
    },
  ];
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
    components: createDefaultComponents(),
    plan: { baseYear: currentYear, components: [] },
    projection: [],
    ...initial,
  };
  
  // Build initial plan and projection
  state.plan = buildPlan(state);
  state.projection = runProjection(state);
  
  const listeners: Set<Listener> = new Set();
  
  function notify() {
    listeners.forEach(listener => listener());
  }
  
  function rebuild() {
    state.plan = buildPlan(state);
    state.projection = runProjection(state);
    notify();
  }
  
  return {
    get(): UIState {
      return state;
    },
    
    set(partial: Partial<UIState>): void {
      state = { ...state, ...partial };
      rebuild();
    },
    
    updateComponent(id: string, updates: Partial<UIComponent>): void {
      state.components = state.components.map(c => 
        c.id === id ? { ...c, ...updates } : c
      );
      rebuild();
    },
    
    addComponent(category: ComponentCategory): void {
      const existingCount = state.components.filter(c => c.category === category).length;
      const newComponent = createDefaultComponent(category, existingCount);
      state.components = [...state.components, newComponent];
      rebuild();
    },
    
    deleteComponent(id: string): void {
      state.components = state.components.filter(c => c.id !== id);
      rebuild();
    },
    
    updateSegment(componentId: string, segmentId: string, updates: Partial<UISegment>): void {
      state.components = state.components.map(c => {
        if (c.id !== componentId) return c;
        return {
          ...c,
          segments: c.segments.map(s => 
            s.id === segmentId ? { ...s, ...updates } : s
          ),
        };
      });
      rebuild();
    },
    
    addSegment(componentId: string): void {
      state.components = state.components.map(c => {
        if (c.id !== componentId) return c;
        const newSegment = createDefaultSegment(state.baseYear, c.segments);
        return {
          ...c,
          segments: [...c.segments, newSegment],
        };
      });
      rebuild();
    },
    
    deleteSegment(componentId: string, segmentId: string): void {
      state.components = state.components.map(c => {
        if (c.id !== componentId) return c;
        return {
          ...c,
          segments: c.segments.filter(s => s.id !== segmentId),
        };
      });
      rebuild();
    },
    
    onChange(listener: Listener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * Get a TimeSeries from a UIComponent for preview.
 */
export function getComponentSeries(component: UIComponent): TimeSeries {
  return buildTimeSeries(component);
}

/**
 * Get components by category.
 */
export function getComponentsByCategory(state: UIState, category: ComponentCategory): UIComponent[] {
  return state.components.filter(c => c.category === category);
}
