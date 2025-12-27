/**
 * Component Editor
 * 
 * Simplified UI for editing financial components.
 * Always uses "phases" internally, hiding series type complexity from users.
 */

import { UIComponent, UISegment, getComponentSeries } from './state';
import { renderTimeSeriesPreview, formatCurrency } from './preview';

/**
 * Determine if a segment has annual increase configured.
 */
function hasAnnualIncrease(segment: UISegment): boolean {
  return segment.seriesType === 'ratio' || segment.seriesType === 'linear';
}

/**
 * Get the increase type for display ('ratio' or 'linear').
 */
function getIncreaseType(segment: UISegment): 'ratio' | 'linear' {
  return segment.seriesType === 'linear' ? 'linear' : 'ratio';
}

/**
 * Get the base amount for a segment (works for all types).
 */
function getBaseAmount(segment: UISegment): number {
  if (segment.seriesType === 'constant') {
    return segment.value;
  }
  return segment.startValue;
}

/**
 * Render a single phase editor.
 */
function renderPhaseEditor(
  segment: UISegment,
  componentId: string,
  index: number,
  totalPhases: number
): string {
  const hasIncrease = hasAnnualIncrease(segment);
  const increaseType = getIncreaseType(segment);
  const baseAmount = getBaseAmount(segment);
  const canDelete = totalPhases > 1;
  
  // Increase options (only shown when checkbox is checked)
  const increaseOptions = hasIncrease ? `
    <div class="increase-options">
      <label class="radio-option">
        <input 
          type="radio" 
          name="increase-type-${componentId}-${segment.id}"
          class="phase-input"
          data-component-id="${componentId}"
          data-segment-id="${segment.id}"
          data-field="increaseType"
          value="ratio"
          ${increaseType === 'ratio' ? 'checked' : ''}
        />
        <span class="radio-label">By percentage</span>
        <div class="radio-input ${increaseType === 'ratio' ? '' : 'disabled'}">
          <input 
            type="number" 
            class="phase-input"
            data-component-id="${componentId}"
            data-segment-id="${segment.id}"
            data-field="yearlyGrowthRate"
            data-is-percent="true"
            value="${(segment.yearlyGrowthRate * 100).toFixed(1)}"
            step="0.5"
            ${increaseType === 'ratio' ? '' : 'disabled'}
          />
          <span class="input-suffix">%</span>
        </div>
      </label>
      <label class="radio-option">
        <input 
          type="radio" 
          name="increase-type-${componentId}-${segment.id}"
          class="phase-input"
          data-component-id="${componentId}"
          data-segment-id="${segment.id}"
          data-field="increaseType"
          value="linear"
          ${increaseType === 'linear' ? 'checked' : ''}
        />
        <span class="radio-label">By fixed amount</span>
        <div class="radio-input ${increaseType === 'linear' ? '' : 'disabled'}">
          <span class="input-prefix">$</span>
          <input 
            type="number" 
            class="phase-input"
            data-component-id="${componentId}"
            data-segment-id="${segment.id}"
            data-field="yearlyIncrement"
            value="${segment.yearlyIncrement}"
            step="500"
            ${increaseType === 'linear' ? '' : 'disabled'}
          />
          <span class="input-suffix">/year</span>
        </div>
      </label>
    </div>
  ` : '';

  return `
    <div class="phase-card" data-segment-id="${segment.id}">
      <div class="phase-header">
        <div class="phase-years">
          <input 
            type="number" 
            class="phase-input year-input"
            data-component-id="${componentId}"
            data-segment-id="${segment.id}"
            data-field="startYear"
            value="${segment.startYear}"
            min="1990"
            max="2100"
          />
          <span class="year-separator">–</span>
          <input 
            type="number" 
            class="phase-input year-input"
            data-component-id="${componentId}"
            data-segment-id="${segment.id}"
            data-field="endYear"
            value="${segment.endYear}"
            min="1990"
            max="2100"
          />
        </div>
        ${canDelete ? `
          <button 
            type="button" 
            class="delete-phase-btn"
            data-component-id="${componentId}"
            data-segment-id="${segment.id}"
            title="Remove this phase"
          >×</button>
        ` : ''}
      </div>
      
      <div class="phase-amount">
        <label>Amount</label>
        <div class="input-wrapper">
          <span class="input-prefix">$</span>
          <input 
            type="number" 
            class="phase-input"
            data-component-id="${componentId}"
            data-segment-id="${segment.id}"
            data-field="baseAmount"
            value="${baseAmount}"
            step="1000"
          />
        </div>
      </div>
      
      <div class="phase-increase">
        <label class="checkbox-label">
          <input 
            type="checkbox" 
            class="phase-input increase-checkbox"
            data-component-id="${componentId}"
            data-segment-id="${segment.id}"
            data-field="hasIncrease"
            ${hasIncrease ? 'checked' : ''}
          />
          <span>Increase annually</span>
        </label>
        ${increaseOptions}
      </div>
    </div>
  `;
}

/**
 * Render the phases list.
 */
function renderPhasesList(component: UIComponent): string {
  // Ensure we have at least one phase
  const phases = component.segments.length > 0 
    ? component.segments 
    : []; // Will be handled by state initialization
  
  const phaseCards = phases.map((seg, i) => 
    renderPhaseEditor(seg, component.id, i, phases.length)
  ).join('');
  
  return `
    <div class="phases-container">
      <div class="phases-list">
        ${phaseCards}
      </div>
      <button 
        type="button" 
        class="add-phase-btn"
        data-component-id="${component.id}"
      >
        + Extend time range
      </button>
    </div>
  `;
}

/**
 * Render a complete component editor.
 */
export function renderComponentEditor(
  component: UIComponent,
  baseYear: number,
  projectionYears: number
): string {
  const series = getComponentSeries(component);
  const preview = renderTimeSeriesPreview(series, baseYear, projectionYears);
  
  return `
    <div class="component-card" data-component-id="${component.id}">
      <div class="component-header">
        <input 
          type="text" 
          class="component-name-input"
          data-component-id="${component.id}"
          data-field="name"
          value="${component.name}"
          placeholder="Component name"
        />
        <button 
          type="button" 
          class="delete-component-btn"
          data-component-id="${component.id}"
          title="Delete component"
        >×</button>
      </div>
      
      ${renderPhasesList(component)}
      
      <div class="component-preview">
        ${preview}
      </div>
    </div>
  `;
}
