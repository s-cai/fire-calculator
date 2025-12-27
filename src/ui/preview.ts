/**
 * Time Series Preview Component
 * 
 * Small inline sparkline charts for visual feedback.
 */

import { TimeSeries, evaluate } from '../lib/timeseries';

/**
 * Generate SVG sparkline from an array of values.
 */
function renderSparkline(values: number[]): string {
  const width = 120;
  const height = 40;
  const padding = 4;
  
  if (values.length === 0) {
    return `<svg width="${width}" height="${height}" class="sparkline"></svg>`;
  }
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // Prevent division by zero
  
  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  
  // Add filled area under the line
  const firstX = padding;
  const lastX = padding + (width - padding * 2);
  const bottomY = height - padding;
  const areaPoints = `${firstX},${bottomY} ${points} ${lastX},${bottomY}`;
  
  return `
    <svg width="${width}" height="${height}" class="sparkline" aria-label="Time series preview">
      <polygon points="${areaPoints}" class="sparkline-area"/>
      <polyline points="${points}" class="sparkline-line"/>
    </svg>
  `;
}

/**
 * Evaluate a time series and render a sparkline preview.
 */
export function renderTimeSeriesPreview(
  series: TimeSeries,
  baseYear: number,
  years: number = 10
): string {
  const values: number[] = [];
  
  for (let i = 0; i <= years; i++) {
    values.push(evaluate(series, baseYear + i, baseYear));
  }
  
  return renderSparkline(values);
}

/**
 * Format a number as currency.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a number as percentage.
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

