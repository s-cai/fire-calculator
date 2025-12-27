/**
 * Input Form Component
 * 
 * Form for configuring financial plan parameters.
 */

import { StateManager, getIncomeSeries, getSpendingSeries, getInvestmentSeries } from './state';
import { renderTimeSeriesPreview } from './preview';
import { allExamples, ExampleScenario } from '../lib/examples';
import { totalByCategory } from '../lib/components';
import { constant, ratio, linear } from '../lib/timeseries';

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
 * Create an input group with preview.
 */
function createInputGroup(
  title: string,
  inputs: string,
  preview: string
): string {
  return `
    <div class="input-group">
      <div class="input-group-header">
        <h3>${title}</h3>
        <div class="preview-container">
          ${preview}
        </div>
      </div>
      <div class="input-group-content">
        ${inputs}
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
      
      <div class="input-groups">
        ${createInputGroup(
          'Basic Parameters',
          `
            ${createInputField('baseYear', 'Starting Year', state.baseYear, { min: 2000, max: 2100, step: 1 })}
            ${createInputField('projectionYears', 'Projection Years', state.projectionYears, { min: 1, max: 50, step: 1, suffix: 'years' })}
            ${createInputField('initialNetWorth', 'Initial Net Worth', state.initialNetWorth, { type: 'currency', step: 1000 })}
            ${createInputField('investmentReturnRate', 'Investment Return', state.investmentReturnRate, { type: 'percent', min: -10, max: 30, step: 0.1 })}
          `,
          '' // No preview for basic parameters
        )}
        
        ${createInputGroup(
          'Income',
          `
            ${createInputField('annualIncome', 'Annual Income', state.annualIncome, { type: 'currency', step: 1000 })}
            ${createInputField('incomeGrowthRate', 'Annual Growth', state.incomeGrowthRate, { type: 'percent', min: -10, max: 20, step: 0.1 })}
          `,
          renderTimeSeriesPreview(getIncomeSeries(state), state.baseYear, Math.min(state.projectionYears, 15))
        )}
        
        ${createInputGroup(
          'Spending',
          `
            ${createInputField('annualSpending', 'Annual Spending', state.annualSpending, { type: 'currency', step: 1000 })}
          `,
          renderTimeSeriesPreview(getSpendingSeries(state), state.baseYear, Math.min(state.projectionYears, 15))
        )}
        
        ${createInputGroup(
          'Investment',
          `
            ${createInputField('annualInvestment', 'Annual Contributions', state.annualInvestment, { type: 'currency', step: 1000 })}
          `,
          renderTimeSeriesPreview(getInvestmentSeries(state), state.baseYear, Math.min(state.projectionYears, 15))
        )}
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Wire up event listeners
  setupInputListeners(container, stateManager);
  setupExampleListeners(container, stateManager);
}

/**
 * Setup input change listeners.
 */
function setupInputListeners(container: HTMLElement, stateManager: StateManager): void {
  const inputMappings: Array<{ id: string; key: keyof ReturnType<StateManager['get']>; isPercent?: boolean }> = [
    { id: 'baseYear', key: 'baseYear' },
    { id: 'projectionYears', key: 'projectionYears' },
    { id: 'initialNetWorth', key: 'initialNetWorth' },
    { id: 'investmentReturnRate', key: 'investmentReturnRate', isPercent: true },
    { id: 'annualIncome', key: 'annualIncome' },
    { id: 'incomeGrowthRate', key: 'incomeGrowthRate', isPercent: true },
    { id: 'annualSpending', key: 'annualSpending' },
    { id: 'annualInvestment', key: 'annualInvestment' },
  ];
  
  inputMappings.forEach(({ id, key, isPercent }) => {
    const input = container.querySelector<HTMLInputElement>(`#${id}`);
    if (input) {
      input.addEventListener('input', () => {
        let value = parseFloat(input.value) || 0;
        if (isPercent) {
          value = value / 100; // Convert from percentage to decimal
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
  
  // Extract values from the example plan
  // Find the first income component
  const incomeComponent = plan.components.find(c => c.category === 'income');
  let annualIncome = 0;
  let incomeGrowthRate = 0;
  
  if (incomeComponent) {
    const series = incomeComponent.series;
    if (series.type === 'constant') {
      annualIncome = series.value;
    } else if (series.type === 'ratio') {
      annualIncome = series.startValue;
      incomeGrowthRate = series.yearlyGrowthRate;
    } else if (series.type === 'linear') {
      annualIncome = series.startValue;
    }
  }
  
  // Sum all income at base year
  annualIncome = totalByCategory(plan, 'income', plan.baseYear);
  
  // Sum all spending at base year
  const annualSpending = totalByCategory(plan, 'spending', plan.baseYear);
  
  // Sum all investment at base year
  const annualInvestment = totalByCategory(plan, 'investment', plan.baseYear);
  
  stateManager.set({
    baseYear: plan.baseYear,
    annualIncome,
    incomeGrowthRate,
    annualSpending,
    annualInvestment,
  });
}

