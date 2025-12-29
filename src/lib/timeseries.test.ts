import { describe, it, expect } from 'vitest';
import { evaluate, constant, linear, ratio, composite } from './timeseries';

describe('timeseries', () => {
  describe('constant series', () => {
    it('returns the same value for any year', () => {
      const series = constant(80000);
      expect(evaluate(series, 2025, 2025)).toBe(80000);
      expect(evaluate(series, 2030, 2025)).toBe(80000);
      expect(evaluate(series, 2100, 2025)).toBe(80000);
    });

    it('returns the same value even for years before base year', () => {
      const series = constant(50000);
      expect(evaluate(series, 2020, 2025)).toBe(50000);
    });

    it('handles zero value', () => {
      const series = constant(0);
      expect(evaluate(series, 2025, 2025)).toBe(0);
    });

    it('handles negative value', () => {
      const series = constant(-5000);
      expect(evaluate(series, 2025, 2025)).toBe(-5000);
    });
  });

  describe('linear growth series', () => {
    it('returns start value at base year', () => {
      const series = linear(80000, 2000);
      expect(evaluate(series, 2025, 2025)).toBe(80000);
    });

    it('adds increment each year', () => {
      const series = linear(80000, 2000);
      expect(evaluate(series, 2026, 2025)).toBe(82000);
      expect(evaluate(series, 2027, 2025)).toBe(84000);
      expect(evaluate(series, 2030, 2025)).toBe(90000);
    });

    it('handles years before base year (negative elapsed)', () => {
      const series = linear(80000, 2000);
      expect(evaluate(series, 2024, 2025)).toBe(78000);
      expect(evaluate(series, 2020, 2025)).toBe(70000);
    });

    it('handles zero increment', () => {
      const series = linear(80000, 0);
      expect(evaluate(series, 2030, 2025)).toBe(80000);
    });

    it('handles negative increment', () => {
      const series = linear(80000, -5000);
      expect(evaluate(series, 2027, 2025)).toBe(70000);
    });
  });

  describe('ratio growth series', () => {
    it('returns start value at base year', () => {
      const series = ratio(80000, 0.03);
      expect(evaluate(series, 2025, 2025)).toBe(80000);
    });

    it('compounds growth each year', () => {
      const series = ratio(80000, 0.03);
      expect(evaluate(series, 2026, 2025)).toBeCloseTo(82400, 2);
      expect(evaluate(series, 2027, 2025)).toBeCloseTo(84872, 0);
    });

    it('calculates correct compound growth over multiple years', () => {
      const series = ratio(100000, 0.10); // 10% growth
      // After 5 years: 100000 * 1.10^5 = 161051
      expect(evaluate(series, 2030, 2025)).toBeCloseTo(161051, 0);
    });

    it('handles zero growth rate', () => {
      const series = ratio(80000, 0);
      expect(evaluate(series, 2030, 2025)).toBe(80000);
    });

    it('handles negative growth rate (decline)', () => {
      const series = ratio(80000, -0.10);
      expect(evaluate(series, 2026, 2025)).toBeCloseTo(72000, 2);
    });

    it('handles years before base year', () => {
      const series = ratio(80000, 0.10);
      // 1 year before: 80000 / 1.10 ≈ 72727
      expect(evaluate(series, 2024, 2025)).toBeCloseTo(72727.27, 0);
    });
  });

  describe('composite series', () => {
    it('returns value from correct segment', () => {
      const series = composite([
        { series: constant(80000), startYear: 2025, endYear: 2029 },
        { series: constant(120000), startYear: 2030, endYear: 2040 },
      ]);
      expect(evaluate(series, 2025, 2025)).toBe(80000);
      expect(evaluate(series, 2029, 2025)).toBe(80000);
      expect(evaluate(series, 2030, 2025)).toBe(120000);
      expect(evaluate(series, 2035, 2025)).toBe(120000);
    });

    it('returns 0 for years in gaps between segments', () => {
      const series = composite([
        { series: constant(80000), startYear: 2025, endYear: 2028 },
        { series: constant(120000), startYear: 2030, endYear: 2040 },
      ]);
      expect(evaluate(series, 2029, 2025)).toBe(0);
    });

    it('returns 0 for years before first segment', () => {
      const series = composite([
        { series: constant(80000), startYear: 2025, endYear: 2030 },
      ]);
      expect(evaluate(series, 2024, 2025)).toBe(0);
    });

    it('returns 0 for years after last segment', () => {
      const series = composite([
        { series: constant(80000), startYear: 2025, endYear: 2030 },
      ]);
      expect(evaluate(series, 2030, 2025)).toBe(80000);
      expect(evaluate(series, 2035, 2025)).toBe(0);
    });

    it('returns 0 for empty composite', () => {
      const series = composite([]);
      expect(evaluate(series, 2025, 2025)).toBe(0);
    });

    it('evaluates nested growth series with segment-relative base year', () => {
      // Salary: $80k with 3% raises starting in 2025, then $120k with 5% raises starting in 2030
      const series = composite([
        { series: ratio(80000, 0.03), startYear: 2025, endYear: 2029 },
        { series: ratio(120000, 0.05), startYear: 2030, endYear: 2040 },
      ]);
      
      // 2025: first year of first segment → 80000
      expect(evaluate(series, 2025, 2025)).toBe(80000);
      
      // 2027: 2 years into first segment → 80000 * 1.03^2
      expect(evaluate(series, 2027, 2025)).toBeCloseTo(84872, 0);
      
      // 2029: last year of first segment → 80000 * 1.03^4
      expect(evaluate(series, 2029, 2025)).toBeCloseTo(90041, 0);
      
      // 2030: first year of second segment → 120000
      expect(evaluate(series, 2030, 2025)).toBe(120000);
      
      // 2032: 2 years into second segment → 120000 * 1.05^2
      expect(evaluate(series, 2032, 2025)).toBeCloseTo(132300, 0);
    });

    it('handles linear growth within composite', () => {
      const series = composite([
        { series: linear(50000, 5000), startYear: 2025, endYear: 2030 },
      ]);
      expect(evaluate(series, 2025, 2025)).toBe(50000);
      expect(evaluate(series, 2027, 2025)).toBe(60000); // 50000 + 2*5000
    });

    it('handles nested composite series', () => {
      const inner = composite([
        { series: constant(100), startYear: 2025, endYear: 2027 },
        { series: constant(200), startYear: 2028, endYear: 2029 },
      ]);
      const outer = composite([
        { series: inner, startYear: 2025, endYear: 2029 },
        { series: constant(300), startYear: 2030, endYear: 2035 },
      ]);
      
      expect(evaluate(outer, 2026, 2025)).toBe(100);
      expect(evaluate(outer, 2027, 2025)).toBe(100);
      expect(evaluate(outer, 2028, 2025)).toBe(200);
      expect(evaluate(outer, 2029, 2025)).toBe(200);
      expect(evaluate(outer, 2032, 2025)).toBe(300);
    });
  });
});

