/**
 * UI State Management
 * 
 * Explicit recalculate model - inputs don't trigger re-renders.
 * User clicks "Recalculate" to update projection results.
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
  
  // Staleness tracking
  isStale: boolean;
  
  // Computed
  plan: FinancialPlan;
  projection: YearlyProjection[];
}

type Listener = () => void;

export interface StateManager {
  get(): UIState;
  markStale(): void;
  recalculate(): void;
  
  // Structural changes (trigger immediate re-render)
  addComponent(category: ComponentCategory): void;
  deleteComponent(id: string): void;
  addSegment(componentId: string): void;
  deleteSegment(componentId: string, segmentId: string): void;
  updateComponentType(id: string, seriesType: SeriesType): void;
  updateSegmentType(componentId: string, segmentId: string, seriesType: 'constant' | 'linear' | 'ratio'): void;
  
  // Load example (trigger immediate re-render)
  loadComponents(baseYear: number, components: UIComponent[]): void;
  
  // Listeners
  onFormChange(listener: Listener): () => void;    // Structural changes only
  onResultsChange(listener: Listener): () => void; // All changes (stale, recalc, structural)
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

function createDefaultComponent(
  category: ComponentCategory, 
  existingCount: number,
  baseYear: number = 2025,
  projectionYears: number = 20
): UIComponent {
  const defaults = DEFAULT_VALUES[category];
  const suffix = existingCount > 0 ? ` ${existingCount + 1}` : '';
  
  // Always create with a single phase (composite mode)
  return {
    id: generateId(),
    name: `${defaults.name}${suffix}`,
    category,
    seriesType: 'composite',
    value: defaults.value,
    startValue: defaults.value,
    yearlyIncrement: 0,
    yearlyGrowthRate: 0.03,
    segments: [{
      id: generateId(),
      startYear: baseYear,
      endYear: baseYear + projectionYears,
      seriesType: 'constant',
      value: defaults.value,
      startValue: defaults.value,
      yearlyIncrement: 0,
      yearlyGrowthRate: 0.03,
    }],
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
 * Read all input values from DOM and update state.
 */
function readInputsFromDOM(state: UIState): Partial<UIState> {
  // Read basic parameters
  const baseYearInput = document.getElementById('baseYear') as HTMLInputElement | null;
  const projectionYearsInput = document.getElementById('projectionYears') as HTMLInputElement | null;
  const initialNetWorthInput = document.getElementById('initialNetWorth') as HTMLInputElement | null;
  const investmentReturnRateInput = document.getElementById('investmentReturnRate') as HTMLInputElement | null;
  
  const updates: Partial<UIState> = {};
  
  if (baseYearInput) {
    updates.baseYear = parseInt(baseYearInput.value) || state.baseYear;
  }
  if (projectionYearsInput) {
    updates.projectionYears = parseInt(projectionYearsInput.value) || state.projectionYears;
  }
  if (initialNetWorthInput) {
    updates.initialNetWorth = parseFloat(initialNetWorthInput.value) || 0;
  }
  if (investmentReturnRateInput) {
    updates.investmentReturnRate = (parseFloat(investmentReturnRateInput.value) || 0) / 100;
  }
  
  // Read component values
  const updatedComponents = state.components.map(component => {
    const updatedComponent = { ...component };
    
    // Component name
    const nameInput = document.querySelector(`[data-component-id="${component.id}"][data-field="name"]`) as HTMLInputElement | null;
    if (nameInput) {
      updatedComponent.name = nameInput.value || component.name;
    }
    
    // Component value fields based on series type
    const valueInput = document.querySelector(`.component-input[data-component-id="${component.id}"][data-field="value"]`) as HTMLInputElement | null;
    const startValueInput = document.querySelector(`.component-input[data-component-id="${component.id}"][data-field="startValue"]`) as HTMLInputElement | null;
    const yearlyIncrementInput = document.querySelector(`.component-input[data-component-id="${component.id}"][data-field="yearlyIncrement"]`) as HTMLInputElement | null;
    const yearlyGrowthRateInput = document.querySelector(`.component-input[data-component-id="${component.id}"][data-field="yearlyGrowthRate"]`) as HTMLInputElement | null;
    
    if (valueInput) {
      updatedComponent.value = parseFloat(valueInput.value) || 0;
    }
    if (startValueInput) {
      updatedComponent.startValue = parseFloat(startValueInput.value) || 0;
    }
    if (yearlyIncrementInput) {
      updatedComponent.yearlyIncrement = parseFloat(yearlyIncrementInput.value) || 0;
    }
    if (yearlyGrowthRateInput) {
      updatedComponent.yearlyGrowthRate = (parseFloat(yearlyGrowthRateInput.value) || 0) / 100;
    }
    
    // Read segment values for composite series
    if (component.seriesType === 'composite') {
      updatedComponent.segments = component.segments.map(segment => {
        const updatedSegment = { ...segment };
        
        const startYearInput = document.querySelector(`.segment-input[data-component-id="${component.id}"][data-segment-id="${segment.id}"][data-field="startYear"]`) as HTMLInputElement | null;
        const endYearInput = document.querySelector(`.segment-input[data-component-id="${component.id}"][data-segment-id="${segment.id}"][data-field="endYear"]`) as HTMLInputElement | null;
        const segValueInput = document.querySelector(`.segment-input[data-component-id="${component.id}"][data-segment-id="${segment.id}"][data-field="value"]`) as HTMLInputElement | null;
        const segStartValueInput = document.querySelector(`.segment-input[data-component-id="${component.id}"][data-segment-id="${segment.id}"][data-field="startValue"]`) as HTMLInputElement | null;
        const segYearlyIncrementInput = document.querySelector(`.segment-input[data-component-id="${component.id}"][data-segment-id="${segment.id}"][data-field="yearlyIncrement"]`) as HTMLInputElement | null;
        const segYearlyGrowthRateInput = document.querySelector(`.segment-input[data-component-id="${component.id}"][data-segment-id="${segment.id}"][data-field="yearlyGrowthRate"]`) as HTMLInputElement | null;
        
        if (startYearInput) {
          updatedSegment.startYear = parseInt(startYearInput.value) || segment.startYear;
        }
        if (endYearInput) {
          updatedSegment.endYear = parseInt(endYearInput.value) || segment.endYear;
        }
        if (segValueInput) {
          updatedSegment.value = parseFloat(segValueInput.value) || 0;
        }
        if (segStartValueInput) {
          updatedSegment.startValue = parseFloat(segStartValueInput.value) || 0;
        }
        if (segYearlyIncrementInput) {
          updatedSegment.yearlyIncrement = parseFloat(segYearlyIncrementInput.value) || 0;
        }
        if (segYearlyGrowthRateInput) {
          updatedSegment.yearlyGrowthRate = (parseFloat(segYearlyGrowthRateInput.value) || 0) / 100;
        }
        
        return updatedSegment;
      });
    }
    
    return updatedComponent;
  });
  
  updates.components = updatedComponents;
  
  return updates;
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
        return segBase;
      });
      break;
  }
  
  return base;
}

/**
 * Create initial default components.
 * All components use composite mode with at least one phase.
 */
function createDefaultComponents(baseYear: number = 2025, projectionYears: number = 20): UIComponent[] {
  return [
    {
      id: generateId(),
      name: 'Salary',
      category: 'income',
      seriesType: 'composite',
      value: 80000,
      startValue: 80000,
      yearlyIncrement: 0,
      yearlyGrowthRate: 0.03,
      segments: [{
        id: generateId(),
        startYear: baseYear,
        endYear: baseYear + projectionYears,
        seriesType: 'ratio',
        value: 80000,
        startValue: 80000,
        yearlyIncrement: 0,
        yearlyGrowthRate: 0.03,
      }],
    },
    {
      id: generateId(),
      name: 'Living Expenses',
      category: 'spending',
      seriesType: 'composite',
      value: 45000,
      startValue: 45000,
      yearlyIncrement: 0,
      yearlyGrowthRate: 0,
      segments: [{
        id: generateId(),
        startYear: baseYear,
        endYear: baseYear + projectionYears,
        seriesType: 'constant',
        value: 45000,
        startValue: 45000,
        yearlyIncrement: 0,
        yearlyGrowthRate: 0,
      }],
    },
    {
      id: generateId(),
      name: 'Retirement Savings',
      category: 'investment',
      seriesType: 'composite',
      value: 20000,
      startValue: 20000,
      yearlyIncrement: 0,
      yearlyGrowthRate: 0,
      segments: [{
        id: generateId(),
        startYear: baseYear,
        endYear: baseYear + projectionYears,
        seriesType: 'constant',
        value: 20000,
        startValue: 20000,
        yearlyIncrement: 0,
        yearlyGrowthRate: 0,
      }],
    },
  ];
}

/**
 * Create a state manager with explicit recalculate model.
 */
export function createState(initial?: Partial<UIState>): StateManager {
  const currentYear = new Date().getFullYear();
  const defaultProjectionYears = 20;
  
  let state: UIState = {
    baseYear: currentYear,
    projectionYears: defaultProjectionYears,
    initialNetWorth: 50000,
    investmentReturnRate: 0.07,
    components: createDefaultComponents(currentYear, defaultProjectionYears),
    isStale: false,
    plan: { baseYear: currentYear, components: [] },
    projection: [],
    ...initial,
  };
  
  // Build initial plan and projection
  state.plan = buildPlan(state);
  state.projection = runProjection(state);
  
  const formListeners: Set<Listener> = new Set();
  const resultsListeners: Set<Listener> = new Set();
  
  function notifyForm() {
    formListeners.forEach(listener => listener());
  }
  
  function notifyResults() {
    resultsListeners.forEach(listener => listener());
  }
  
  function notifyAll() {
    notifyForm();
    notifyResults();
  }
  
  function rebuild() {
    state.plan = buildPlan(state);
    state.projection = runProjection(state);
    state.isStale = false;
    notifyAll();
  }
  
  return {
    get(): UIState {
      return state;
    },
    
    markStale(): void {
      if (!state.isStale) {
        state.isStale = true;
        notifyResults(); // Only update results panel, not form
      }
    },
    
    recalculate(): void {
      // Read all values from DOM
      const updates = readInputsFromDOM(state);
      state = { ...state, ...updates };
      rebuild();
    },
    
    updateComponentType(id: string, seriesType: SeriesType): void {
      state.components = state.components.map(c => 
        c.id === id ? { ...c, seriesType } : c
      );
      // Re-render form to show new inputs, but mark stale
      state.isStale = true;
      notifyAll();
    },
    
    updateSegmentType(componentId: string, segmentId: string, seriesType: 'constant' | 'linear' | 'ratio'): void {
      state.components = state.components.map(c => {
        if (c.id !== componentId) return c;
        return {
          ...c,
          segments: c.segments.map(s => 
            s.id === segmentId ? { ...s, seriesType } : s
          ),
        };
      });
      state.isStale = true;
      notifyAll();
    },
    
    addComponent(category: ComponentCategory): void {
      const existingCount = state.components.filter(c => c.category === category).length;
      const newComponent = createDefaultComponent(category, existingCount, state.baseYear, state.projectionYears);
      state.components = [...state.components, newComponent];
      state.isStale = true;
      notifyAll();
    },
    
    deleteComponent(id: string): void {
      state.components = state.components.filter(c => c.id !== id);
      state.isStale = true;
      notifyAll();
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
      state.isStale = true;
      notifyAll();
    },
    
    deleteSegment(componentId: string, segmentId: string): void {
      state.components = state.components.map(c => {
        if (c.id !== componentId) return c;
        return {
          ...c,
          segments: c.segments.filter(s => s.id !== segmentId),
        };
      });
      state.isStale = true;
      notifyAll();
    },
    
    loadComponents(baseYear: number, components: UIComponent[]): void {
      state.baseYear = baseYear;
      state.components = components;
      rebuild(); // Immediately recalculate when loading example
    },
    
    onFormChange(listener: Listener): () => void {
      formListeners.add(listener);
      return () => formListeners.delete(listener);
    },
    
    onResultsChange(listener: Listener): () => void {
      resultsListeners.add(listener);
      return () => resultsListeners.delete(listener);
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
