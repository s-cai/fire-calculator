import { describe, it, expect } from 'vitest';
import {
  serialize,
  deserialize,
  encodeForURL,
  decodeFromURL,
  validateTimeSeries,
  validatePlan,
  ValidationError,
} from './serialization';
import { constant, linear, ratio, composite } from './timeseries';
import { component, plan } from './components';

describe('serialization', () => {
  describe('validateTimeSeries', () => {
    it('validates constant series', () => {
      const data = { type: 'constant', value: 80000 };
      expect(validateTimeSeries(data)).toEqual({ type: 'constant', value: 80000 });
    });

    it('validates linear series', () => {
      const data = { type: 'linear', startValue: 80000, yearlyIncrement: 2000 };
      expect(validateTimeSeries(data)).toEqual({ type: 'linear', startValue: 80000, yearlyIncrement: 2000 });
    });

    it('validates ratio series', () => {
      const data = { type: 'ratio', startValue: 80000, yearlyGrowthRate: 0.03 };
      expect(validateTimeSeries(data)).toEqual({ type: 'ratio', startValue: 80000, yearlyGrowthRate: 0.03 });
    });

    it('validates composite series', () => {
      const data = {
        type: 'composite',
        segments: [
          { series: { type: 'constant', value: 80000 }, startYear: 2025, endYear: 2030 },
          { series: { type: 'constant', value: 120000 }, startYear: 2030, endYear: 2040 },
        ],
      };
      const result = validateTimeSeries(data);
      expect(result.type).toBe('composite');
      expect((result as any).segments).toHaveLength(2);
    });

    it('rejects unknown series type', () => {
      const data = { type: 'unknown', value: 123 };
      expect(() => validateTimeSeries(data)).toThrow(ValidationError);
      expect(() => validateTimeSeries(data)).toThrow('unknown series type');
    });

    it('rejects missing required fields', () => {
      expect(() => validateTimeSeries({ type: 'constant' })).toThrow('value must be a number');
      expect(() => validateTimeSeries({ type: 'linear', startValue: 100 })).toThrow('yearlyIncrement must be a number');
      expect(() => validateTimeSeries({ type: 'ratio', startValue: 100 })).toThrow('yearlyGrowthRate must be a number');
    });

    it('rejects non-object input', () => {
      expect(() => validateTimeSeries(null)).toThrow('expected object');
      expect(() => validateTimeSeries('string')).toThrow('expected object');
      expect(() => validateTimeSeries(123)).toThrow('expected object');
    });
  });

  describe('validatePlan', () => {
    it('validates a complete plan', () => {
      const data = {
        baseYear: 2025,
        components: [
          { name: 'Salary', category: 'income', series: { type: 'constant', value: 100000 } },
          { name: 'Rent', category: 'spending', series: { type: 'constant', value: 24000 } },
        ],
      };
      const result = validatePlan(data);
      expect(result.baseYear).toBe(2025);
      expect(result.components).toHaveLength(2);
    });

    it('validates empty components array', () => {
      const data = { baseYear: 2025, components: [] };
      const result = validatePlan(data);
      expect(result.components).toEqual([]);
    });

    it('rejects invalid category', () => {
      const data = {
        baseYear: 2025,
        components: [{ name: 'Test', category: 'invalid', series: { type: 'constant', value: 100 } }],
      };
      expect(() => validatePlan(data)).toThrow('category must be one of');
    });

    it('rejects missing baseYear', () => {
      const data = { components: [] };
      expect(() => validatePlan(data)).toThrow('baseYear must be a number');
    });

    it('rejects non-array components', () => {
      const data = { baseYear: 2025, components: 'not an array' };
      expect(() => validatePlan(data)).toThrow('components must be an array');
    });

    it('includes path in error message', () => {
      const data = {
        baseYear: 2025,
        components: [{ name: 'Test', category: 'income', series: { type: 'constant' } }],
      };
      try {
        validatePlan(data);
        expect.fail('should have thrown');
      } catch (e) {
        expect((e as ValidationError).message).toContain('plan.components[0].series.value');
      }
    });
  });

  describe('serialize / deserialize', () => {
    it('round-trips a simple plan', () => {
      const p = plan(2025, [
        component('Salary', 'income', constant(100000)),
        component('Rent', 'spending', constant(24000)),
      ]);
      
      const json = serialize(p);
      const restored = deserialize(json);
      
      expect(restored).toEqual(p);
    });

    it('round-trips a complex plan', () => {
      const p = plan(2025, [
        component('Salary', 'income', ratio(100000, 0.03)),
        component('Side gig', 'income', linear(10000, 1000)),
        component('Rent', 'spending', constant(24000)),
        component('Career', 'income', composite([
          { series: constant(80000), startYear: 2025, endYear: 2030 },
          { series: ratio(120000, 0.05), startYear: 2030, endYear: 2040 },
        ])),
        component('401k', 'investment', constant(20000)),
      ]);
      
      const json = serialize(p);
      const restored = deserialize(json);
      
      expect(restored).toEqual(p);
    });

    it('throws on invalid JSON', () => {
      expect(() => deserialize('not json')).toThrow(ValidationError);
      expect(() => deserialize('not json')).toThrow('invalid JSON');
    });

    it('throws on valid JSON but invalid plan', () => {
      expect(() => deserialize('{"foo": "bar"}')).toThrow(ValidationError);
    });
  });

  describe('encodeForURL / decodeFromURL', () => {
    it('round-trips a plan through URL encoding', () => {
      const p = plan(2025, [
        component('Salary', 'income', ratio(100000, 0.03)),
        component('Rent', 'spending', constant(24000)),
        component('401k', 'investment', constant(20000)),
      ]);
      
      const encoded = encodeForURL(p);
      const decoded = decodeFromURL(encoded);
      
      expect(decoded).toEqual(p);
    });

    it('produces URL-safe output', () => {
      const p = plan(2025, [
        component('Test with spaces & special chars!', 'income', constant(100)),
      ]);
      
      const encoded = encodeForURL(p);
      
      // Should only contain URL-safe characters
      expect(encoded).toMatch(/^[A-Za-z0-9+/=-]*$/);
    });

    it('compresses output to reasonable size', () => {
      const p = plan(2025, [
        component('Salary', 'income', ratio(100000, 0.03)),
        component('Bonus', 'income', constant(10000)),
        component('Rent', 'spending', constant(24000)),
        component('Food', 'spending', constant(12000)),
        component('Utilities', 'spending', constant(3000)),
        component('401k', 'investment', constant(20000)),
        component('IRA', 'investment', constant(7000)),
      ]);
      
      const json = serialize(p);
      const encoded = encodeForURL(p);
      
      // Encoded should be shorter than raw JSON (compression working)
      expect(encoded.length).toBeLessThan(json.length);
      // And reasonably short for a URL
      expect(encoded.length).toBeLessThan(500);
    });

    it('throws on invalid encoded data', () => {
      expect(() => decodeFromURL('not-valid-encoded-data')).toThrow(ValidationError);
    });
  });
});

