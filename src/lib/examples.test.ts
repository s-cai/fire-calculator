import { describe, it, expect } from 'vitest';
import { 
  allExamples, 
  getExample,
  highSaverProfessional,
  dualIncomeHousehold,
  careerChange,
  variableIncome,
} from './examples';
import { validatePlan } from './serialization';
import { projectNetWorth } from './projection';

describe('examples', () => {
  describe('allExamples', () => {
    it('contains all example scenarios', () => {
      expect(allExamples).toHaveLength(4);
      expect(allExamples.map(e => e.id)).toEqual([
        'high-saver',
        'dual-income',
        'career-change',
        'variable-income',
      ]);
    });

    it('all examples have required fields', () => {
      for (const example of allExamples) {
        expect(example.id).toBeTruthy();
        expect(example.name).toBeTruthy();
        expect(example.description).toBeTruthy();
        expect(example.plan).toBeTruthy();
      }
    });

    it('all example plans are valid', () => {
      for (const example of allExamples) {
        // Should not throw
        const validated = validatePlan(example.plan);
        expect(validated.baseYear).toBe(example.plan.baseYear);
        expect(validated.components.length).toBe(example.plan.components.length);
      }
    });

    it('all example plans can be projected', () => {
      for (const example of allExamples) {
        const result = projectNetWorth({
          plan: example.plan,
          initialNetWorth: 50000,
          startYear: 2025,
          endYear: 2035,
          investmentReturnRate: 0.07,
        });
        
        expect(result).toHaveLength(10);
        expect(result[0].year).toBe(2025);
        expect(typeof result[0].netWorth).toBe('number');
      }
    });
  });

  describe('getExample', () => {
    it('returns example by id', () => {
      expect(getExample('high-saver')).toBe(highSaverProfessional);
      expect(getExample('dual-income')).toBe(dualIncomeHousehold);
      expect(getExample('career-change')).toBe(careerChange);
      expect(getExample('variable-income')).toBe(variableIncome);
    });

    it('returns undefined for unknown id', () => {
      expect(getExample('unknown')).toBeUndefined();
    });
  });

  describe('individual examples', () => {
    it('highSaverProfessional has positive net worth growth', () => {
      const result = projectNetWorth({
        plan: highSaverProfessional.plan,
        initialNetWorth: 100000,
        startYear: 2025,
        endYear: 2035,
        investmentReturnRate: 0.07,
      });
      
      // Should accumulate significant wealth
      expect(result[9].netWorth).toBeGreaterThan(500000);
    });

    it('dualIncomeHousehold handles childcare ending', () => {
      const result = projectNetWorth({
        plan: dualIncomeHousehold.plan,
        initialNetWorth: 50000,
        startYear: 2025,
        endYear: 2032,
        investmentReturnRate: 0.07,
      });
      
      // Childcare costs end in 2030
      expect(result[4].spending).toBeGreaterThan(result[5].spending); // 2029 vs 2030
    });

    it('careerChange shows income dip during transition', () => {
      const result = projectNetWorth({
        plan: careerChange.plan,
        initialNetWorth: 200000,
        startYear: 2025,
        endYear: 2035,
        investmentReturnRate: 0.07,
      });
      
      // Gap year (2030) should have lowest income
      const gapYearIncome = result[5].income; // 2030
      const beforeIncome = result[4].income; // 2029
      const afterIncome = result[6].income; // 2031
      
      expect(gapYearIncome).toBeLessThan(beforeIncome);
      expect(gapYearIncome).toBeLessThan(afterIncome);
    });

    it('variableIncome handles major expenses', () => {
      const result = projectNetWorth({
        plan: variableIncome.plan,
        initialNetWorth: 100000,
        startYear: 2025,
        endYear: 2040,
        investmentReturnRate: 0.07,
      });
      
      // Home purchase year (2027) should have higher spending
      expect(result[2].spending).toBeGreaterThan(result[1].spending);
      
      // College years (2035-2038) should have higher spending
      expect(result[10].spending).toBeGreaterThan(result[9].spending);
    });
  });
});

