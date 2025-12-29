/**
 * Category Section
 * 
 * Two-tier UI:
 * 1. Simple mode (default): Just amount + growth rate
 * 2. Customized mode: Full component editor with segments
 */

import { ComponentCategory } from '../lib/components';
import { UIComponent, getComponentsByCategory, UIState, StateManager } from './state';
import { renderComponentEditor } from './component-editor';
import { totalByCategory } from '../lib/components';
import { formatCurrency, renderTimeSeriesPreview } from './preview';
import { constant, linear, ratio, composite, TimeSeries } from '../lib/timeseries';

const CATEGORY_CONFIG: Record<ComponentCategory, { title: string; icon: string; addLabel: string }> = {
  income: { title: 'After-tax income', icon: '💰', addLabel: '+ New Income Source' },
  spending: { title: 'Spending', icon: '💸', addLabel: '+ New Expense' },
};

/**
 * Get the aggregate amount for simple mode (sum of first segment values).
 */
function getSimpleAmount(state: UIState, category: ComponentCategory): number {
  const components = getComponentsByCategory(state, category);
  return components.reduce((sum, c) => {
    if (c.segments.length > 0) {
      return sum + (c.segments[0].value || c.segments[0].startValue || 0);
    }
    return sum + (c.value || c.startValue || 0);
  }, 0);
}

/**
 * Get the aggregate growth rate for simple mode (average of first segment rates).
 */
function getSimpleGrowthRate(state: UIState, category: ComponentCategory): number {
  const components = getComponentsByCategory(state, category);
  if (components.length === 0) return 0.03;
  
  let totalRate = 0;
  let count = 0;
  
  components.forEach(c => {
    if (c.segments.length > 0) {
      const seg = c.segments[0];
      if (seg.seriesType === 'ratio') {
        totalRate += seg.yearlyGrowthRate;
        count++;
      } else if (seg.seriesType === 'constant') {
        // Constant means 0% growth
        count++;
      }
    }
  });
  
  return count > 0 ? totalRate / count : 0.03;
}

/**
 * Render simple mode: just amount + growth rate.
 */
function renderSimpleView(
  category: ComponentCategory,
  state: UIState
): string {
  const amount = getSimpleAmount(state, category);
  const growthRate = getSimpleGrowthRate(state, category);
  
  return `
    <div class="simple-inputs">
      <div class="simple-input-group">
        <label>Amount</label>
        <div class="input-wrapper">
          <span class="input-prefix">$</span>
          <input 
            type="number" 
            class="simple-input"
            data-category="${category}"
            data-field="amount"
            value="${amount}"
            step="1000"
          />
          <span class="input-suffix">/year</span>
        </div>
      </div>
      <div class="simple-input-group">
        <label>Annual Growth</label>
        <div class="input-wrapper">
          <input 
            type="number" 
            class="simple-input"
            data-category="${category}"
            data-field="growthRate"
            value="${(growthRate * 100).toFixed(1)}"
            step="0.1"
          />
          <span class="input-suffix">%</span>
        </div>
      </div>
    </div>
    <button 
      type="button" 
      class="customize-btn"
      data-category="${category}"
    >
      Customize...
    </button>
  `;
}

/**
 * Render customized mode: full component editors.
 */
function renderCustomizedView(
  category: ComponentCategory,
  state: UIState
): string {
  const config = CATEGORY_CONFIG[category];
  const components = getComponentsByCategory(state, category);
  
  const componentCards = components.map(c => 
    renderComponentEditor(c, state.baseYear, state.projectionYears)
  ).join('');
  
  const emptyState = components.length === 0 
    ? `<p class="empty-category">No ${category} sources. Click below to add one.</p>`
    : '';
  
  return `
    <div class="category-components">
      ${emptyState}
      ${componentCards}
    </div>
    <div class="customize-actions">
      <button 
        type="button" 
        class="add-component-btn"
        data-category="${category}"
      >
        ${config.addLabel}
      </button>
      <button 
        type="button" 
        class="simplify-btn"
        data-category="${category}"
      >
        ← Back to simple
      </button>
    </div>
  `;
}

/**
 * Render a category section with simple or customized view.
 */
export function renderCategorySection(
  category: ComponentCategory,
  state: UIState,
  stateManager: StateManager
): string {
  const config = CATEGORY_CONFIG[category];
  const isCustomized = stateManager.isCustomized(category);
  
  // Calculate total for this category at base year
  const total = totalByCategory(state.plan, category, state.baseYear);
  
  const content = isCustomized 
    ? renderCustomizedView(category, state)
    : renderSimpleView(category, state);
  
  return `
    <div class="category-section ${isCustomized ? 'is-customized' : ''}" data-category="${category}">
      <div class="category-header">
        <div class="category-title">
          <span class="category-icon">${config.icon}</span>
          <h3>${config.title}</h3>
        </div>
        <div class="category-total">
          ${formatCurrency(total)}<span class="per-year">/year</span>
        </div>
      </div>
      
      ${content}
    </div>
  `;
}

/**
 * Setup event listeners for a category section.
 * Only structural changes trigger re-renders. Value inputs mark state as stale.
 */
export function setupCategoryListeners(
  container: HTMLElement,
  stateManager: StateManager
): void {
  // Add component buttons (structural change)
  container.querySelectorAll<HTMLButtonElement>('.add-component-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category as ComponentCategory;
      stateManager.addComponent(category);
    });
  });
  
  // Delete component buttons (structural change)
  container.querySelectorAll<HTMLButtonElement>('.delete-component-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const componentId = btn.dataset.componentId!;
      stateManager.deleteComponent(componentId);
    });
  });
  
  // Add phase buttons (structural change)
  container.querySelectorAll<HTMLButtonElement>('.add-phase-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const componentId = btn.dataset.componentId!;
      
      // Read the current end year from the DOM (user may have edited it)
      const componentCard = container.querySelector(`.component-card[data-component-id="${componentId}"]`);
      if (componentCard) {
        const phaseCards = componentCard.querySelectorAll('.phase-card');
        if (phaseCards.length > 0) {
          const lastPhase = phaseCards[phaseCards.length - 1];
          const endYearInput = lastPhase.querySelector<HTMLInputElement>('[data-field="endYear"]');
          if (endYearInput) {
            const currentEndYear = parseInt(endYearInput.value) || 0;
            const segmentId = lastPhase.getAttribute('data-segment-id');
            if (segmentId && currentEndYear > 0) {
              // Update the state with the current DOM value before adding new segment
              stateManager.updateSegmentEndYear(componentId, segmentId, currentEndYear);
            }
          }
        }
      }
      
      stateManager.addSegment(componentId);
    });
  });
  
  // Delete phase buttons (structural change)
  container.querySelectorAll<HTMLButtonElement>('.delete-phase-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const componentId = btn.dataset.componentId!;
      const segmentId = btn.dataset.segmentId!;
      stateManager.deleteSegment(componentId, segmentId);
    });
  });
  
  // Increase checkbox - toggle between constant and ratio (structural change)
  container.querySelectorAll<HTMLInputElement>('.increase-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const componentId = checkbox.dataset.componentId!;
      const segmentId = checkbox.dataset.segmentId!;
      const newType = checkbox.checked ? 'ratio' : 'constant';
      stateManager.updateSegmentType(componentId, segmentId, newType);
    });
  });
  
  // Increase type radio buttons - switch between ratio and linear (structural change)
  container.querySelectorAll<HTMLInputElement>('.phase-input[data-field="increaseType"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const componentId = radio.dataset.componentId!;
      const segmentId = radio.dataset.segmentId!;
      const newType = radio.value as 'ratio' | 'linear';
      stateManager.updateSegmentType(componentId, segmentId, newType);
    });
  });
  
  // All value inputs - mark state as stale and update preview
  container.querySelectorAll<HTMLInputElement>('.phase-input:not(.increase-checkbox):not([data-field="increaseType"]), .component-name-input').forEach(input => {
    input.addEventListener('input', () => {
      stateManager.markStale();
      
      // Update preview in real-time
      const componentId = input.dataset.componentId;
      if (componentId) {
        updateComponentPreview(container, componentId, stateManager);
      }
    });
  });
  
  // Customize buttons - switch to customized mode
  container.querySelectorAll<HTMLButtonElement>('.customize-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category as ComponentCategory;
      stateManager.toggleCustomized(category);
    });
  });
  
  // Simplify buttons - switch back to simple mode
  container.querySelectorAll<HTMLButtonElement>('.simplify-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category as ComponentCategory;
      stateManager.toggleCustomized(category);
    });
  });
  
  // Simple mode inputs - mark stale when changed
  container.querySelectorAll<HTMLInputElement>('.simple-input').forEach(input => {
    input.addEventListener('input', () => {
      stateManager.markStale();
    });
  });
}

/**
 * Update the preview chart for a component based on current DOM values.
 */
function updateComponentPreview(
  container: HTMLElement,
  componentId: string,
  stateManager: StateManager
): void {
  const state = stateManager.get();
  const component = state.components.find(c => c.id === componentId);
  if (!component) return;
  
  const card = container.querySelector(`.component-card[data-component-id="${componentId}"]`);
  if (!card) return;
  
  const previewContainer = card.querySelector('.component-preview');
  if (!previewContainer) return;
  
  // Read current values from DOM and build series
  const series = buildSeriesFromDOM(card, component, state.baseYear, state.projectionYears);
  const preview = renderTimeSeriesPreview(series, state.baseYear, state.projectionYears);
  
  previewContainer.innerHTML = preview;
}

/**
 * Build a TimeSeries from current DOM input values.
 */
function buildSeriesFromDOM(
  card: Element, 
  component: UIComponent,
  baseYear: number,
  projectionYears: number
): TimeSeries {
  const phaseCards = card.querySelectorAll('.phase-card');
  
  if (phaseCards.length === 0) {
    return constant(0);
  }
  
  const segments: Array<{ series: TimeSeries; startYear: number; endYear: number }> = [];
  
  phaseCards.forEach((phaseCard) => {
    const segmentId = phaseCard.getAttribute('data-segment-id');
    const segment = component.segments.find(s => s.id === segmentId);
    if (!segment) return;
    
    // Read values from this phase card
    const startYear = parseInt(phaseCard.querySelector<HTMLInputElement>('[data-field="startYear"]')?.value || '0') || baseYear;
    const endYear = parseInt(phaseCard.querySelector<HTMLInputElement>('[data-field="endYear"]')?.value || '0') || baseYear + projectionYears;
    const baseAmount = parseFloat(phaseCard.querySelector<HTMLInputElement>('[data-field="baseAmount"]')?.value || '0') || 0;
    const hasIncrease = (phaseCard.querySelector<HTMLInputElement>('.increase-checkbox') as HTMLInputElement)?.checked || false;
    
    let series: TimeSeries;
    
    if (!hasIncrease) {
      series = constant(baseAmount);
    } else {
      // Check which radio is selected
      const ratioRadio = phaseCard.querySelector<HTMLInputElement>('[data-field="increaseType"][value="ratio"]');
      const isRatio = ratioRadio?.checked ?? true;
      
      if (isRatio) {
        const growthRate = parseFloat(phaseCard.querySelector<HTMLInputElement>('[data-field="yearlyGrowthRate"]')?.value || '0') / 100 || 0;
        series = ratio(baseAmount, growthRate);
      } else {
        const increment = parseFloat(phaseCard.querySelector<HTMLInputElement>('[data-field="yearlyIncrement"]')?.value || '0') || 0;
        series = linear(baseAmount, increment);
      }
    }
    
    segments.push({ series, startYear, endYear });
  });
  
  if (segments.length === 1) {
    return segments[0].series;
  }
  
  return composite(segments);
}
