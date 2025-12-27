/**
 * Component Editor
 * 
 * UI for editing a single financial component with series type selection.
 */

import { UIComponent, UISegment, SeriesType, getComponentSeries } from './state';
import { renderTimeSeriesPreview, formatCurrency } from './preview';

const SERIES_TYPE_LABELS: Record<SeriesType, string> = {
  constant: 'Fixed',
  linear: 'Linear',
  ratio: 'Growth %',
  composite: 'Segments',
};

/**
 * Render series type selector buttons.
 */
function renderSeriesTypeSelector(component: UIComponent): string {
  const types: SeriesType[] = ['constant', 'linear', 'ratio', 'composite'];
  
  const buttons = types.map(type => {
    const isActive = component.seriesType === type;
    return `
      <button 
        type="button"
        class="series-type-btn ${isActive ? 'active' : ''}"
        data-component-id="${component.id}"
        data-series-type="${type}"
      >
        ${SERIES_TYPE_LABELS[type]}
      </button>
    `;
  }).join('');
  
  return `<div class="series-type-selector">${buttons}</div>`;
}

/**
 * Render inputs for constant series.
 */
function renderConstantInputs(component: UIComponent): string {
  return `
    <div class="series-inputs">
      <div class="input-field">
        <label>Amount</label>
        <div class="input-wrapper">
          <span class="input-prefix">$</span>
          <input 
            type="number" 
            class="component-input"
            data-component-id="${component.id}"
            data-field="value"
            value="${component.value}"
            step="1000"
          />
          <span class="input-suffix">/year</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render inputs for linear series.
 */
function renderLinearInputs(component: UIComponent): string {
  return `
    <div class="series-inputs series-inputs-row">
      <div class="input-field">
        <label>Starting Amount</label>
        <div class="input-wrapper">
          <span class="input-prefix">$</span>
          <input 
            type="number" 
            class="component-input"
            data-component-id="${component.id}"
            data-field="startValue"
            value="${component.startValue}"
            step="1000"
          />
        </div>
      </div>
      <div class="input-field">
        <label>Yearly Increase</label>
        <div class="input-wrapper">
          <span class="input-prefix">+$</span>
          <input 
            type="number" 
            class="component-input"
            data-component-id="${component.id}"
            data-field="yearlyIncrement"
            value="${component.yearlyIncrement}"
            step="500"
          />
          <span class="input-suffix">/year</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render inputs for ratio series.
 */
function renderRatioInputs(component: UIComponent): string {
  return `
    <div class="series-inputs series-inputs-row">
      <div class="input-field">
        <label>Starting Amount</label>
        <div class="input-wrapper">
          <span class="input-prefix">$</span>
          <input 
            type="number" 
            class="component-input"
            data-component-id="${component.id}"
            data-field="startValue"
            value="${component.startValue}"
            step="1000"
          />
        </div>
      </div>
      <div class="input-field">
        <label>Annual Growth</label>
        <div class="input-wrapper">
          <input 
            type="number" 
            class="component-input"
            data-component-id="${component.id}"
            data-field="yearlyGrowthRate"
            data-is-percent="true"
            value="${(component.yearlyGrowthRate * 100).toFixed(1)}"
            step="0.1"
            min="-50"
            max="50"
          />
          <span class="input-suffix">%</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a single segment editor.
 */
function renderSegmentEditor(segment: UISegment, componentId: string): string {
  const seriesInputs = (() => {
    switch (segment.seriesType) {
      case 'constant':
        return `
          <div class="input-field">
            <label>Amount</label>
            <div class="input-wrapper">
              <span class="input-prefix">$</span>
              <input 
                type="number" 
                class="segment-input"
                data-component-id="${componentId}"
                data-segment-id="${segment.id}"
                data-field="value"
                value="${segment.value}"
                step="1000"
              />
            </div>
          </div>
        `;
      case 'linear':
        return `
          <div class="input-field">
            <label>Start</label>
            <div class="input-wrapper">
              <span class="input-prefix">$</span>
              <input 
                type="number" 
                class="segment-input"
                data-component-id="${componentId}"
                data-segment-id="${segment.id}"
                data-field="startValue"
                value="${segment.startValue}"
                step="1000"
              />
            </div>
          </div>
          <div class="input-field">
            <label>+/year</label>
            <div class="input-wrapper">
              <span class="input-prefix">$</span>
              <input 
                type="number" 
                class="segment-input"
                data-component-id="${componentId}"
                data-segment-id="${segment.id}"
                data-field="yearlyIncrement"
                value="${segment.yearlyIncrement}"
                step="500"
              />
            </div>
          </div>
        `;
      case 'ratio':
        return `
          <div class="input-field">
            <label>Start</label>
            <div class="input-wrapper">
              <span class="input-prefix">$</span>
              <input 
                type="number" 
                class="segment-input"
                data-component-id="${componentId}"
                data-segment-id="${segment.id}"
                data-field="startValue"
                value="${segment.startValue}"
                step="1000"
              />
            </div>
          </div>
          <div class="input-field">
            <label>Growth</label>
            <div class="input-wrapper">
              <input 
                type="number" 
                class="segment-input"
                data-component-id="${componentId}"
                data-segment-id="${segment.id}"
                data-field="yearlyGrowthRate"
                data-is-percent="true"
                value="${(segment.yearlyGrowthRate * 100).toFixed(1)}"
                step="0.1"
              />
              <span class="input-suffix">%</span>
            </div>
          </div>
        `;
    }
  })();

  const segmentTypes: Array<'constant' | 'linear' | 'ratio'> = ['constant', 'linear', 'ratio'];
  const typeButtons = segmentTypes.map(type => `
    <button 
      type="button"
      class="segment-type-btn ${segment.seriesType === type ? 'active' : ''}"
      data-component-id="${componentId}"
      data-segment-id="${segment.id}"
      data-segment-type="${type}"
    >
      ${SERIES_TYPE_LABELS[type]}
    </button>
  `).join('');

  return `
    <div class="segment-card" data-segment-id="${segment.id}">
      <div class="segment-header">
        <div class="segment-years">
          <input 
            type="number" 
            class="segment-input year-input"
            data-component-id="${componentId}"
            data-segment-id="${segment.id}"
            data-field="startYear"
            value="${segment.startYear}"
            min="2000"
            max="2100"
          />
          <span class="year-separator">–</span>
          <input 
            type="number" 
            class="segment-input year-input"
            data-component-id="${componentId}"
            data-segment-id="${segment.id}"
            data-field="endYear"
            value="${segment.endYear}"
            min="2000"
            max="2100"
          />
        </div>
        <button 
          type="button" 
          class="delete-segment-btn"
          data-component-id="${componentId}"
          data-segment-id="${segment.id}"
          title="Delete segment"
        >×</button>
      </div>
      <div class="segment-type-selector">${typeButtons}</div>
      <div class="segment-inputs">${seriesInputs}</div>
    </div>
  `;
}

/**
 * Render inputs for composite series.
 */
function renderCompositeInputs(component: UIComponent): string {
  const segments = component.segments.map(seg => 
    renderSegmentEditor(seg, component.id)
  ).join('');
  
  const emptyState = component.segments.length === 0 
    ? '<p class="empty-segments">No segments. Add one to define time periods.</p>'
    : '';
  
  return `
    <div class="series-inputs composite-inputs">
      <div class="segments-list">
        ${emptyState}
        ${segments}
      </div>
      <button 
        type="button" 
        class="add-segment-btn"
        data-component-id="${component.id}"
      >
        + Add Segment
      </button>
    </div>
  `;
}

/**
 * Render the type-specific inputs.
 */
function renderSeriesInputs(component: UIComponent): string {
  switch (component.seriesType) {
    case 'constant':
      return renderConstantInputs(component);
    case 'linear':
      return renderLinearInputs(component);
    case 'ratio':
      return renderRatioInputs(component);
    case 'composite':
      return renderCompositeInputs(component);
  }
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
  const previewYears = Math.min(projectionYears, 15);
  const preview = renderTimeSeriesPreview(series, baseYear, previewYears);
  
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
      
      ${renderSeriesTypeSelector(component)}
      ${renderSeriesInputs(component)}
      
      <div class="component-preview">
        ${preview}
      </div>
    </div>
  `;
}

