/**
 * Input Form Component
 * 
 * Form for configuring financial plan parameters.
 */

import { StateManager, convertToUIComponent } from './state';
import { allExamples, ExampleScenario } from '../lib/examples';
import { renderCategorySection, setupCategoryListeners } from './category-section';

/**
 * Create a labeled input field.
 */
function createInputField(
  id: string,
  label: string,
  value: number,
  options: {
    type?: 'number' | 'percent' | 'currency';
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
  } = {}
): string {
  const { type = 'number', min, max, step = type === 'percent' ? 0.1 : 1, suffix } = options;
  const displayValue = type === 'percent' ? (value * 100).toFixed(1) : value;
  
  return `
    <div class="input-field">
      <label for="${id}">${label}</label>
      <div class="input-wrapper">
        ${type === 'currency' ? '<span class="input-prefix">$</span>' : ''}
        <input 
          type="number" 
          id="${id}" 
          value="${displayValue}"
          ${min !== undefined ? `min="${min}"` : ''}
          ${max !== undefined ? `max="${max}"` : ''}
          step="${step}"
        />
        ${suffix ? `<span class="input-suffix">${suffix}</span>` : ''}
        ${type === 'percent' ? '<span class="input-suffix">%</span>' : ''}
      </div>
    </div>
  `;
}

/**
 * Render example buttons.
 */
function renderExampleButtons(): string {
  const buttons = allExamples.map(ex => 
    `<button class="example-btn" data-example="${ex.id}" title="${ex.description}">
      ${ex.name}
    </button>`
  ).join('');
  
  return `
    <div class="example-section">
      <h3>Load Example Scenario</h3>
      <div class="example-buttons">
        ${buttons}
      </div>
    </div>
  `;
}

/**
 * Render the basic parameters section.
 */
function renderBasicParameters(state: ReturnType<StateManager['get']>): string {
  return `
    <div class="input-group basic-params">
      <div class="input-group-header">
        <h3>Basic Parameters</h3>
      </div>
      <div class="input-group-content">
        ${createInputField('baseYear', 'Starting Year', state.baseYear, { min: 2000, max: 2100, step: 1 })}
        ${createInputField('projectionYears', 'Projection Years', state.projectionYears, { min: 1, max: 50, step: 1, suffix: 'years' })}
        ${createInputField('initialNetWorth', 'Initial Net Worth', state.initialNetWorth, { type: 'currency', step: 1000 })}
        ${createInputField('investmentReturnRate', 'Investment Return', state.investmentReturnRate, { type: 'percent', min: -10, max: 30, step: 0.1 })}
      </div>
    </div>
  `;
}

/**
 * Render the complete input form.
 */
export function renderForm(container: HTMLElement, stateManager: StateManager): void {
  const state = stateManager.get();
  
  const html = `
    <div class="form-container">
      <div class="form-header">
        <h2>Plan Configuration</h2>
      </div>
      
      ${renderExampleButtons()}
      ${renderBasicParameters(state)}
      
      <div class="categories-container">
        ${renderCategorySection('income', state)}
        ${renderCategorySection('spending', state)}
        ${renderCategorySection('investment', state)}
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Wire up event listeners
  setupBasicParamListeners(container, stateManager);
  setupExampleListeners(container, stateManager);
  setupCategoryListeners(container, stateManager);
}

/**
 * Setup basic parameter input listeners.
 */
function setupBasicParamListeners(container: HTMLElement, stateManager: StateManager): void {
  const inputMappings: Array<{ id: string; key: keyof ReturnType<StateManager['get']>; isPercent?: boolean }> = [
    { id: 'baseYear', key: 'baseYear' },
    { id: 'projectionYears', key: 'projectionYears' },
    { id: 'initialNetWorth', key: 'initialNetWorth' },
    { id: 'investmentReturnRate', key: 'investmentReturnRate', isPercent: true },
  ];
  
  inputMappings.forEach(({ id, key, isPercent }) => {
    const input = container.querySelector<HTMLInputElement>(`#${id}`);
    if (input) {
      input.addEventListener('input', () => {
        let value = parseFloat(input.value) || 0;
        if (isPercent) {
          value = value / 100;
        }
        stateManager.set({ [key]: value });
      });
    }
  });
}

/**
 * Setup example button listeners.
 */
function setupExampleListeners(container: HTMLElement, stateManager: StateManager): void {
  const buttons = container.querySelectorAll<HTMLButtonElement>('.example-btn');
  
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const exampleId = button.dataset.example;
      const example = allExamples.find(ex => ex.id === exampleId);
      
      if (example) {
        loadExample(example, stateManager);
      }
    });
  });
}

/**
 * Load an example scenario into the state.
 */
function loadExample(example: ExampleScenario, stateManager: StateManager): void {
  const plan = example.plan;
  
  // Convert all components to UI format
  const components = plan.components.map(c => convertToUIComponent(c));
  
  stateManager.set({
    baseYear: plan.baseYear,
    components,
  });
}
