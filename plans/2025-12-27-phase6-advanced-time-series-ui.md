# Phase 6: Advanced Time Series UI

**Date:** 2025-12-27  
**Starting Point:** Commit `96b4acd` (Phase 5 complete)  
**Branch:** main

## Context

Phase 5 delivered a functional UI with simplified inputs (single values per category). Now we need to expose the full power of the time series engine to users:

- **Current:** `annualIncome: 80000, incomeGrowthRate: 0.03` → single series
- **Goal:** Multiple named components with configurable time series types

This unlocks the key scenarios from the README:
- Multiple income sources (primary job, spouse, side hustle)
- Time-limited expenses (childcare for 5 years, college tuition)
- Career transitions (salary changes at specific years)

### Goals
1. Configure time series type per component (constant/linear/ratio)
2. Add/remove named components within each category
3. Composite series support (future segments)
4. Maintain real-time preview feedback

### Non-Goals (deferred)
- Full chart visualizations (separate phase)
- Drag-and-drop reordering
- Import/export individual components

---

## Code to Review

| File | Why |
|------|-----|
| `src/lib/timeseries.ts` | All series types we need to support |
| `src/lib/components.ts` | FinancialComponent, FinancialPlan types |
| `src/ui/state.ts` | Current simplified state model — needs major changes |
| `src/ui/inputs.ts` | Current form — needs complete rewrite |
| `src/ui/preview.ts` | Sparkline rendering — reuse as-is |

---

## Plan of Change

### Step 1: Redesign State Model

Replace simplified scalar inputs with full component-based state.

**File:** `src/ui/state.ts`

```typescript
// NEW: Component-level UI state
interface UIComponent {
  id: string;           // Unique identifier
  name: string;         // User-editable name
  category: ComponentCategory;
  seriesType: 'constant' | 'linear' | 'ratio' | 'composite';
  
  // Type-specific fields (only relevant ones used based on seriesType)
  value: number;              // constant
  startValue: number;         // linear, ratio
  yearlyIncrement: number;    // linear
  yearlyGrowthRate: number;   // ratio
  segments: UISegment[];      // composite
}

interface UISegment {
  id: string;
  startYear: number;
  endYear: number;
  seriesType: 'constant' | 'linear' | 'ratio';
  value: number;
  startValue: number;
  yearlyIncrement: number;
  yearlyGrowthRate: number;
}

interface UIState {
  // Core parameters (unchanged)
  baseYear: number;
  projectionYears: number;
  initialNetWorth: number;
  investmentReturnRate: number;
  
  // NEW: Full component list
  components: UIComponent[];
  
  // Computed (unchanged)
  plan: FinancialPlan;
  projection: YearlyProjection[];
}
```

**Key changes:**
- Remove `annualIncome`, `incomeGrowthRate`, etc.
- Add `components: UIComponent[]`
- `buildPlan()` converts `UIComponent[]` → `FinancialComponent[]`

---

### Step 2: Component Editor UI

Create a reusable component editor that handles all series types.

**File:** `src/ui/component-editor.ts`

```typescript
function renderComponentEditor(
  component: UIComponent,
  baseYear: number,
  projectionYears: number,
  onChange: (updates: Partial<UIComponent>) => void,
  onDelete: () => void
): string
```

**UI Structure:**
```
┌─────────────────────────────────────────────────────┐
│ [Name input]                              [🗑 Delete] │
├─────────────────────────────────────────────────────┤
│ Type: [Constant ▼] [Linear] [Growth %] [Segments]   │
├─────────────────────────────────────────────────────┤
│ (Type-specific inputs)                              │
│                                                     │
│ For Constant:   $ [value]                           │
│ For Linear:     $ [start] + $ [increment] /year    │
│ For Ratio:      $ [start] × [rate] % /year         │
│ For Composite:  [Segment list with add button]      │
├─────────────────────────────────────────────────────┤
│ Preview: [═══════════════▶ sparkline]              │
└─────────────────────────────────────────────────────┘
```

**Series Type Selector:**
- Radio buttons or segmented control
- Changing type preserves `startValue` where possible
- Default new components to "Constant"

---

### Step 3: Category Section UI

Group components by category with add/remove controls.

**File:** `src/ui/category-section.ts`

```typescript
function renderCategorySection(
  category: ComponentCategory,
  components: UIComponent[],
  baseYear: number,
  projectionYears: number,
  onUpdate: (id: string, updates: Partial<UIComponent>) => void,
  onAdd: () => void,
  onDelete: (id: string) => void
): string
```

**UI Structure:**
```
┌─────────────────────────────────────────────────────┐
│ INCOME                              [+ Add Income]  │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Primary Salary                           [🗑]   │ │
│ │ Type: [●Constant] [Linear] [Growth %]           │ │
│ │ $ 80,000                   [sparkline ═══▶]    │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Side Hustle                              [🗑]   │ │
│ │ Type: [Constant] [●Linear] [Growth %]           │ │
│ │ $ 5,000 + $1,000/year      [sparkline ═══▶]    │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Collapsible sections (optional)
- Category total displayed in header
- Empty state with prompt to add first component

---

### Step 4: Composite Series UI (Segments)

Allow users to define multiple time segments.

**UI for Segments:**
```
┌─────────────────────────────────────────────────────┐
│ Career Transition                          [🗑]     │
│ Type: [Constant] [Linear] [Growth %] [●Segments]    │
├─────────────────────────────────────────────────────┤
│ Segment 1: 2025-2030                       [🗑]     │
│   Type: [●Growth %]  $130,000 × 2%/year            │
│                                                     │
│ Segment 2: 2030-2031                       [🗑]     │
│   Type: [●Constant]  $20,000 (gap year)            │
│                                                     │
│ Segment 3: 2031-2050                       [🗑]     │
│   Type: [●Growth %]  $80,000 × 5%/year             │
│                                                     │
│ [+ Add Segment]                                     │
├─────────────────────────────────────────────────────┤
│ Preview: [sparkline showing all segments]           │
└─────────────────────────────────────────────────────┘
```

**Segment validation:**
- Segments must not overlap
- Gaps are allowed (value = 0 for missing years)
- Auto-suggest next segment start year

---

### Step 5: Update Main Form

**File:** `src/ui/inputs.ts`

Replace current fixed inputs with dynamic category sections.

```typescript
function renderForm(container: HTMLElement, stateManager: StateManager): void {
  // Basic parameters section (unchanged)
  // ...
  
  // Dynamic category sections
  renderCategorySection('income', ...);
  renderCategorySection('spending', ...);
  renderCategorySection('investment', ...);
}
```

---

### Step 6: State-to-Plan Conversion

**File:** `src/ui/state.ts`

```typescript
function buildTimeSeries(component: UIComponent): TimeSeries {
  switch (component.seriesType) {
    case 'constant':
      return constant(component.value);
    case 'linear':
      return linear(component.startValue, component.yearlyIncrement);
    case 'ratio':
      return ratio(component.startValue, component.yearlyGrowthRate);
    case 'composite':
      return composite(component.segments.map(seg => ({
        startYear: seg.startYear,
        endYear: seg.endYear,
        series: buildSegmentSeries(seg),
      })));
  }
}

function buildPlan(state: UIState): FinancialPlan {
  return {
    baseYear: state.baseYear,
    components: state.components.map(c => ({
      name: c.name,
      category: c.category,
      series: buildTimeSeries(c),
    })),
  };
}
```

---

### Step 7: Example Loading

Update example loading to populate full component list.

**File:** `src/ui/inputs.ts`

```typescript
function loadExample(example: ExampleScenario, stateManager: StateManager): void {
  const components: UIComponent[] = example.plan.components.map(c => 
    convertToUIComponent(c)
  );
  stateManager.set({
    baseYear: example.plan.baseYear,
    components,
  });
}

function convertToUIComponent(c: FinancialComponent): UIComponent {
  // Convert TimeSeries back to UI-editable format
  // Handle all series types
}
```

---

### Step 8: Styling Updates

**File:** `src/style.css`

Add styles for:
- Component cards within categories
- Series type selector (radio/segmented)
- Segment list
- Delete buttons
- Add component buttons
- Collapsed/expanded states

---

## File Structure After Phase 6

```
src/
  lib/                    # Pure logic (unchanged)
  ui/
    state.ts              # Updated with UIComponent model
    inputs.ts             # Refactored to use category sections
    component-editor.ts   # NEW: Single component editor
    category-section.ts   # NEW: Category with component list
    results.ts            # Unchanged
    preview.ts            # Unchanged
  main.ts
  style.css               # Updated
```

---

## Decisions

### D1: Series Type Selector → Segmented Buttons ✅

Use a row of buttons instead of dropdown:
- All options visible at once
- Faster to switch between types
- Visual clarity

### D2: Default New Components → Constant ✅

When adding a new component:
- Default to "Constant" type
- Pre-fill with reasonable value based on category ($50k income, $30k spending, $10k investment)
- Auto-generate name ("Income 2", "Spending 3", etc.)

### D3: Composite UI → Vertical Segment List ✅

Segments displayed as stacked cards:
- Clear visual separation
- Easy to add/remove/reorder
- Each segment has its own type selector

### D4: Preserve Values on Type Switch ✅

When changing series type:
- `startValue` carries over between linear/ratio
- `value` (constant) ↔ `startValue` (linear/ratio)
- Growth rates reset to defaults when switching to growth types

### D5: Component IDs → UUID ✅

Use `crypto.randomUUID()` for component/segment IDs:
- Stable across re-renders
- No collision issues
- Simple implementation

---

## Testing Plan

### Unit Tests
- `state.ts` — Test `buildTimeSeries()` for all series types
- `state.ts` — Test `convertToUIComponent()` round-trip

### Manual Testing
1. Add/remove components in each category
2. Switch series types, verify preview updates
3. Configure composite series with multiple segments
4. Load each example, verify components render correctly
5. Edge cases: empty categories, single segment composite, 0 values

### Regression Testing
- Verify all 81 existing tests still pass
- Verify basic flow still works (change input → see updated projection)

---

## Rollback Strategy

If Phase 6 causes issues:
1. Revert to commit `96b4acd` (Phase 5)
2. Simplified inputs continue to work
3. Re-evaluate UI complexity

The core calculation logic is unchanged, so rollback is safe.

---

## Estimated Effort

| Step | Estimate |
|------|----------|
| Step 1: Redesign state model | 1 hour |
| Step 2: Component editor | 2 hours |
| Step 3: Category section | 1 hour |
| Step 4: Composite series UI | 1.5 hours |
| Step 5: Update main form | 30 min |
| Step 6: State-to-plan conversion | 1 hour |
| Step 7: Example loading | 30 min |
| Step 8: Styling | 1.5 hours |
| Testing & polish | 1 hour |
| **Total** | **~10 hours** |

---

## Migration Notes

The state model is changing significantly. On first load after this update:
- Initialize with default components (one per category)
- No backward compatibility needed (no persistence yet)

---

## Open Questions

1. **Segment year pickers:** Free-form input or constrained to projection range?
   - Recommendation: Free-form, but warn if outside projection range

2. **Maximum components per category?**
   - Recommendation: No hard limit, but UI may get unwieldy with 10+

3. **Segment overlap handling?**
   - Recommendation: Prevent overlap in UI, show validation error

---

**Ready for implementation.**

