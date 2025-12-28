/**
 * Test file to verify pre-commit hook catches unused imports
 */

import { FinancialPlan } from './lib/components';
import { TimeSeries } from './lib/timeseries'; // This import is unused

export function testFunction(): void {
  // Only using FinancialPlan, not TimeSeries
  const plan: FinancialPlan = {
    baseYear: 2025,
    components: [],
  };
  console.log(plan);
}

