/**
 * Results Display Component
 * 
 * Shows projection summary and year-by-year table.
 */

import { StateManager } from './state';
import { formatCurrency, formatPercent } from './preview';
import { YearlyProjection } from '../lib/projection';

/**
 * Calculate summary statistics from projection.
 */
function calculateSummary(projection: YearlyProjection[], initialNetWorth: number) {
  if (projection.length === 0) {
    return {
      finalNetWorth: initialNetWorth,
      totalIncome: 0,
      totalSpending: 0,
      netSavingsRate: 0,
      totalGrowth: 0,
      growthMultiple: 1,
    };
  }
  
  const totalIncome = projection.reduce((sum, p) => sum + p.income, 0);
  const totalSpending = projection.reduce((sum, p) => sum + p.spending, 0);
  const finalNetWorth = projection[projection.length - 1].netWorth;
  const netSavingsRate = totalIncome > 0 ? (totalIncome - totalSpending) / totalIncome : 0;
  const totalGrowth = finalNetWorth - initialNetWorth;
  const growthMultiple = initialNetWorth > 0 ? finalNetWorth / initialNetWorth : 0;
  
  return {
    finalNetWorth,
    totalIncome,
    totalSpending,
    netSavingsRate,
    totalGrowth,
    growthMultiple,
  };
}

/**
 * Render the summary section.
 */
function renderSummary(projection: YearlyProjection[], initialNetWorth: number): string {
  const summary = calculateSummary(projection, initialNetWorth);
  
  return `
    <div class="summary-section">
      <h3>Projection Summary</h3>
      <div class="summary-grid">
        <div class="summary-card highlight">
          <span class="summary-label">Final Net Worth</span>
          <span class="summary-value">${formatCurrency(summary.finalNetWorth)}</span>
          <span class="summary-subtitle">${summary.growthMultiple.toFixed(1)}× growth</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Total Income</span>
          <span class="summary-value">${formatCurrency(summary.totalIncome)}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Total Spending</span>
          <span class="summary-value">${formatCurrency(summary.totalSpending)}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Net Savings Rate</span>
          <span class="summary-value">${formatPercent(summary.netSavingsRate)}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a single table row.
 */
function renderTableRow(p: YearlyProjection, index: number): string {
  const classes = ['projection-row'];
  if (index % 2 === 0) classes.push('even');
  
  // Check for million-dollar milestones
  const millions = Math.floor(p.netWorth / 1000000);
  if (millions > 0 && millions !== Math.floor((p.netWorth - p.income + p.spending) / 1000000)) {
    classes.push('milestone');
  }
  
  return `
    <tr class="${classes.join(' ')}">
      <td class="year-cell">${p.year}</td>
      <td class="money-cell income">${formatCurrency(p.income)}</td>
      <td class="money-cell spending">${formatCurrency(p.spending)}</td>
      <td class="money-cell investment">${formatCurrency(p.investment)}</td>
      <td class="money-cell net-worth">${formatCurrency(p.netWorth)}</td>
    </tr>
  `;
}

/**
 * Render the projection table.
 */
function renderProjectionTable(projection: YearlyProjection[]): string {
  if (projection.length === 0) {
    return '<p class="no-data">No projection data available.</p>';
  }
  
  const rows = projection.map((p, i) => renderTableRow(p, i)).join('');
  
  return `
    <div class="table-section">
      <h3>Year-by-Year Projection</h3>
      <div class="table-container">
        <table class="projection-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Income</th>
              <th>Spending</th>
              <th>Investment</th>
              <th>Net Worth</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Render the net worth chart (simple bar visualization).
 * Handles both positive and negative values with a baseline.
 */
function renderNetWorthChart(projection: YearlyProjection[]): string {
  if (projection.length === 0) {
    return '';
  }
  
  const values = projection.map(p => p.netWorth);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  
  // Calculate the range and baseline position
  const range = maxVal - minVal || 1; // Prevent division by zero
  const hasNegative = minVal < 0;
  const hasPositive = maxVal > 0;
  
  // Calculate baseline position (where 0 sits) as percentage from bottom
  let baselinePercent = 0;
  if (hasNegative && hasPositive) {
    baselinePercent = (Math.abs(minVal) / range) * 100;
  } else if (hasNegative) {
    baselinePercent = 100; // All negative, baseline at top
  }
  // else all positive, baseline at bottom (0)
  
  const bars = projection.map((p, i) => {
    const width = 100 / projection.length;
    const isNegative = p.netWorth < 0;
    
    // Calculate height as percentage of total range
    const heightPercent = (Math.abs(p.netWorth) / range) * 100;
    
    return `
      <div class="chart-bar-container" style="width: ${width}%">
        <div 
          class="chart-bar ${isNegative ? 'negative' : ''}" 
          style="height: ${heightPercent}%; ${isNegative ? 'bottom: auto; top: ' + (100 - baselinePercent) + '%;' : 'bottom: ' + baselinePercent + '%;'}"
          title="${p.year}: ${formatCurrency(p.netWorth)}"
        ></div>
        ${i % 5 === 0 || i === projection.length - 1 ? `<span class="chart-label">${p.year}</span>` : ''}
      </div>
    `;
  }).join('');
  
  // Show baseline if we have both positive and negative
  const baseline = hasNegative && hasPositive 
    ? `<div class="chart-baseline" style="bottom: ${baselinePercent}%"></div>` 
    : '';
  
  return `
    <div class="chart-section">
      <h3>Net Worth Growth</h3>
      <div class="bar-chart">
        ${baseline}
        ${bars}
      </div>
      <div class="chart-legend">
        <span class="legend-start">${formatCurrency(minVal)}</span>
        <span class="legend-end">${formatCurrency(maxVal)}</span>
      </div>
    </div>
  `;
}

/**
 * Render the stale indicator banner.
 */
function renderStaleBanner(isStale: boolean): string {
  if (!isStale) {
    return '';
  }
  
  return `
    <div class="stale-banner">
      <span class="stale-message">📝 Inputs changed</span>
      <button type="button" class="recalculate-btn">
        Recalculate
      </button>
    </div>
  `;
}

/**
 * Render the complete results display.
 */
export function renderResults(container: HTMLElement, stateManager: StateManager): void {
  const state = stateManager.get();
  
  const html = `
    <div class="results-container ${state.isStale ? 'is-stale' : ''}">
      <div class="results-header">
        <h2>Projection Results</h2>
        <span class="results-subtitle">${state.baseYear} – ${state.baseYear + state.projectionYears - 1}</span>
      </div>
      
      ${renderStaleBanner(state.isStale)}
      
      <div class="results-content">
        ${renderSummary(state.projection, state.initialNetWorth)}
        ${renderNetWorthChart(state.projection)}
        ${renderProjectionTable(state.projection)}
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Wire up recalculate button
  const recalcBtn = container.querySelector<HTMLButtonElement>('.recalculate-btn');
  if (recalcBtn) {
    recalcBtn.addEventListener('click', () => {
      stateManager.recalculate();
    });
  }
}

