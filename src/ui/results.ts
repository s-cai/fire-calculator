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
 */
function renderNetWorthChart(projection: YearlyProjection[]): string {
  if (projection.length === 0) {
    return '';
  }
  
  const maxNetWorth = Math.max(...projection.map(p => p.netWorth));
  
  const bars = projection.map((p, i) => {
    const height = maxNetWorth > 0 ? (p.netWorth / maxNetWorth) * 100 : 0;
    const width = 100 / projection.length;
    const isNegative = p.netWorth < 0;
    
    return `
      <div class="chart-bar-container" style="width: ${width}%">
        <div 
          class="chart-bar ${isNegative ? 'negative' : ''}" 
          style="height: ${Math.abs(height)}%"
          title="${p.year}: ${formatCurrency(p.netWorth)}"
        ></div>
        ${i % 5 === 0 || i === projection.length - 1 ? `<span class="chart-label">${p.year}</span>` : ''}
      </div>
    `;
  }).join('');
  
  return `
    <div class="chart-section">
      <h3>Net Worth Growth</h3>
      <div class="bar-chart">
        ${bars}
      </div>
      <div class="chart-legend">
        <span class="legend-start">${formatCurrency(0)}</span>
        <span class="legend-end">${formatCurrency(maxNetWorth)}</span>
      </div>
    </div>
  `;
}

/**
 * Render the complete results display.
 */
export function renderResults(container: HTMLElement, stateManager: StateManager): void {
  const state = stateManager.get();
  
  const html = `
    <div class="results-container">
      <div class="results-header">
        <h2>Projection Results</h2>
        <span class="results-subtitle">${state.baseYear} – ${state.baseYear + state.projectionYears - 1}</span>
      </div>
      
      ${renderSummary(state.projection, state.initialNetWorth)}
      ${renderNetWorthChart(state.projection)}
      ${renderProjectionTable(state.projection)}
    </div>
  `;
  
  container.innerHTML = html;
}

