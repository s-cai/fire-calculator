# Financial Planner — Implementation Roadmap

**Created:** 2025-12-27  
**Starting Point:** Initial Vite + TypeScript setup (placeholder UI only)

> **Note:** FIRE-specific features (4% rule, FIRE number) are deferred. Focus is on general financial planning.

## Context

This tool needs to go from an empty scaffold to a fully functional financial projection tool. The key insight is that the **time series calculation engine** is the heart of the application — it enables flexible modeling of income, spending, and investments over time.

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

## Phase 2: Financial Components ✅

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

## Phase 3: Projection Engine ✅

**Goal:** Simulate net worth over time

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
}

function projectNetWorth(params: ProjectionParams): YearlyProjection[]
```

### Logic
Each year:
1. Calculate income, spending, investment contributions
2. Net cash flow = income - spending - investment contributions
3. Net worth grows: `(previousNetWorth + investmentContributions) * (1 + returnRate) + netCashFlow`

### Test Cases
- Zero everything → net worth stays at initial
- Pure savings (0% return) → linear growth
- Pure returns (no contributions) → compound growth
- Handle negative cash flow (spending > income)
- Handle negative net worth scenarios

### Acceptance Criteria
- Financial simulation is mathematically correct
- 100% test coverage on `projection.ts`

---

## Phase 4: Data Model & Serialization ✅

**Goal:** Define schema, enable save/load, create example scenarios

### Files
```
src/lib/
  schema.ts          # JSON schema validation
  examples.ts        # Pre-built example scenarios
```

### Tasks
- [x] Define JSON-serializable format for `FinancialPlan`
- [x] Create validation function for imported data
- [x] URL encoding with compression (lz-string)
- [x] Build 4 example scenarios:
  - High savings rate professional
  - Dual income household
  - Career change mid-life
  - Variable income with major expenses

### Acceptance Criteria
- Plans can be serialized to JSON and back
- Invalid data is rejected with clear errors
- Example scenarios load correctly

---

## Phase 5: Basic UI ✅

**Goal:** Functional input forms with real-time visual feedback

### Key Principle: Real-Time Visual Feedback

When users configure time series inputs, they must see immediate visual confirmation. For example:
- User enters: salary $80k, growth 3%
- UI shows: mini-chart of $80k → $82.4k → $84.9k → ... next to the input
- User instantly confirms their input is correct

### Files
```
src/
  ui/
    state.ts         # Reactive state management
    inputs.ts        # Form generation and binding
    results.ts       # Display projection table
    preview.ts       # Time series mini-charts
  main.ts            # Wire everything together
  style.css          # Styling
```

### MVP Interface
1. **Input section:**
   - Current net worth
   - Annual income (with time series preview)
   - Annual spending (with time series preview)
   - Annual investment contributions
   - Expected return rate
   - Projection years (start/end)

2. **Results section:**
   - Summary cards with key metrics
   - Bar chart for net worth growth
   - Table: year-by-year projection

### Acceptance Criteria
- Form inputs update projection in real-time ✅
- Each time series input shows inline preview chart ✅
- Table displays correctly ✅
- Works on desktop browsers ✅

---

## Phase 6: Advanced UI — Time Series Inputs

**Goal:** Allow users to configure time-varying inputs with full control

### Features
- Switch input between "constant", "linear growth", and "percentage growth"
- Composite series: add multiple time segments
- Multi-component inputs: add/remove named components per category
- Full access to all time series types from the engine

### Files
```
src/ui/
  state.ts              # Updated with UIComponent model
  inputs.ts             # Refactored for dynamic components
  component-editor.ts   # NEW: Single component editor
  category-section.ts   # NEW: Category with component list
```

### Acceptance Criteria
- Users can model career progression (salary growth)
- Users can model life events (college tuition, retirement income changes)
- Users can add multiple income sources, spending categories
- Complex scenarios from README examples are achievable
- Real-time preview updates for all series types

---

## Phase 7: Visualization ✅

**Goal:** Add charts for visual understanding

### Tasks
- [x] Add Chart.js library
- [x] Net worth over time — line chart with gradient fill
- [x] Income vs. spending over time — dual line chart
- [x] Responsive layout (side-by-side on large screens)

### Acceptance Criteria
- Charts render correctly ✅
- Charts update when inputs change ✅
- Responsive on different screen sizes ✅

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

## Deferred Features

The following are explicitly out of scope for the initial version:

- **FIRE calculations** — 4% rule, FIRE number, years-to-FIRE detection
- **Inflation modeling** — Users can model via ratio growth if needed
- **Tax calculations** — Users input after-tax values
- **Multiple return rates** — Single global rate for now
- **Monthly granularity** — Annual projections only

These may be added in a future "FIRE Features" phase.

---

## Next Steps

1. ~~Phase 0: Add Vitest~~ ✅
2. ~~Phase 1: Time Series Engine~~ ✅
3. ~~Phase 2: Financial Components~~ ✅
4. ~~Phase 3: Projection Engine~~ ✅
5. ~~Phase 4: Serialization~~ ✅
6. ~~Phase 5: Basic UI~~ ✅
7. ~~Phase 6: Advanced Time Series UI~~ ✅
8. ~~Phase 7: Visualization~~ ✅
9. **Next: Phase 8 (Polish & Examples Gallery)** — Final polish and showcase
   - Progressive disclosure (simple vs. advanced mode)
   - Mobile responsive design
   - Keyboard accessibility
   - URL sharing

