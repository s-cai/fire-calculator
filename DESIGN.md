# Financial Planner — Design Overview

This document summarizes the internal architecture for design review.

> **Note:** FIRE-specific logic (4% rule, FIRE number calculations) is deferred. 
> Current focus is on a general-purpose financial projection tool.

---

## Documentation Strategy

This project maintains several documentation files:

| File | Purpose | Update When |
|------|---------|-------------|
| `README.md` | Current status, setup, feature summary | Status changes |
| `DESIGN.md` | Architecture, types, data flow | Code structure changes |
| `ROADMAP.md` | Implementation phases, task tracking | Completing phases |

**Keeping in sync:** When making changes:
1. Code changes → update `DESIGN.md` if types/architecture change
2. Phase completion → update `ROADMAP.md` checkboxes and `README.md` status
3. Major pivots → update all three

---

## Module Structure

```
src/lib/
  timeseries.ts    # Time-varying value patterns
  components.ts    # Financial components and plans
  projection.ts    # Net worth simulation engine
```

All modules are pure TypeScript with no DOM dependencies, enabling 100% unit test coverage.

---

## Layer 1: Time Series (`timeseries.ts`)

**Purpose:** Model values that change over time.

### Types

```typescript
type TimeSeries = 
  | ConstantSeries      // Fixed value: $80k/year
  | LinearGrowthSeries  // Start + increment: $80k + $2k/year
  | RatioGrowthSeries   // Compound growth: $80k × 1.03^year
  | CompositeSeries     // Multiple intervals concatenated
```

### Key Types Detail

| Type | Fields | Behavior |
|------|--------|----------|
| `ConstantSeries` | `value` | Returns same value for all years |
| `LinearGrowthSeries` | `startValue`, `yearlyIncrement` | `start + elapsed × increment` |
| `RatioGrowthSeries` | `startValue`, `yearlyGrowthRate` | `start × (1 + rate)^elapsed` |
| `CompositeSeries` | `segments[]` | Each segment has `{series, startYear, endYear}` |

### Core Operation

```typescript
evaluate(series: TimeSeries, year: number, baseYear: number): number
```

- `baseYear` is "year 0" for growth calculations
- For composite series, each segment uses its own `startYear` as the base
- Returns `0` for years outside any segment (gaps)

### Helper Constructors

```typescript
constant(80000)                    // ConstantSeries
linear(80000, 2000)                // LinearGrowthSeries  
ratio(80000, 0.03)                 // RatioGrowthSeries
composite([...segments])           // CompositeSeries
```

---

## Layer 2: Financial Components (`components.ts`)

**Purpose:** Group named financial items by category.

### Types

```typescript
type ComponentCategory = 'income' | 'spending';

interface FinancialComponent {
  name: string;              // "Primary salary", "Rent", "401k"
  category: ComponentCategory;
  series: TimeSeries;        // How this component varies over time
}

interface FinancialPlan {
  components: FinancialComponent[];
  baseYear: number;          // "Year 0" for all series evaluation
}
```

### Core Operations

```typescript
// Sum all components of a category for a given year
totalByCategory(plan, category, year): number

// Income - Spending
netCashFlow(plan, year): number

// Year-by-year breakdown for a range
aggregateByYear(plan, startYear, endYear): YearlyBreakdown[]
```

### Data Flow

```
FinancialPlan
    │
    ├── component("Salary", income, ratio(100k, 0.03))
    ├── component("Side gig", income, constant(20k))
    ├── component("Rent", spending, constant(24k))
    └── component("Food", spending, linear(12k, 500))
    
         │
         ▼
    
totalByCategory(plan, 'income', 2027)  →  127,273
totalByCategory(plan, 'spending', 2027) →  37,500
netCashFlow(plan, 2027)                 →  89,773
```

---

## Layer 3: Projection Engine (`projection.ts`)

**Purpose:** Simulate net worth growth over time.

### Types

```typescript
interface ProjectionParams {
  plan: FinancialPlan;
  initialNetWorth: number;
  startYear: number;
  endYear: number;           // inclusive
  investmentReturnRate: number; // e.g., 0.07 for 7%
}

interface YearlyProjection {
  year: number;
  income: number;
  spending: number;
  netWorth: number;
}
```

### Core Operation

```typescript
projectNetWorth(params): YearlyProjection[]
```

### Simulation Logic (per year)

```
1. income     = totalByCategory(plan, 'income', year)
2. spending   = totalByCategory(plan, 'spending', year)

3. afterReturns = previousNetWorth × (1 + returnRate)
4. netCashFlow   = income - spending
5. netWorth      = afterReturns + netCashFlow
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Inputs                              │
│  (income, spending, return rate, etc.)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     TimeSeries Layer                             │
│                                                                  │
│  constant(80000)  linear(80k, 2k)  ratio(80k, 0.03)  composite  │
│                                                                  │
│  evaluate(series, year, baseYear) → number                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Components Layer                               │
│                                                                  │
│  FinancialComponent = { name, category, series }                │
│  FinancialPlan = { components[], baseYear }                     │
│                                                                  │
│  totalByCategory()  netCashFlow()  aggregateByYear()            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Projection Layer                               │
│                                                                  │
│  ProjectionParams → projectNetWorth() → YearlyProjection[]      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UI Layer (TODO)                             │
│                                                                  │
│  Input forms → Real-time preview → Results table → Charts       │
└─────────────────────────────────────────────────────────────────┘
```

---

## UI Design Principles

### Real-Time Visual Feedback

**Critical requirement:** When users configure time series inputs, they should see immediate visual feedback confirming what they entered.

Example: When configuring a salary with 3% annual growth:
- User enters: start=$80,000, growth=3%
- UI shows: A small inline chart plotting values for years 0-10
- User instantly sees: $80k → $82.4k → $84.9k → ... → $107.5k

This applies to:
- Individual time series (show mini-chart next to input)
- Composite series (show full timeline with segment transitions)
- Category totals (show aggregated preview)

**Why this matters:**
- Time series are abstract — visualization makes them concrete
- Catches input errors immediately (e.g., wrong growth rate sign)
- Builds user confidence in the tool

---

## Serialization Strategy

### Goals

1. **Save/Load** — Export plan as JSON, import later
2. **URL Sharing** — Encode plan in URL for easy sharing
3. **Examples** — Pre-built scenarios as importable data

### Approach

The types (`FinancialPlan`, `TimeSeries`, etc.) are already JSON-serializable:

```typescript
// Serialize
const json = JSON.stringify(plan);

// Deserialize
const restored = JSON.parse(json) as FinancialPlan;
```

### URL Encoding

URL sharing uses the same JSON, but compressed:

```typescript
// Encode for URL
const compressed = lzstring.compressToEncodedURIComponent(json);
const url = `https://example.com/?plan=${compressed}`;

// Decode from URL
const json = lzstring.decompressFromEncodedURIComponent(urlParam);
const plan = JSON.parse(json);
```

**Shared logic:**
- `serialize(plan): string` — JSON.stringify with optional formatting
- `deserialize(json): FinancialPlan` — JSON.parse + validation
- `encodeForURL(plan): string` — serialize + compress
- `decodeFromURL(param): FinancialPlan` — decompress + deserialize

Using a library like `lz-string` keeps URLs reasonably short (~200-500 chars for typical plans).

---

## Design Decisions

### 1. Why separate TimeSeries from Components?

**Reusability.** TimeSeries is a generic "value over time" primitive. It could model:
- Salary growth
- Inflation rates  
- Tax brackets
- Any time-varying quantity

Components add the financial semantics (income/spending/investment).

### 2. Why is `baseYear` on the Plan, not each Component?

**Simplicity.** All components in a plan share the same timeline. The plan's `baseYear` is typically the current year (2025). Growth series calculate elapsed years from this base.

Composite series override this by using each segment's `startYear` as the local base.

### 3. Why is investment separate from income/spending?

**Clarity.** The simulation treats investment contributions as money that:
1. Gets added to the investment pool
2. Earns returns
3. Is **not** part of "cash on hand"

Net cash flow = income - spending (what's left over after bills)
Investment contributions come out of this surplus.

---

## Test Coverage

| Module | Tests | Coverage |
|--------|-------|----------|
| `timeseries.ts` | 23 | 100% |
| `components.ts` | 17 | 100% |
| `projection.ts` | 10 | 100% |
| **Total** | **50** | **100%** |

---

## Deferred Features

The following are explicitly out of scope for now:

1. **FIRE calculations** — 4% rule, FIRE number, years-to-FIRE detection
2. **Inflation modeling** — Users can model via ratio growth if needed
3. **Tax calculations** — Users model after-tax values
4. **Multiple return rates** — Single global rate for now
5. **Monthly granularity** — Annual projections only

These may be added in future phases.

---

## Open Questions

1. **Inflation handling:** Should we add explicit inflation support, or is ratio growth sufficient?

2. **Tax modeling:** Is after-tax input sufficient, or do users need gross → net calculations?

3. **Investment returns timing:** Currently year-end. Monthly compounding needed?

4. **Validation depth:** How strict should schema validation be? Warn vs. reject?
