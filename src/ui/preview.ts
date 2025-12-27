/**
 * Time Series Preview Component
 * 
 * Chart preview with axes for visual feedback.
 */

import { TimeSeries, evaluate } from '../lib/timeseries';

/**
 * Format a number as compact currency for axis labels.
 */
function formatAxisValue(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Generate SVG chart with axes from an array of values.
 */
function renderChart(
  values: number[], 
  startYear: number,
  endYear: number
): string {
  const width = 280;
  const height = 80;
  const paddingLeft = 50;
  const paddingRight = 10;
  const paddingTop = 10;
  const paddingBottom = 25;
  
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  
  if (values.length === 0) {
    return `<svg width="${width}" height="${height}" class="preview-chart"></svg>`;
  }
  
  const min = Math.min(...values, 0); // Include 0 for baseline
  const max = Math.max(...values);
  const range = max - min || 1;
  
  // Generate line points
  const points = values.map((v, i) => {
    const x = paddingLeft + (i / (values.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((v - min) / range) * chartHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  
  // Generate filled area points
  const areaPoints = `${paddingLeft},${paddingTop + chartHeight} ${points} ${paddingLeft + chartWidth},${paddingTop + chartHeight}`;
  
  // Y-axis labels
  const yAxisLabels = `
    <text x="${paddingLeft - 5}" y="${paddingTop + 4}" class="axis-label y-axis" text-anchor="end">${formatAxisValue(max)}</text>
    <text x="${paddingLeft - 5}" y="${paddingTop + chartHeight}" class="axis-label y-axis" text-anchor="end">${formatAxisValue(min)}</text>
  `;
  
  // X-axis labels
  const xAxisLabels = `
    <text x="${paddingLeft}" y="${height - 5}" class="axis-label x-axis" text-anchor="start">${startYear}</text>
    <text x="${width - paddingRight}" y="${height - 5}" class="axis-label x-axis" text-anchor="end">${endYear}</text>
  `;
  
  // Axis lines
  const axisLines = `
    <line x1="${paddingLeft}" y1="${paddingTop}" x2="${paddingLeft}" y2="${paddingTop + chartHeight}" class="axis-line" />
    <line x1="${paddingLeft}" y1="${paddingTop + chartHeight}" x2="${width - paddingRight}" y2="${paddingTop + chartHeight}" class="axis-line" />
  `;
  
  return `
    <svg width="${width}" height="${height}" class="preview-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="var(--color-fire)" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="var(--color-fire)" stop-opacity="0.05"/>
        </linearGradient>
      </defs>
      ${axisLines}
      <polygon points="${areaPoints}" fill="url(#areaGradient)"/>
      <polyline points="${points}" class="chart-line"/>
      ${yAxisLabels}
      ${xAxisLabels}
    </svg>
  `;
}

/**
 * Evaluate a time series and render a preview chart.
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
  
  return renderChart(values, baseYear, baseYear + years);
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
