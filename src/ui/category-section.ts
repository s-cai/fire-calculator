/**
 * Category Section
 * 
 * Groups components by category with add/remove controls.
 * Uses explicit recalculate model - no reactive input handlers.
 */

import { ComponentCategory } from '../lib/components';
import { UIComponent, getComponentsByCategory, UIState, StateManager, SeriesType } from './state';
import { renderComponentEditor } from './component-editor';
import { totalByCategory } from '../lib/components';
import { formatCurrency } from './preview';

const CATEGORY_CONFIG: Record<ComponentCategory, { title: string; icon: string; addLabel: string }> = {
  income: { title: 'Income', icon: '💰', addLabel: '+ Add Income Source' },
  spending: { title: 'Spending', icon: '💸', addLabel: '+ Add Expense' },
  investment: { title: 'Investment', icon: '📈', addLabel: '+ Add Investment' },
};

/**
 * Render a category section with all its components.
 */
export function renderCategorySection(
  category: ComponentCategory,
  state: UIState
): string {
  const config = CATEGORY_CONFIG[category];
  const components = getComponentsByCategory(state, category);
  
  // Calculate total for this category at base year
  const total = totalByCategory(state.plan, category, state.baseYear);
  
  const componentCards = components.map(c => 
    renderComponentEditor(c, state.baseYear, state.projectionYears)
  ).join('');
  
  const emptyState = components.length === 0 
    ? `<p class="empty-category">No ${category} sources. Click below to add one.</p>`
    : '';
  
  return `
    <div class="category-section" data-category="${category}">
      <div class="category-header">
        <div class="category-title">
          <span class="category-icon">${config.icon}</span>
          <h3>${config.title}</h3>
        </div>
        <div class="category-total">
          ${formatCurrency(total)}<span class="per-year">/year</span>
        </div>
      </div>
      
      <div class="category-components">
        ${emptyState}
        ${componentCards}
      </div>
      
      <button 
        type="button" 
        class="add-component-btn"
        data-category="${category}"
      >
        ${config.addLabel}
      </button>
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
  
  // Series type buttons (structural change - shows different inputs)
  container.querySelectorAll<HTMLButtonElement>('.series-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const componentId = btn.dataset.componentId!;
      const seriesType = btn.dataset.seriesType as SeriesType;
      stateManager.updateComponentType(componentId, seriesType);
    });
  });
  
  // Add segment buttons (structural change)
  container.querySelectorAll<HTMLButtonElement>('.add-segment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const componentId = btn.dataset.componentId!;
      stateManager.addSegment(componentId);
    });
  });
  
  // Delete segment buttons (structural change)
  container.querySelectorAll<HTMLButtonElement>('.delete-segment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const componentId = btn.dataset.componentId!;
      const segmentId = btn.dataset.segmentId!;
      stateManager.deleteSegment(componentId, segmentId);
    });
  });
  
  // Segment type buttons (structural change - shows different inputs)
  container.querySelectorAll<HTMLButtonElement>('.segment-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const componentId = btn.dataset.componentId!;
      const segmentId = btn.dataset.segmentId!;
      const seriesType = btn.dataset.segmentType as 'constant' | 'linear' | 'ratio';
      stateManager.updateSegmentType(componentId, segmentId, seriesType);
    });
  });
  
  // All text/number inputs - mark state as stale on change (not re-render)
  container.querySelectorAll<HTMLInputElement>('.component-input, .segment-input, .component-name-input').forEach(input => {
    input.addEventListener('input', () => {
      stateManager.markStale();
    });
  });
}
