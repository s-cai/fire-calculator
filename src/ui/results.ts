/**
 * Results Display Component
 * 
 * Shows projection summary, charts, and year-by-year table.
 * Uses Chart.js for visualization.
 */

import { StateManager } from './state';
import { formatCurrency, formatPercent } from './preview';
import { YearlyProjection } from '../lib/projection';
import { createNetWorthChart, createCashFlowChart, destroyChart } from './charts';
import { getShareableURL, updateURL } from './url-sharing';

// Store chart instances for cleanup
type ChartInstance = ReturnType<typeof createNetWorthChart>;
let netWorthChart: ChartInstance | null = null;
let cashFlowChart: ChartInstance | null = null;

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
 * Render chart containers (canvas elements).
 */
function renderChartContainers(): string {
  return `
    <div class="charts-section">
      <div class="chart-container">
        <h3>Net Worth Growth</h3>
        <div class="chart-wrapper">
          <canvas id="netWorthChart"></canvas>
        </div>
      </div>
      <div class="chart-container">
        <h3>Income vs Spending</h3>
        <div class="chart-wrapper">
          <canvas id="cashFlowChart"></canvas>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize Chart.js charts after DOM is ready.
 */
function initializeCharts(projection: YearlyProjection[]): void {
  // Destroy existing charts
  destroyChart(netWorthChart);
  destroyChart(cashFlowChart);
  netWorthChart = null;
  cashFlowChart = null;
  
  if (projection.length === 0) return;
  
  const years = projection.map(p => p.year);
  const netWorth = projection.map(p => p.netWorth);
  const income = projection.map(p => p.income);
  const spending = projection.map(p => p.spending);
  
  // Get canvas elements
  const netWorthCanvas = document.getElementById('netWorthChart') as HTMLCanvasElement | null;
  const cashFlowCanvas = document.getElementById('cashFlowChart') as HTMLCanvasElement | null;
  
  if (netWorthCanvas) {
    netWorthChart = createNetWorthChart(netWorthCanvas, years, netWorth);
  }
  
  if (cashFlowCanvas) {
    cashFlowChart = createCashFlowChart(cashFlowCanvas, years, income, spending);
  }
}

/**
 * Render the stale indicator banner.
 */
function renderStaleBanner(isStale: boolean, showProjection: boolean): string {
  if (!isStale) {
    return '';
  }
  
  // Different message when projection is hidden
  if (!showProjection) {
    return `
      <div class="stale-banner stale-banner--hidden">
        <span class="stale-message">📝 Inputs changed</span>
      </div>
    `;
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
 * Render placeholder when projection is hidden.
 */
function renderProjectionPlaceholder(): string {
  return `
    <div class="projection-placeholder">
      <p class="placeholder-message">📊 Projection hidden</p>
      <p class="placeholder-hint">Use the "Show Projection" button above to view your results</p>
    </div>
  `;
}

/**
 * Render the complete results display.
 */
export function renderResults(container: HTMLElement, stateManager: StateManager): void {
  const state = stateManager.get();
  
  // Show placeholder when projection is hidden (mobile)
  const resultsContent = state.showProjection ? `
    <div class="results-content">
      ${renderSummary(state.projection, state.initialNetWorth)}
      ${renderChartContainers()}
      ${renderProjectionTable(state.projection)}
    </div>
  ` : renderProjectionPlaceholder();
  
  const html = `
    <div class="results-container ${state.isStale ? 'is-stale' : ''} ${!state.showProjection ? 'is-hidden' : ''}">
      <div class="results-header">
        <div>
          <h2>Projection Results</h2>
          <span class="results-subtitle">${state.baseYear} – ${state.baseYear + state.projectionYears - 1}</span>
        </div>
        <button type="button" class="share-btn" title="Copy shareable URL">
          🔗 Share this plan
        </button>
      </div>
      
      ${renderStaleBanner(state.isStale, state.showProjection)}
      
      ${resultsContent}
    </div>
  `;
  
  container.innerHTML = html;
  
  // Only initialize charts when projection is visible
  if (state.showProjection) {
    initializeCharts(state.projection);
  } else {
    // Destroy charts when hidden to free resources
    destroyChart(netWorthChart);
    destroyChart(cashFlowChart);
    netWorthChart = null;
    cashFlowChart = null;
  }
  
  // Wire up recalculate button
  const recalcBtn = container.querySelector<HTMLButtonElement>('.recalculate-btn');
  if (recalcBtn) {
    recalcBtn.addEventListener('click', () => {
      stateManager.recalculate();
    });
  }
  
  // Wire up share button
  const shareBtn = container.querySelector<HTMLButtonElement>('.share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const extendedPlan = {
        baseYear: state.baseYear,
        projectionYears: state.projectionYears,
        initialNetWorth: state.initialNetWorth,
        investmentReturnRate: state.investmentReturnRate,
        components: state.plan.components,
      };
      const url = getShareableURL(extendedPlan);
      updateURL(extendedPlan);
      
      // Copy to clipboard
      navigator.clipboard.writeText(url).then(() => {
        // Show feedback
        const originalText = shareBtn.textContent;
        shareBtn.textContent = '✓ Copied!';
        shareBtn.classList.add('share-btn--copied');
        setTimeout(() => {
          shareBtn.textContent = originalText;
          shareBtn.classList.remove('share-btn--copied');
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy URL:', err);
        // Fallback: show URL in alert
        alert(`Share this URL:\n\n${url}`);
      });
    });
  }
}
