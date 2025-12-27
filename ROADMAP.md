# FIRE Calculator — Implementation Roadmap

**Created:** 2025-12-27  
**Starting Point:** Initial Vite + TypeScript setup (placeholder UI only)

## Context

The FIRE Calculator needs to go from an empty scaffold to a fully functional financial projection tool. The key insight is that the **time series calculation engine** is the heart of the application — it enables flexible modeling of income, spending, and investments over time.

This plan prioritizes:
1. **Testable core logic first** — pure TypeScript, no DOM dependencies
2. **Math correctness before UI** — TDD approach for financial calculations
3. **Incremental complexity** — each phase builds on the previous

## Phase 0: Testing Infrastructure ✅

**Goal:** Set up unit testing before writing any business logic

### Tasks
- [x] Add Vitest as dev dependency
- [x] Add `test` script to `package.json`
- [x] Create `src/lib/` directory for pure logic modules
- [x] Verify test runner with a trivial test

### Commands
```bash
npm install -D vitest
```

### Acceptance Criteria
- `npm test` runs and passes

---

## Phase 1: Time Series Engine ✅

**Goal:** Build the mathematical foundation for time-varying inputs

### Files
```
src/lib/
  timeseries.ts      # Core types and evaluation
  timeseries.test.ts # Unit tests
```

### Types

```typescript
// Fixed value throughout
interface ConstantSeries {
  type: 'constant';
  value: number;
}

// Start + fixed yearly increment
interface LinearGrowthSeries {
  type: 'linear';
  startValue: number;
  yearlyIncrement: number;
}

// Start + percentage growth (compounds)
interface RatioGrowthSeries {
  type: 'ratio';
  startValue: number;
  yearlyGrowthRate: number; // e.g., 0.03 for 3%
}

// Multiple intervals concatenated
interface CompositeSeries {
  type: 'composite';
  segments: Array<{
    series: TimeSeries;
    startYear: number;
    endYear: number; // exclusive
  }>;
}

type TimeSeries = ConstantSeries | LinearGrowthSeries | RatioGrowthSeries | CompositeSeries;
```

### Core Function

```typescript
function evaluate(series: TimeSeries, year: number, baseYear: number): number
```

- `baseYear` is when the series "starts" (year 0 for growth calculations)
- Returns the value of the series at the given year

### Test Cases
- Constant: returns same value for year 0, 10, 100
- Linear: `startValue + (year - baseYear) * increment`
- Ratio: `startValue * (1 + rate)^(year - baseYear)`
- Composite: selects correct segment, returns 0 for gaps
- Edge cases: negative years, empty composite

### Acceptance Criteria
- All time series types evaluate correctly
- 100% test coverage on `timeseries.ts`

---

## Phase 2: Financial Components

**Goal:** Multi-component income/spending/investment modeling

### Files
```
src/lib/
  components.ts      # Named financial components
  components.test.ts
```

### Types

```typescript
type ComponentCategory = 'income' | 'spending' | 'investment';

interface FinancialComponent {
  name: string;
  category: ComponentCategory;
  series: TimeSeries;
}

interface FinancialPlan {
  components: FinancialComponent[];
  baseYear: number; // The "year 0" for all series
}
```

### Core Functions

```typescript
// Sum all components of a category for a given year
function totalByCategory(plan: FinancialPlan, category: ComponentCategory, year: number): number

// Income - Spending for a given year
function netCashFlow(plan: FinancialPlan, year: number): number

// Get yearly breakdown for a range
function aggregateByYear(
  plan: FinancialPlan, 
  startYear: number, 
  endYear: number
): YearlyBreakdown[]
```

### Test Cases
- Single component per category sums correctly
- Multiple components in same category aggregate
- Categories are independent (income doesn't affect spending total)
- Empty plan returns zeros
- Year range produces correct array length

### Acceptance Criteria
- Aggregation logic is correct
- 100% test coverage on `components.ts`

---

## Phase 3: Projection Engine

**Goal:** Simulate net worth over time, detect FIRE milestone

### Files
```
src/lib/
  projection.ts
  projection.test.ts
```

### Core Function

```typescript
interface ProjectionParams {
  plan: FinancialPlan;
  initialNetWorth: number;
  startYear: number;
  endYear: number;
  investmentReturnRate: number; // e.g., 0.07 for 7%
}

interface YearlyProjection {
  year: number;
  income: number;
  spending: number;
  investment: number; // contributions
  netWorth: number;
  fireProgress: number; // percentage toward FIRE number
  isFIRE: boolean; // true if netWorth >= spending * 25
}

function projectNetWorth(params: ProjectionParams): YearlyProjection[]
```

### Logic
Each year:
1. Calculate income, spending, investment contributions
2. Net cash flow = income - spending - investment contributions
3. Net worth grows: `(previousNetWorth + investmentContributions) * (1 + returnRate) + netCashFlow`
4. FIRE number = annual spending × 25 (4% rule)
5. Mark `isFIRE = true` when net worth exceeds FIRE number

### Test Cases
- Zero everything → net worth stays at initial
- Pure savings (0% return) → linear growth
- Pure returns (no contributions) → compound growth
- Detect FIRE year correctly
- Handle negative cash flow (spending > income)
- Handle negative net worth scenarios

### Acceptance Criteria
- Financial simulation is mathematically correct
- FIRE detection works for various scenarios
- 100% test coverage on `projection.ts`

---

## Phase 4: Data Model & Serialization

**Goal:** Define schema, enable save/load, create example scenarios

### Files
```
src/lib/
  schema.ts          # JSON schema validation
  examples.ts        # Pre-built example scenarios
```

### Tasks
- [ ] Define JSON-serializable format for `FinancialPlan`
- [ ] Create validation function for imported data
- [ ] Build 3-4 example scenarios:
  - Traditional FIRE (high savings rate)
  - Coast FIRE (front-load then coast)
  - Dual income household
  - Single income with career change

### Acceptance Criteria
- Plans can be serialized to JSON and back
- Invalid data is rejected with clear errors
- Example scenarios load correctly

---

## Phase 5: Basic UI

**Goal:** Functional input forms and results display (no charts)

### Files
```
src/
  ui/
    inputs.ts        # Form generation and binding
    results.ts       # Display projection table
  main.ts            # Wire everything together
  style.css          # Styling
```

### MVP Interface
1. **Simple inputs section:**
   - Current age
   - Target retirement age
   - Current net worth
   - Annual income (single value for now)
   - Annual spending
   - Annual investment contributions
   - Expected return rate

2. **Results section:**
   - Summary: FIRE age, years to FIRE
   - Table: year-by-year projection
   - Highlight the FIRE year row

### Acceptance Criteria
- Form inputs update projection in real-time
- Table displays correctly
- Works on desktop browsers

---

## Phase 6: Visualization

**Goal:** Add charts for visual understanding

### Tasks
- [ ] Add Chart.js (or alternative)
- [ ] Net worth over time — line chart
- [ ] Income vs. spending — stacked area or dual line
- [ ] FIRE progress — percentage indicator or gauge

### Acceptance Criteria
- Charts render correctly
- Charts update when inputs change
- Responsive on different screen sizes

---

## Phase 7: Advanced UI — Time Series Inputs

**Goal:** Allow users to configure time-varying inputs

### Features
- Switch input between "constant" and "varies over time"
- For varying inputs, configure growth type (linear/ratio)
- Composite series: add multiple time segments
- Multi-component inputs: add/remove named components

### Acceptance Criteria
- Users can model career progression (salary growth)
- Users can model life events (college tuition, retirement income changes)
- Complex scenarios from README examples are achievable

---

## Phase 8: Polish & Examples Gallery

**Goal:** Final polish and showcase

### Features
- Progressive disclosure: simple mode vs. advanced mode toggle
- Example gallery with "Load Example" buttons
- Mobile responsive design
- Keyboard accessibility
- URL sharing (encode plan in URL params or hash)

### Acceptance Criteria
- First-time users can get a result in under 30 seconds
- Power users can configure complex scenarios
- Examples demonstrate the tool's capabilities

---

## Testing Strategy Summary

| Module | Type | Coverage Goal |
|--------|------|---------------|
| `timeseries.ts` | Unit | 100% |
| `components.ts` | Unit | 100% |
| `projection.ts` | Unit | 100% |
| `schema.ts` | Unit | 100% |
| UI modules | Manual / E2E (later) | Best effort |

---

## Rollback Strategy

Each phase produces working code. If a phase causes problems:
1. Revert to the commit before the phase started
2. Re-evaluate the approach
3. Create a new plan if the design needs to change

---

## Next Steps

1. Begin Phase 0: Add Vitest
2. Begin Phase 1: Implement `timeseries.ts` with TDD

