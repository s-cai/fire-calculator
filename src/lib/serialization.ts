/**
 * Serialization & URL Encoding
 * 
 * JSON serialization with validation and URL-safe compression.
 */

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { TimeSeries, ConstantSeries, LinearGrowthSeries, RatioGrowthSeries, CompositeSeries } from './timeseries';
import type { FinancialPlan, FinancialComponent, ComponentCategory } from './components';

// --- Validation Error ---

export class ValidationError extends Error {
  constructor(message: string, public path: string = '') {
    super(path ? `${path}: ${message}` : message);
    this.name = 'ValidationError';
  }
}

// --- Type Guards ---

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

// --- TimeSeries Validation ---

function validateConstantSeries(data: unknown, path: string): ConstantSeries {
  if (!isObject(data)) throw new ValidationError('expected object', path);
  if (data.type !== 'constant') throw new ValidationError('expected type "constant"', path);
  if (!isNumber(data.value)) throw new ValidationError('value must be a number', `${path}.value`);
  
  return { type: 'constant', value: data.value };
}

function validateLinearSeries(data: unknown, path: string): LinearGrowthSeries {
  if (!isObject(data)) throw new ValidationError('expected object', path);
  if (data.type !== 'linear') throw new ValidationError('expected type "linear"', path);
  if (!isNumber(data.startValue)) throw new ValidationError('startValue must be a number', `${path}.startValue`);
  if (!isNumber(data.yearlyIncrement)) throw new ValidationError('yearlyIncrement must be a number', `${path}.yearlyIncrement`);
  
  return { type: 'linear', startValue: data.startValue, yearlyIncrement: data.yearlyIncrement };
}

function validateRatioSeries(data: unknown, path: string): RatioGrowthSeries {
  if (!isObject(data)) throw new ValidationError('expected object', path);
  if (data.type !== 'ratio') throw new ValidationError('expected type "ratio"', path);
  if (!isNumber(data.startValue)) throw new ValidationError('startValue must be a number', `${path}.startValue`);
  if (!isNumber(data.yearlyGrowthRate)) throw new ValidationError('yearlyGrowthRate must be a number', `${path}.yearlyGrowthRate`);
  
  return { type: 'ratio', startValue: data.startValue, yearlyGrowthRate: data.yearlyGrowthRate };
}

function validateCompositeSeries(data: unknown, path: string): CompositeSeries {
  if (!isObject(data)) throw new ValidationError('expected object', path);
  if (data.type !== 'composite') throw new ValidationError('expected type "composite"', path);
  if (!isArray(data.segments)) throw new ValidationError('segments must be an array', `${path}.segments`);
  
  const segments = data.segments.map((seg, i) => {
    const segPath = `${path}.segments[${i}]`;
    if (!isObject(seg)) throw new ValidationError('expected object', segPath);
    if (!isNumber(seg.startYear)) throw new ValidationError('startYear must be a number', `${segPath}.startYear`);
    if (!isNumber(seg.endYear)) throw new ValidationError('endYear must be a number', `${segPath}.endYear`);
    
    return {
      series: validateTimeSeries(seg.series, `${segPath}.series`),
      startYear: seg.startYear,
      endYear: seg.endYear,
    };
  });
  
  return { type: 'composite', segments };
}

export function validateTimeSeries(data: unknown, path: string = 'series'): TimeSeries {
  if (!isObject(data)) throw new ValidationError('expected object', path);
  
  switch (data.type) {
    case 'constant': return validateConstantSeries(data, path);
    case 'linear': return validateLinearSeries(data, path);
    case 'ratio': return validateRatioSeries(data, path);
    case 'composite': return validateCompositeSeries(data, path);
    default: throw new ValidationError(`unknown series type: ${data.type}`, `${path}.type`);
  }
}

// --- Component Validation ---

const VALID_CATEGORIES: ComponentCategory[] = ['income', 'spending'];

function validateComponent(data: unknown, path: string): FinancialComponent {
  if (!isObject(data)) throw new ValidationError('expected object', path);
  if (!isString(data.name)) throw new ValidationError('name must be a string', `${path}.name`);
  if (!isString(data.category) || !VALID_CATEGORIES.includes(data.category as ComponentCategory)) {
    throw new ValidationError(`category must be one of: ${VALID_CATEGORIES.join(', ')}`, `${path}.category`);
  }
  
  return {
    name: data.name,
    category: data.category as ComponentCategory,
    series: validateTimeSeries(data.series, `${path}.series`),
  };
}

// --- Plan Validation ---

export function validatePlan(data: unknown, path: string = 'plan'): FinancialPlan {
  if (!isObject(data)) throw new ValidationError('expected object', path);
  if (!isNumber(data.baseYear)) throw new ValidationError('baseYear must be a number', `${path}.baseYear`);
  if (!isArray(data.components)) throw new ValidationError('components must be an array', `${path}.components`);
  
  const components = data.components.map((comp, i) => 
    validateComponent(comp, `${path}.components[${i}]`)
  );
  
  return { baseYear: data.baseYear, components };
}

// --- Extended Plan (includes basic parameters) ---

export interface ExtendedPlan {
  baseYear: number;
  projectionYears: number;
  initialNetWorth: number;
  investmentReturnRate: number;
  components: FinancialComponent[];
}

export function validateExtendedPlan(data: unknown, path: string = 'plan'): ExtendedPlan {
  if (!isObject(data)) throw new ValidationError('expected object', path);
  if (!isNumber(data.baseYear)) throw new ValidationError('baseYear must be a number', `${path}.baseYear`);
  if (!isNumber(data.projectionYears)) throw new ValidationError('projectionYears must be a number', `${path}.projectionYears`);
  if (!isNumber(data.initialNetWorth)) throw new ValidationError('initialNetWorth must be a number', `${path}.initialNetWorth`);
  if (!isNumber(data.investmentReturnRate)) throw new ValidationError('investmentReturnRate must be a number', `${path}.investmentReturnRate`);
  if (!isArray(data.components)) throw new ValidationError('components must be an array', `${path}.components`);
  
  const components = data.components.map((comp, i) => 
    validateComponent(comp, `${path}.components[${i}]`)
  );
  
  return {
    baseYear: data.baseYear,
    projectionYears: data.projectionYears,
    initialNetWorth: data.initialNetWorth,
    investmentReturnRate: data.investmentReturnRate,
    components,
  };
}

// --- Serialization ---

/**
 * Serialize a financial plan to JSON string.
 */
export function serialize(plan: FinancialPlan): string {
  return JSON.stringify(plan);
}

/**
 * Deserialize and validate a JSON string to a FinancialPlan.
 * Throws ValidationError if the data is invalid.
 */
export function deserialize(json: string): FinancialPlan {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (e) {
    throw new ValidationError('invalid JSON');
  }
  return validatePlan(data);
}

// --- URL Encoding ---

/**
 * Encode a financial plan for URL sharing.
 * Uses lz-string compression to keep URLs short.
 */
export function encodeForURL(plan: FinancialPlan): string {
  const json = serialize(plan);
  return compressToEncodedURIComponent(json);
}

/**
 * Decode a financial plan from a URL parameter.
 * Throws ValidationError if the data is invalid.
 */
export function decodeFromURL(encoded: string): FinancialPlan {
  const json = decompressFromEncodedURIComponent(encoded);
  if (!json) {
    throw new ValidationError('failed to decompress URL data');
  }
  return deserialize(json);
}

/**
 * Encode an extended plan (with basic parameters) for URL sharing.
 */
export function encodeExtendedPlanForURL(extendedPlan: ExtendedPlan): string {
  const json = JSON.stringify(extendedPlan);
  return compressToEncodedURIComponent(json);
}

/**
 * Decode an extended plan from a URL parameter.
 * Throws ValidationError if the data is invalid.
 */
export function decodeExtendedPlanFromURL(encoded: string): ExtendedPlan {
  const json = decompressFromEncodedURIComponent(encoded);
  if (!json) {
    throw new ValidationError('failed to decompress URL data');
  }
  
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (e) {
    throw new ValidationError('invalid JSON');
  }
  
  return validateExtendedPlan(data);
}

