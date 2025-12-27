# Phase 5: Basic UI Implementation Plan

**Date:** 2025-12-27  
**Starting Point:** Commit `cb14748` (Phase 4 complete)  
**Branch:** main

## Context

We have a complete calculation engine (81 tests) but no user interface. Phase 5 introduces the first functional UI with the key principle of **real-time visual feedback** — users should see immediate confirmation of their inputs.

### Goals
1. Functional input form for financial plan parameters
2. Real-time projection table showing year-by-year results
3. Inline time series preview (mini-charts next to inputs)
4. Load example scenarios

### Non-Goals (deferred to later phases)
- Full chart visualizations (Phase 6)
- Advanced time series configuration UI (Phase 7)
- Mobile responsiveness (Phase 8)
- URL sharing UI (Phase 8)

---

## Code to Review

Before implementing, understand these files:

| File | Why |
|------|-----|
| `src/lib/timeseries.ts` | Types we need to render (ConstantSeries, etc.) |
| `src/lib/components.ts` | FinancialPlan, FinancialComponent types |
| `src/lib/projection.ts` | projectNetWorth() — the main calculation |
| `src/lib/examples.ts` | Pre-built scenarios to load |
| `src/main.ts` | Current entry point (placeholder) |
| `src/style.css` | Current styles |
| `index.html` | Current HTML structure |

---

## Plan of Change

### Step 1: Define UI State Model

Create a reactive state model that the UI will bind to.

**File:** `src/ui/state.ts`

```typescript
interface UIState {
  // Core plan parameters
  baseYear: number;
  projectionYears: number; // How many years to project
  initialNetWorth: number;
  investmentReturnRate: number;
  
  // Simplified inputs for MVP (single values, not full time series)
  annualIncome: number;
  incomeGrowthRate: number;
  annualSpending: number;
  annualInvestment: number;
  
  // Computed
  plan: FinancialPlan; // Built from the above
  projection: YearlyProjection[];
}
```

For MVP, we use simple numeric inputs. Advanced time series configuration comes in Phase 7.

---

### Step 2: Create Time Series Preview Component

A small inline chart showing time series values over ~10 years.

**File:** `src/ui/preview.ts`

```typescript
function renderTimeSeriesPreview(
  container: HTMLElement,
  series: TimeSeries,
  baseYear: number,
  years: number
): void
```

**Implementation:** Hand-rolled SVG (see Decision D3)

```typescript
function renderSparkline(values: number[]): string {
  const width = 100, height = 40;
  const max = Math.max(...values);
  const points = values.map((v, i) => 
    `${(i / (values.length - 1)) * width},${height - (v / max) * height}`
  ).join(' ');
  
  return `<svg width="${width}" height="${height}" class="sparkline">
    <polyline points="${points}" fill="none" stroke="currentColor" stroke-width="2"/>
  </svg>`;
}

Preview features:
- 100px × 40px mini-chart
- Shows values for years 0–10 (or projection range)
- Simple line chart connecting points
- Tooltip showing value on hover (optional for MVP)

---

### Step 3: Create Input Form

**File:** `src/ui/inputs.ts`

Form sections:

1. **Basic Parameters**
   - Base year (default: current year)
   - Initial net worth
   - Investment return rate (%)
   - Projection years

2. **Income** (with preview)
   - Annual income
   - Growth rate (%)
   - → Shows preview of income over time

3. **Spending** (with preview)
   - Annual spending
   - → Shows constant line preview

4. **Investments**
   - Annual investment contributions

5. **Examples**
   - Dropdown or buttons to load pre-built scenarios

Each numeric input triggers recalculation on change.

---

### Step 4: Create Results Display

**File:** `src/ui/results.ts`

1. **Summary section**
   - Final net worth (end of projection)
   - Total income over period
   - Total spending over period
   - Net savings rate

2. **Projection table**
   - Columns: Year, Income, Spending, Investment, Net Worth
   - Scrollable if many years
   - Highlight rows where net worth crosses milestones (optional)

---

### Step 5: Wire Everything Together

**File:** `src/main.ts`

```typescript
import { createState } from './ui/state';
import { renderForm } from './ui/inputs';
import { renderResults } from './ui/results';

const state = createState();

// Initial render
renderForm(document.getElementById('inputs'), state);
renderResults(document.getElementById('results'), state);

// Re-render on state changes
state.onChange(() => {
  renderResults(document.getElementById('results'), state);
});
```

---

### Step 6: Styling

**File:** `src/style.css`

Layout approach:
- Two-column layout: inputs on left, results on right
- Or stacked: inputs on top, results below
- Clean, minimal styling (not fancy yet — polish in Phase 8)

Key styles:
- Input groups with labels
- Preview charts inline with inputs
- Results table with alternating row colors
- Responsive basics (works on desktop, doesn't break on mobile)

---

## File Structure After Phase 5

```
src/
  lib/                    # Pure logic (unchanged)
    timeseries.ts
    components.ts
    projection.ts
    serialization.ts
    examples.ts
    *.test.ts
  ui/                     # New UI modules
    state.ts              # Reactive state management
    inputs.ts             # Form rendering
    results.ts            # Projection display
    preview.ts            # Time series mini-charts
  main.ts                 # Entry point (updated)
  style.css               # Styles (updated)
index.html                # Updated with layout
```

---

## Decisions

### D1: State Management → Plain Pub/Sub ✅

Simple pub/sub pattern with explicit `notify()` calls. No reactive library.
- Explicit, no magic, easy to debug
- Zero dependencies
- Can add signals later if complexity grows

### D2: Layout → Mobile-First with CSS Media Queries ✅

- Default: Stacked layout (inputs above results)
- Desktop (≥768px): Side-by-side layout via CSS media queries
- No JavaScript device detection needed

### D3: Time Series Preview → Hand-Rolled SVG ✅

~30 lines of code, no dependencies:
- Simple polyline SVG for sparklines
- 100px × 40px inline charts
- Full control over styling
- Can swap to library later if we need tooltips/animations

### D4: Example Loading → Button Grid ✅

All 4 examples visible as buttons:
- One-click to load
- More discoverable than dropdown
- Works well with small number of examples

### D5: Styling → Moderate ✅

Clean but not fancy:
- Good typography and spacing
- Readable table with alternating rows
- Consistent color scheme
- Polish comes in Phase 8

---

## Testing Plan

### Unit Tests
- `state.ts` — Test state updates, plan building logic
- `preview.ts` — Test SVG generation (if practical)

### Manual Testing
1. Load page, verify form renders
2. Change each input, verify projection updates
3. Load each example, verify values populate
4. Verify preview charts update in real-time
5. Test edge cases: 0 values, negative values, extreme growth rates

### Browser Testing
- Chrome (primary)
- Firefox
- Safari (if available)

---

## Rollback Strategy

If Phase 5 causes issues:
1. `git revert` the Phase 5 commits
2. Placeholder UI still works
3. All calculation logic is unchanged (separate modules)

The UI is isolated from the core logic, so rollback is clean.

---

## Estimated Effort

| Step | Estimate |
|------|----------|
| Step 1: State model | 30 min |
| Step 2: Preview component | 1 hour |
| Step 3: Input form | 1 hour |
| Step 4: Results display | 45 min |
| Step 5: Wire together | 30 min |
| Step 6: Styling | 1 hour |
| Testing & polish | 1 hour |
| **Total** | **~6 hours** |

---

## Decision Summary

| Question | Decision |
|----------|----------|
| State management | Plain pub/sub |
| Layout | Mobile-first, CSS media queries |
| Preview charts | Hand-rolled SVG sparklines |
| Example loading | Button grid |
| Styling | Moderate (clean, readable) |

**Ready for implementation.**

