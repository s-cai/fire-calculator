import { describe, it, expect } from 'vitest';
import { 
  totalByCategory, 
  netCashFlow, 
  aggregateByYear, 
  component, 
  plan 
} from './components';
import { constant, linear, ratio } from './timeseries';

describe('components', () => {
  describe('totalByCategory', () => {
    it('sums a single component correctly', () => {
      const p = plan(2025, [
        component('Salary', 'income', constant(100000)),
      ]);
      expect(totalByCategory(p, 'income', 2025)).toBe(100000);
      expect(totalByCategory(p, 'income', 2030)).toBe(100000);
    });

    it('sums multiple components in same category', () => {
      const p = plan(2025, [
        component('Salary', 'income', constant(100000)),
        component('Side hustle', 'income', constant(20000)),
        component('Dividends', 'income', constant(5000)),
      ]);
      expect(totalByCategory(p, 'income', 2025)).toBe(125000);
    });

    it('keeps categories independent', () => {
      const p = plan(2025, [
        component('Salary', 'income', constant(100000)),
        component('Rent', 'spending', constant(24000)),
        component('401k', 'investment', constant(20000)),
      ]);
      expect(totalByCategory(p, 'income', 2025)).toBe(100000);
      expect(totalByCategory(p, 'spending', 2025)).toBe(24000);
      expect(totalByCategory(p, 'investment', 2025)).toBe(20000);
    });

    it('returns 0 for empty plan', () => {
      const p = plan(2025, []);
      expect(totalByCategory(p, 'income', 2025)).toBe(0);
      expect(totalByCategory(p, 'spending', 2025)).toBe(0);
      expect(totalByCategory(p, 'investment', 2025)).toBe(0);
    });

    it('returns 0 when no components match category', () => {
      const p = plan(2025, [
        component('Salary', 'income', constant(100000)),
      ]);
      expect(totalByCategory(p, 'spending', 2025)).toBe(0);
    });

    it('evaluates time-varying series correctly', () => {
      const p = plan(2025, [
        component('Salary', 'income', ratio(100000, 0.03)),
      ]);
      expect(totalByCategory(p, 'income', 2025)).toBe(100000);
      expect(totalByCategory(p, 'income', 2026)).toBeCloseTo(103000, 0);
      expect(totalByCategory(p, 'income', 2027)).toBeCloseTo(106090, 0);
    });

    it('sums multiple time-varying components', () => {
      const p = plan(2025, [
        component('Salary', 'income', linear(80000, 2000)),
        component('Bonus', 'income', constant(10000)),
      ]);
      expect(totalByCategory(p, 'income', 2025)).toBe(90000);
      expect(totalByCategory(p, 'income', 2027)).toBe(94000); // 84000 + 10000
    });
  });

  describe('netCashFlow', () => {
    it('calculates income minus spending', () => {
      const p = plan(2025, [
        component('Salary', 'income', constant(100000)),
        component('Living expenses', 'spending', constant(60000)),
      ]);
      expect(netCashFlow(p, 2025)).toBe(40000);
    });

    it('returns negative when spending exceeds income', () => {
      const p = plan(2025, [
        component('Salary', 'income', constant(50000)),
        component('Living expenses', 'spending', constant(60000)),
      ]);
      expect(netCashFlow(p, 2025)).toBe(-10000);
    });

    it('ignores investment category', () => {
      const p = plan(2025, [
        component('Salary', 'income', constant(100000)),
        component('Living expenses', 'spending', constant(40000)),
        component('401k', 'investment', constant(30000)),
      ]);
      // Net cash flow is income - spending, not considering investments
      expect(netCashFlow(p, 2025)).toBe(60000);
    });

    it('returns 0 for empty plan', () => {
      const p = plan(2025, []);
      expect(netCashFlow(p, 2025)).toBe(0);
    });

    it('handles time-varying components', () => {
      const p = plan(2025, [
        component('Salary', 'income', linear(100000, 5000)),
        component('Expenses', 'spending', constant(60000)),
      ]);
      expect(netCashFlow(p, 2025)).toBe(40000);
      expect(netCashFlow(p, 2026)).toBe(45000);
      expect(netCashFlow(p, 2027)).toBe(50000);
    });
  });

  describe('aggregateByYear', () => {
    it('produces correct array length', () => {
      const p = plan(2025, [
        component('Salary', 'income', constant(100000)),
      ]);
      const result = aggregateByYear(p, 2025, 2030);
      expect(result).toHaveLength(5);
    });

    it('includes correct years', () => {
      const p = plan(2025, []);
      const result = aggregateByYear(p, 2025, 2028);
      expect(result.map(r => r.year)).toEqual([2025, 2026, 2027]);
    });

    it('returns empty array when startYear >= endYear', () => {
      const p = plan(2025, []);
      expect(aggregateByYear(p, 2025, 2025)).toEqual([]);
      expect(aggregateByYear(p, 2030, 2025)).toEqual([]);
    });

    it('calculates all fields correctly for each year', () => {
      const p = plan(2025, [
        component('Salary', 'income', linear(100000, 10000)),
        component('Expenses', 'spending', constant(50000)),
        component('401k', 'investment', constant(20000)),
      ]);
      
      const result = aggregateByYear(p, 2025, 2028);
      
      expect(result[0]).toEqual({
        year: 2025,
        income: 100000,
        spending: 50000,
        investment: 20000,
        netCashFlow: 50000,
      });
      
      expect(result[1]).toEqual({
        year: 2026,
        income: 110000,
        spending: 50000,
        investment: 20000,
        netCashFlow: 60000,
      });
      
      expect(result[2]).toEqual({
        year: 2027,
        income: 120000,
        spending: 50000,
        investment: 20000,
        netCashFlow: 70000,
      });
    });

    it('handles complex multi-component scenarios', () => {
      const p = plan(2025, [
        component('Primary job', 'income', ratio(120000, 0.03)),
        component('Spouse income', 'income', constant(60000)),
        component('Living expenses', 'spending', constant(80000)),
        component('Discretionary', 'spending', constant(20000)),
        component('401k', 'investment', constant(40000)),
        component('IRA', 'investment', constant(7000)),
      ]);
      
      const result = aggregateByYear(p, 2025, 2027);
      
      // Year 2025
      expect(result[0].income).toBe(180000); // 120000 + 60000
      expect(result[0].spending).toBe(100000); // 80000 + 20000
      expect(result[0].investment).toBe(47000); // 40000 + 7000
      expect(result[0].netCashFlow).toBe(80000); // 180000 - 100000
      
      // Year 2026 - primary job grew 3%
      expect(result[1].income).toBeCloseTo(183600, 0); // 123600 + 60000
    });
  });
});

