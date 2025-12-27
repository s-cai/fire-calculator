import { describe, it, expect } from 'vitest';
import { projectNetWorth, findFIREYear, yearsToFIRE, YearlyProjection } from './projection';
import { component, plan } from './components';
import { constant, linear, ratio } from './timeseries';

describe('projection', () => {
  describe('projectNetWorth', () => {
    it('produces correct array length', () => {
      const p = plan(2025, []);
      const result = projectNetWorth({
        plan: p,
        initialNetWorth: 0,
        startYear: 2025,
        endYear: 2030,
        investmentReturnRate: 0.07,
      });
      expect(result).toHaveLength(5);
    });

    it('maintains net worth with zero everything', () => {
      const p = plan(2025, []);
      const result = projectNetWorth({
        plan: p,
        initialNetWorth: 100000,
        startYear: 2025,
        endYear: 2028,
        investmentReturnRate: 0,
      });
      // With 0% return and no cash flow, net worth stays the same
      expect(result[0].netWorth).toBe(100000);
      expect(result[1].netWorth).toBe(100000);
      expect(result[2].netWorth).toBe(100000);
    });

    it('compounds returns correctly with no contributions', () => {
      const p = plan(2025, []);
      const result = projectNetWorth({
        plan: p,
        initialNetWorth: 100000,
        startYear: 2025,
        endYear: 2028,
        investmentReturnRate: 0.10,
      });
      // Year 1: 100000 * 1.10 = 110000
      expect(result[0].netWorth).toBeCloseTo(110000, 0);
      // Year 2: 110000 * 1.10 = 121000
      expect(result[1].netWorth).toBeCloseTo(121000, 0);
      // Year 3: 121000 * 1.10 = 133100
      expect(result[2].netWorth).toBeCloseTo(133100, 0);
    });

    it('grows linearly with pure savings (0% return)', () => {
      const p = plan(2025, [
        component('Salary', 'income', constant(100000)),
        component('Expenses', 'spending', constant(60000)),
      ]);
      const result = projectNetWorth({
        plan: p,
        initialNetWorth: 0,
        startYear: 2025,
        endYear: 2028,
        investmentReturnRate: 0,
      });
      // Net cash flow = 100000 - 60000 = 40000/year
      expect(result[0].netWorth).toBe(40000);
      expect(result[1].netWorth).toBe(80000);
      expect(result[2].netWorth).toBe(120000);
    });

    it('handles investment contributions with returns', () => {
      const p = plan(2025, [
        component('Salary', 'income', constant(100000)),
        component('Expenses', 'spending', constant(50000)),
        component('401k', 'investment', constant(20000)),
      ]);
      const result = projectNetWorth({
        plan: p,
        initialNetWorth: 0,
        startYear: 2025,
        endYear: 2026,
        investmentReturnRate: 0.10,
      });
      // Investment: 0 + 20000 = 20000, after 10% return = 22000
      // Remaining cash: 100000 - 50000 - 20000 = 30000
      // Total: 22000 + 30000 = 52000
      expect(result[0].netWorth).toBe(52000);
    });

    it('handles negative cash flow (spending > income)', () => {
      const p = plan(2025, [
        component('Salary', 'income', constant(40000)),
        component('Expenses', 'spending', constant(60000)),
      ]);
      const result = projectNetWorth({
        plan: p,
        initialNetWorth: 100000,
        startYear: 2025,
        endYear: 2028,
        investmentReturnRate: 0,
      });
      // Net cash flow = -20000/year
      expect(result[0].netWorth).toBe(80000);
      expect(result[1].netWorth).toBe(60000);
      expect(result[2].netWorth).toBe(40000);
    });

    it('allows negative net worth', () => {
      const p = plan(2025, [
        component('Expenses', 'spending', constant(50000)),
      ]);
      const result = projectNetWorth({
        plan: p,
        initialNetWorth: 0,
        startYear: 2025,
        endYear: 2028,
        investmentReturnRate: 0,
      });
      expect(result[0].netWorth).toBe(-50000);
      expect(result[1].netWorth).toBe(-100000);
      expect(result[2].netWorth).toBe(-150000);
    });

    it('calculates FIRE number as 25x spending', () => {
      const p = plan(2025, [
        component('Expenses', 'spending', constant(40000)),
      ]);
      const result = projectNetWorth({
        plan: p,
        initialNetWorth: 0,
        startYear: 2025,
        endYear: 2026,
        investmentReturnRate: 0,
      });
      expect(result[0].fireNumber).toBe(1000000); // 40000 * 25
    });

    it('calculates FIRE progress correctly', () => {
      const p = plan(2025, [
        component('Expenses', 'spending', constant(40000)),
      ]);
      const result = projectNetWorth({
        plan: p,
        initialNetWorth: 500000,
        startYear: 2025,
        endYear: 2026,
        investmentReturnRate: 0,
      });
      // Net worth: 500000 - 40000 = 460000
      // FIRE number: 1000000
      // Progress: 46%
      expect(result[0].fireProgress).toBeCloseTo(46, 0);
    });

    it('detects FIRE when net worth >= 25x spending', () => {
      const p = plan(2025, [
        component('Salary', 'income', constant(200000)),
        component('Expenses', 'spending', constant(40000)),
        component('401k', 'investment', constant(100000)),
      ]);
      const result = projectNetWorth({
        plan: p,
        initialNetWorth: 900000,
        startYear: 2025,
        endYear: 2030,
        investmentReturnRate: 0.07,
      });
      
      // FIRE number = 40000 * 25 = 1,000,000
      // Check that isFIRE becomes true when crossing threshold
      const fireYearIndex = result.findIndex(r => r.isFIRE);
      expect(fireYearIndex).toBeGreaterThanOrEqual(0);
      expect(result[fireYearIndex].netWorth).toBeGreaterThanOrEqual(1000000);
    });

    it('handles zero spending (FIRE number = 0)', () => {
      const p = plan(2025, [
        component('Salary', 'income', constant(50000)),
      ]);
      const result = projectNetWorth({
        plan: p,
        initialNetWorth: 0,
        startYear: 2025,
        endYear: 2026,
        investmentReturnRate: 0,
      });
      // Zero spending means FIRE number is 0
      // We don't consider that "FIRE" - need positive spending to be meaningful
      expect(result[0].fireNumber).toBe(0);
      expect(result[0].isFIRE).toBe(false);
    });

    it('handles varying spending over time', () => {
      const p = plan(2025, [
        component('Expenses', 'spending', linear(40000, 2000)),
      ]);
      const result = projectNetWorth({
        plan: p,
        initialNetWorth: 1000000,
        startYear: 2025,
        endYear: 2028,
        investmentReturnRate: 0,
      });
      
      expect(result[0].spending).toBe(40000);
      expect(result[0].fireNumber).toBe(1000000);
      
      expect(result[1].spending).toBe(42000);
      expect(result[1].fireNumber).toBe(1050000);
      
      expect(result[2].spending).toBe(44000);
      expect(result[2].fireNumber).toBe(1100000);
    });

    it('includes all expected fields in output', () => {
      const p = plan(2025, [
        component('Salary', 'income', constant(100000)),
        component('Expenses', 'spending', constant(40000)),
        component('401k', 'investment', constant(20000)),
      ]);
      const result = projectNetWorth({
        plan: p,
        initialNetWorth: 100000,
        startYear: 2025,
        endYear: 2026,
        investmentReturnRate: 0.07,
      });
      
      const projection = result[0];
      expect(projection).toHaveProperty('year');
      expect(projection).toHaveProperty('income');
      expect(projection).toHaveProperty('spending');
      expect(projection).toHaveProperty('investment');
      expect(projection).toHaveProperty('netWorth');
      expect(projection).toHaveProperty('fireNumber');
      expect(projection).toHaveProperty('fireProgress');
      expect(projection).toHaveProperty('isFIRE');
    });
  });

  describe('findFIREYear', () => {
    it('returns the first year FIRE is achieved', () => {
      const projections: YearlyProjection[] = [
        { year: 2025, income: 0, spending: 40000, investment: 0, netWorth: 800000, fireNumber: 1000000, fireProgress: 80, isFIRE: false },
        { year: 2026, income: 0, spending: 40000, investment: 0, netWorth: 900000, fireNumber: 1000000, fireProgress: 90, isFIRE: false },
        { year: 2027, income: 0, spending: 40000, investment: 0, netWorth: 1000000, fireNumber: 1000000, fireProgress: 100, isFIRE: true },
        { year: 2028, income: 0, spending: 40000, investment: 0, netWorth: 1100000, fireNumber: 1000000, fireProgress: 110, isFIRE: true },
      ];
      expect(findFIREYear(projections)).toBe(2027);
    });

    it('returns null when FIRE is never achieved', () => {
      const projections: YearlyProjection[] = [
        { year: 2025, income: 0, spending: 40000, investment: 0, netWorth: 100000, fireNumber: 1000000, fireProgress: 10, isFIRE: false },
        { year: 2026, income: 0, spending: 40000, investment: 0, netWorth: 200000, fireNumber: 1000000, fireProgress: 20, isFIRE: false },
      ];
      expect(findFIREYear(projections)).toBeNull();
    });

    it('returns null for empty projections', () => {
      expect(findFIREYear([])).toBeNull();
    });

    it('returns first year if already FIRE at start', () => {
      const projections: YearlyProjection[] = [
        { year: 2025, income: 0, spending: 40000, investment: 0, netWorth: 2000000, fireNumber: 1000000, fireProgress: 200, isFIRE: true },
      ];
      expect(findFIREYear(projections)).toBe(2025);
    });
  });

  describe('yearsToFIRE', () => {
    it('calculates years from given start year', () => {
      const projections: YearlyProjection[] = [
        { year: 2025, income: 0, spending: 40000, investment: 0, netWorth: 800000, fireNumber: 1000000, fireProgress: 80, isFIRE: false },
        { year: 2026, income: 0, spending: 40000, investment: 0, netWorth: 900000, fireNumber: 1000000, fireProgress: 90, isFIRE: false },
        { year: 2027, income: 0, spending: 40000, investment: 0, netWorth: 1000000, fireNumber: 1000000, fireProgress: 100, isFIRE: true },
      ];
      expect(yearsToFIRE(projections, 2025)).toBe(2);
    });

    it('returns null when FIRE is never achieved', () => {
      const projections: YearlyProjection[] = [
        { year: 2025, income: 0, spending: 40000, investment: 0, netWorth: 100000, fireNumber: 1000000, fireProgress: 10, isFIRE: false },
      ];
      expect(yearsToFIRE(projections, 2025)).toBeNull();
    });

    it('returns 0 if already FIRE at start year', () => {
      const projections: YearlyProjection[] = [
        { year: 2025, income: 0, spending: 40000, investment: 0, netWorth: 2000000, fireNumber: 1000000, fireProgress: 200, isFIRE: true },
      ];
      expect(yearsToFIRE(projections, 2025)).toBe(0);
    });

    it('handles fromYear different than projection start', () => {
      const projections: YearlyProjection[] = [
        { year: 2025, income: 0, spending: 40000, investment: 0, netWorth: 800000, fireNumber: 1000000, fireProgress: 80, isFIRE: false },
        { year: 2026, income: 0, spending: 40000, investment: 0, netWorth: 900000, fireNumber: 1000000, fireProgress: 90, isFIRE: false },
        { year: 2027, income: 0, spending: 40000, investment: 0, netWorth: 1000000, fireNumber: 1000000, fireProgress: 100, isFIRE: true },
      ];
      // From 2020 (5 years before first projection), FIRE in 2027 = 7 years
      expect(yearsToFIRE(projections, 2020)).toBe(7);
    });
  });
});

