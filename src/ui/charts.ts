/**
 * Chart Utilities
 * 
 * Wrapper functions for Chart.js visualizations.
 */

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

// Register only the components we need (tree-shaking friendly)
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend
);

// Color palette matching our CSS theme
const COLORS = {
  fire: '#ff6b35',
  ember: '#ff8f5a',
  income: '#22c55e',
  spending: '#ef4444',
  investment: '#3b82f6',
  gridLine: '#e5e5e5',
  text: '#64748b',
  textDark: '#1e293b',
};

/**
 * Format currency for chart labels.
 */
function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Common chart options.
 */
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(30, 41, 59, 0.95)',
      titleFont: { size: 13, weight: 'bold' as const },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        label: function(context: { dataset: { label?: string }; parsed: { y: number } }) {
          const label = context.dataset.label || '';
          const value = formatCurrency(context.parsed.y);
          return `${label}: ${value}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: COLORS.text,
        font: { size: 11 },
      },
    },
    y: {
      grid: {
        color: COLORS.gridLine,
      },
      ticks: {
        color: COLORS.text,
        font: { size: 11 },
        callback: function(value: string | number) {
          return formatCurrency(Number(value));
        },
      },
    },
  },
};

/**
 * Create a net worth line chart with gradient fill.
 */
export function createNetWorthChart(
  canvas: HTMLCanvasElement,
  years: number[],
  netWorth: number[]
): Chart {
  const ctx = canvas.getContext('2d')!;
  
  // Create gradient for fill
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(255, 107, 53, 0.4)');
  gradient.addColorStop(1, 'rgba(255, 107, 53, 0.05)');
  
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: years.map(String),
      datasets: [{
        label: 'Net Worth',
        data: netWorth,
        borderColor: COLORS.fire,
        backgroundColor: gradient,
        borderWidth: 3,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: COLORS.fire,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      }],
    },
    options: {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        legend: { display: false },
      },
    },
  });
}

/**
 * Create an income vs spending dual line chart.
 */
export function createCashFlowChart(
  canvas: HTMLCanvasElement,
  years: number[],
  income: number[],
  spending: number[]
): Chart {
  const ctx = canvas.getContext('2d')!;
  
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: years.map(String),
      datasets: [
        {
          label: 'Income',
          data: income,
          borderColor: COLORS.income,
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 2.5,
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: COLORS.income,
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
        },
        {
          label: 'Spending',
          data: spending,
          borderColor: COLORS.spending,
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2.5,
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: COLORS.spending,
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
        },
      ],
    },
    options: {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        legend: {
          display: true,
          position: 'top' as const,
          align: 'end' as const,
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 16,
            font: { size: 12 },
            color: COLORS.textDark,
          },
        },
      },
    },
  });
}

/**
 * Safely destroy a chart instance.
 */
export function destroyChart(chart: Chart | null | undefined): void {
  if (chart) {
    chart.destroy();
  }
}

