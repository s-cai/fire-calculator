/**
 * Category Section
 * 
 * Groups components by category with add/remove controls.
 */

import { ComponentCategory } from '../lib/components';
import { UIComponent, getComponentsByCategory, UIState, StateManager } from './state';
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
 */
export function setupCategoryListeners(
  container: HTMLElement,
  stateManager: StateManager
): void {
  // Add component buttons
  container.querySelectorAll<HTMLButtonElement>('.add-component-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category as ComponentCategory;
      stateManager.addComponent(category);
    });
  });
  
  // Delete component buttons
  container.querySelectorAll<HTMLButtonElement>('.delete-component-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const componentId = btn.dataset.componentId!;
      stateManager.deleteComponent(componentId);
    });
  });
  
  // Component name inputs
  container.querySelectorAll<HTMLInputElement>('.component-name-input').forEach(input => {
    input.addEventListener('input', () => {
      const componentId = input.dataset.componentId!;
      stateManager.updateComponent(componentId, { name: input.value });
    });
  });
  
  // Series type buttons
  container.querySelectorAll<HTMLButtonElement>('.series-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const componentId = btn.dataset.componentId!;
      const seriesType = btn.dataset.seriesType as UIComponent['seriesType'];
      stateManager.updateComponent(componentId, { seriesType });
    });
  });
  
  // Component inputs (value, startValue, etc.)
  container.querySelectorAll<HTMLInputElement>('.component-input').forEach(input => {
    input.addEventListener('input', () => {
      const componentId = input.dataset.componentId!;
      const field = input.dataset.field as keyof UIComponent;
      const isPercent = input.dataset.isPercent === 'true';
      let value = parseFloat(input.value) || 0;
      if (isPercent) {
        value = value / 100;
      }
      stateManager.updateComponent(componentId, { [field]: value });
    });
  });
  
  // Add segment buttons
  container.querySelectorAll<HTMLButtonElement>('.add-segment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const componentId = btn.dataset.componentId!;
      stateManager.addSegment(componentId);
    });
  });
  
  // Delete segment buttons
  container.querySelectorAll<HTMLButtonElement>('.delete-segment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const componentId = btn.dataset.componentId!;
      const segmentId = btn.dataset.segmentId!;
      stateManager.deleteSegment(componentId, segmentId);
    });
  });
  
  // Segment type buttons
  container.querySelectorAll<HTMLButtonElement>('.segment-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const componentId = btn.dataset.componentId!;
      const segmentId = btn.dataset.segmentId!;
      const seriesType = btn.dataset.segmentType as 'constant' | 'linear' | 'ratio';
      stateManager.updateSegment(componentId, segmentId, { seriesType });
    });
  });
  
  // Segment inputs
  container.querySelectorAll<HTMLInputElement>('.segment-input').forEach(input => {
    input.addEventListener('input', () => {
      const componentId = input.dataset.componentId!;
      const segmentId = input.dataset.segmentId!;
      const field = input.dataset.field!;
      const isPercent = input.dataset.isPercent === 'true';
      let value = parseFloat(input.value) || 0;
      if (isPercent) {
        value = value / 100;
      }
      stateManager.updateSegment(componentId, segmentId, { [field]: value });
    });
  });
}

