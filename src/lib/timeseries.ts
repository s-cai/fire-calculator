/**
 * Time Series Engine
 * 
 * Core types and evaluation for time-varying financial inputs.
 */

/** Fixed value throughout all years */
export interface ConstantSeries {
  type: 'constant';
  value: number;
}

/** Start value + fixed yearly increment */
export interface LinearGrowthSeries {
  type: 'linear';
  startValue: number;
  yearlyIncrement: number;
}

/** Start value + percentage growth (compounds annually) */
export interface RatioGrowthSeries {
  type: 'ratio';
  startValue: number;
  yearlyGrowthRate: number; // e.g., 0.03 for 3%
}

/** Multiple time intervals concatenated */
export interface CompositeSeries {
  type: 'composite';
  segments: Array<{
    series: TimeSeries;
    startYear: number;
    endYear: number; // exclusive
  }>;
}

export type TimeSeries = ConstantSeries | LinearGrowthSeries | RatioGrowthSeries | CompositeSeries;

/**
 * Evaluate a time series at a given year.
 * 
 * @param series - The time series to evaluate
 * @param year - The calendar year to evaluate at
 * @param baseYear - The "year 0" for growth calculations (when the series starts)
 * @returns The value of the series at the given year
 */
export function evaluate(series: TimeSeries, year: number, baseYear: number): number {
  const elapsed = year - baseYear;

  switch (series.type) {
    case 'constant':
      return series.value;

    case 'linear':
      return series.startValue + elapsed * series.yearlyIncrement;

    case 'ratio':
      return series.startValue * Math.pow(1 + series.yearlyGrowthRate, elapsed);

    case 'composite': {
      // Find the segment that contains this year
      for (const segment of series.segments) {
        if (year >= segment.startYear && year < segment.endYear) {
          // Use the segment's startYear as the baseYear for the nested series
          return evaluate(segment.series, year, segment.startYear);
        }
      }
      // No matching segment - return 0 (gap in coverage)
      return 0;
    }
  }
}

// --- Helper constructors for cleaner API ---

export function constant(value: number): ConstantSeries {
  return { type: 'constant', value };
}

export function linear(startValue: number, yearlyIncrement: number): LinearGrowthSeries {
  return { type: 'linear', startValue, yearlyIncrement };
}

export function ratio(startValue: number, yearlyGrowthRate: number): RatioGrowthSeries {
  return { type: 'ratio', startValue, yearlyGrowthRate };
}

export function composite(
  segments: Array<{ series: TimeSeries; startYear: number; endYear: number }>
): CompositeSeries {
  return { type: 'composite', segments };
}

