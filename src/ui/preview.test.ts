/**
 * Tests for preview utility functions.
 */
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercent } from './preview';

describe('formatCurrency', () => {
  it('formats positive integers', () => {
    expect(formatCurrency(1000)).toBe('$1,000');
    expect(formatCurrency(50000)).toBe('$50,000');
    expect(formatCurrency(1234567)).toBe('$1,234,567');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });

  it('formats negative values', () => {
    expect(formatCurrency(-5000)).toBe('-$5,000');
    expect(formatCurrency(-100)).toBe('-$100');
  });

  it('rounds decimal values', () => {
    expect(formatCurrency(1234.56)).toBe('$1,235');
    expect(formatCurrency(1234.49)).toBe('$1,234');
  });

  it('handles large numbers', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000');
    expect(formatCurrency(2500000)).toBe('$2,500,000');
  });
});

describe('formatPercent', () => {
  it('formats decimal as percentage', () => {
    expect(formatPercent(0.07)).toBe('7.0%');
    expect(formatPercent(0.125)).toBe('12.5%');
  });

  it('formats zero', () => {
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('formats negative percentages', () => {
    expect(formatPercent(-0.05)).toBe('-5.0%');
  });

  it('formats 100% and beyond', () => {
    expect(formatPercent(1)).toBe('100.0%');
    expect(formatPercent(1.5)).toBe('150.0%');
  });

  it('handles small decimals', () => {
    expect(formatPercent(0.001)).toBe('0.1%');
    expect(formatPercent(0.0001)).toBe('0.0%');
  });
});

