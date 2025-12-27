# Phase 7: Visualization

**Created:** 2025-12-27  
**Starting Point:** Phase 6 complete (Advanced Time Series UI)

---

## Context

The current UI has a basic bar chart for net worth growth, but users need richer visualization:
- Proper line charts showing trends over time
- Income vs. spending comparison
- Better visual understanding of financial trajectory

---

## Code to Review

Before implementing, understand these files:

1. `src/ui/results.ts` — Current rendering logic, including basic bar chart
2. `src/lib/projection.ts` — `YearlyProjection` interface with data to visualize
3. `src/style.css` — Current chart styling
4. `src/ui/preview.ts` — Existing sparkline implementation (SVG-based)

---

## Library Choice: Chart.js

**Why Chart.js:**
- Well-established, widely used (~60k GitHub stars)
- Reasonable bundle size (~60KB minified+gzipped)
- Simple API for common chart types
- Built-in responsiveness and animations
- Good TypeScript support

**Alternative considered:**
- **uPlot** — Much smaller (~40KB) but less polished UI
- **Recharts** — React-specific, we're vanilla TS
- **D3.js** — Overkill for our needs, steep learning curve

---

## Plan of Change

### Step 1: Install Chart.js

```bash
npm install chart.js
```

### Step 2: Create Chart Utility Module

Create `src/ui/charts.ts` with:

```typescript
import { Chart, registerables } from 'chart.js';

// Register all Chart.js components
Chart.register(...registerables);

// Net worth line chart
export function createNetWorthChart(
  canvas: HTMLCanvasElement,
  years: number[],
  netWorth: number[]
): Chart;

// Income vs Spending dual line chart  
export function createCashFlowChart(
  canvas: HTMLCanvasElement,
  years: number[],
  income: number[],
  spending: number[]
): Chart;

// Destroy existing chart before re-creating
export function destroyChart(chart: Chart | null): void;
```

### Step 3: Update Results Display

Modify `src/ui/results.ts`:

1. Replace the bar chart HTML with `<canvas>` elements
2. After rendering HTML, initialize Chart.js on the canvases
3. Store chart instances to destroy/recreate on updates
4. Add chart containers with proper sizing

### Step 4: Styling

Update `src/style.css`:
- Chart container sizing
- Responsive behavior for different screen sizes
- Consistent color palette matching existing theme

### Step 5: Chart Configurations

**Net Worth Chart (Line):**
- X-axis: Years
- Y-axis: Net Worth ($)
- Single line with gradient fill
- Tooltip showing exact values
- Color: Fire gradient (orange → ember)

**Cash Flow Chart (Dual Line):**
- X-axis: Years  
- Y-axis: Amount ($)
- Two lines: Income (green) and Spending (red)
- Legend showing which is which
- Tooltip showing both values

---

## Visual Design

### Color Palette (from existing CSS variables)
- Fire/Net Worth: `#ff6b35` → `#ff8f5a`
- Income: `#22c55e` (green)
- Spending: `#ef4444` (red)
- Investment: `#3b82f6` (blue)
- Background: `#fafafa`
- Grid lines: `#e5e5e5`

### Chart Layout
```
┌─────────────────────────────────────┐
│ NET WORTH GROWTH                    │
│ ┌─────────────────────────────────┐ │
│ │          📈 Line Chart          │ │
│ │    (gradient fill under line)   │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ INCOME VS SPENDING                  │
│ ┌─────────────────────────────────┐ │
│ │    📊 Dual Line Chart           │ │
│ │  ── Income  ── Spending         │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ YEAR-BY-YEAR TABLE                  │
│ (existing table, keep as-is)        │
└─────────────────────────────────────┘
```

---

## Testing Plan

1. **Visual verification:**
   - Load default scenario — charts render correctly
   - Load each example scenario — verify different data shapes
   - Test negative net worth scenarios — chart handles correctly
   
2. **Interaction:**
   - Hover over chart — tooltips appear with correct values
   - Change inputs → Recalculate → charts update
   - Resize window — charts respond to width changes

3. **Edge cases:**
   - Very short projections (1-2 years)
   - Very long projections (50+ years)
   - All-zero values
   - Extreme values (billions)

---

## Rollback Strategy

If Chart.js causes issues:
1. Revert to commit before this phase
2. Keep the basic bar chart implementation
3. Consider alternative library or custom SVG solution

---

## Files Changed

| File | Change |
|------|--------|
| `package.json` | Add chart.js dependency |
| `src/ui/charts.ts` | NEW: Chart utility functions |
| `src/ui/results.ts` | Replace bar chart with Chart.js |
| `src/style.css` | Chart container styling |

---

## Migration Notes

- The existing bar chart code in `renderNetWorthChart()` will be replaced
- Chart instances must be destroyed before re-creating to avoid memory leaks
- Canvas elements need explicit width/height or container sizing

