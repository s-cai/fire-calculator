import { describe, it, expect } from 'vitest';
import { projectNetWorth } from './projection';
import { component, plan } from './components';
import { constant, linear } from './timeseries';

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

    it('handles income and spending with returns', () => {
      const p = plan(2025, [
        component('Salary', 'income', constant(100000)),
        component('Expenses', 'spending', constant(50000)),
      ]);
      const result = projectNetWorth({
        plan: p,
        initialNetWorth: 0,
        startYear: 2025,
        endYear: 2026,
        investmentReturnRate: 0.10,
      });
      // Net worth starts at 0, after 10% return = 0
      // Net cash flow: 100000 - 50000 = 50000
      // Total: 0 + 50000 = 50000
      expect(result[0].netWorth).toBe(50000);
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
      expect(result[1].spending).toBe(42000);
      expect(result[2].spending).toBe(44000);
    });

    it('includes all expected fields in output', () => {
      const p = plan(2025, [
        component('Salary', 'income', constant(100000)),
        component('Expenses', 'spending', constant(40000)),
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
      expect(projection).toHaveProperty('netWorth');
    });

    it('handles empty year range', () => {
      const p = plan(2025, []);
      const result = projectNetWorth({
        plan: p,
        initialNetWorth: 100000,
        startYear: 2025,
        endYear: 2025,
        investmentReturnRate: 0.07,
      });
      expect(result).toEqual([]);
    });

    it('does not apply investment returns to negative net worth', () => {
      const p = plan(2025, [
        component('Expenses', 'spending', constant(50000)),
      ]);
      const result = projectNetWorth({
        plan: p,
        initialNetWorth: -10000, // Starting with debt
        startYear: 2025,
        endYear: 2028,
        investmentReturnRate: 0.10, // 10% return rate
      });
      // With negative net worth, no investment returns should be applied
      // Year 1: -10000 (no returns) - 50000 (spending) = -60000
      expect(result[0].investmentReturns).toBe(0);
      expect(result[0].netWorth).toBe(-60000);
      // Year 2: -60000 (no returns) - 50000 = -110000
      expect(result[1].investmentReturns).toBe(0);
      expect(result[1].netWorth).toBe(-110000);
      // Year 3: -110000 (no returns) - 50000 = -160000
      expect(result[2].investmentReturns).toBe(0);
      expect(result[2].netWorth).toBe(-160000);
    });

    it('applies investment returns only when net worth becomes positive', () => {
      const p = plan(2025, [
        component('Salary', 'income', constant(60000)),
        component('Expenses', 'spending', constant(50000)),
      ]);
      const result = projectNetWorth({
        plan: p,
        initialNetWorth: -50000, // Starting with debt
        startYear: 2025,
        endYear: 2028,
        investmentReturnRate: 0.10, // 10% return rate
      });
      // Year 1: -50000 (no returns, negative) + 10000 (net cash flow) = -40000
      expect(result[0].investmentReturns).toBe(0);
      expect(result[0].netWorth).toBe(-40000);
      // Year 2: -40000 (no returns, negative) + 10000 = -30000
      expect(result[1].investmentReturns).toBe(0);
      expect(result[1].netWorth).toBe(-30000);
      // Year 3: -30000 (no returns, negative) + 10000 = -20000
      expect(result[2].investmentReturns).toBe(0);
      expect(result[2].netWorth).toBe(-20000);
    });

    it('applies investment returns when net worth is positive', () => {
      const p = plan(2025, [
        component('Salary', 'income', constant(100000)),
        component('Expenses', 'spending', constant(50000)),
      ]);
      const result = projectNetWorth({
        plan: p,
        initialNetWorth: 100000, // Starting positive
        startYear: 2025,
        endYear: 2027,
        investmentReturnRate: 0.10, // 10% return rate
      });
      // Year 1: 100000 * 1.10 (10% return) + 50000 (net cash flow) = 160000
      expect(result[0].investmentReturns).toBeCloseTo(10000, 0);
      expect(result[0].netWorth).toBeCloseTo(160000, 0);
      // Year 2: 160000 * 1.10 + 50000 = 226000
      expect(result[1].investmentReturns).toBeCloseTo(16000, 0);
      expect(result[1].netWorth).toBeCloseTo(226000, 0);
    });

    it('stops applying returns when net worth goes negative mid-simulation', () => {
      const p = plan(2025, [
        component('Salary', 'income', constant(30000)),
        component('Expenses', 'spending', constant(50000)),
      ]);
      const result = projectNetWorth({
        plan: p,
        initialNetWorth: 50000, // Starting positive
        startYear: 2025,
        endYear: 2028,
        investmentReturnRate: 0.10, // 10% return rate
      });
      // Year 1: 50000 * 1.10 + (-20000 net cash flow) = 35000
      expect(result[0].investmentReturns).toBeCloseTo(5000, 0);
      expect(result[0].netWorth).toBeCloseTo(35000, 0);
      // Year 2: 35000 * 1.10 + (-20000) = 18500
      expect(result[1].investmentReturns).toBeCloseTo(3500, 0);
      expect(result[1].netWorth).toBeCloseTo(18500, 0);
      // Year 3: 18500 * 1.10 + (-20000) = 20350 - 20000 = 350
      // Still positive, so returns are applied
      expect(result[2].investmentReturns).toBeCloseTo(1850, 0);
      expect(result[2].netWorth).toBeCloseTo(350, 0);
    });
  });
});
