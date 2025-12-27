# Simplified Component Editor UI

**Created:** 2025-12-27  
**Starting Point:** Phase 7 complete (Visualization)

---

## Context

The current component editor has 4 explicit series types (Fixed, Linear, Growth %, Segments) which exposes internal complexity to users. The UI should be simpler and more intuitive.

---

## Design Goals

1. **Hide internal complexity** — No visible "series type" buttons
2. **Progressive disclosure** — Start simple, expand when needed
3. **Clear terminology** — "Phase" instead of "Segment"
4. **Better visual feedback** — Larger preview with axes

---

## New UI Model

### Always "Phases" Mode

Every component is internally a composite series, but the UI presents it simply:

```
┌─────────────────────────────────────────┐
│ Salary                                × │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ 2025 ─ 2045                       × │ │
│ │                                     │ │
│ │ Amount    [$ 80000        ]         │ │
│ │                                     │ │
│ │ ☐ Increase annually                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
│         [ + One more phase ]            │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ $80K │          ────────────────    │ │
│ │      │                              │ │
│ │  $0  └──────────────────────────    │ │
│ │      2025              2045         │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### When "Increase annually" is checked:

```
│ Amount    [$ 80000        ]         │
│                                     │
│ ☑ Increase annually                 │
│   ○ By percentage   [ 3.0 ] %       │
│   ● By fixed amount [$ 2000 ] /year │
```

Radio buttons: percentage first, then fixed amount.

---

## Terminology Changes

| Old | New |
|-----|-----|
| "Segment" | "Phase" |
| "Add Segment" | "+ One more phase" |
| "Add Income Source" | "+ New Income Source" |
| "Add Expense" | "+ New Expense" |
| "Add Investment" | "+ New Investment" |

---

## Preview Chart Enhancement

**Current:** 100×40px sparkline, no axes

**New:** ~Full width × 80px, with:
- X-axis: Start year — End year labels
- Y-axis: Min — Max value labels
- Gradient fill under line
- Responsive width

---

## Implementation Plan

### Step 1: Update UIComponent/UISegment Model

The model stays the same internally, but the UI will:
- Default to `seriesType: 'composite'` with one segment
- Map checkbox + radio to the appropriate segment type

### Step 2: Rewrite component-editor.ts

New structure:
```typescript
function renderPhaseEditor(segment, componentId, baseYear, projectionYears): string
function renderComponentEditor(component, baseYear, projectionYears): string
```

Each phase shows:
- Year range inputs
- Amount input
- "Increase annually" checkbox
- If checked: radio buttons + value input

### Step 3: Update category-section.ts

- Change "Add Segment" → "+ One more phase"
- Change "Add Income Source" → "+ New Income Source"
- Similar for spending/investment

### Step 4: Enhance preview.ts

- Increase size to full-width × 80px
- Add X-axis labels (start year, end year)
- Add Y-axis labels (min value, max value)
- Keep gradient fill style

### Step 5: Update CSS

- New styles for radio buttons
- Checkbox styling
- Larger preview container
- Axis label styling

---

## State Mapping

UI State → Internal Series:

| UI Configuration | Internal SeriesType |
|------------------|---------------------|
| Amount only | `constant` |
| Amount + "By percentage" | `ratio` |
| Amount + "By fixed amount" | `linear` |

When user checks "Increase annually":
- Default to "By percentage" (first radio option)
- Populate with 0% initially

---

## Files Changed

| File | Change |
|------|--------|
| `src/ui/component-editor.ts` | Complete rewrite for new UI |
| `src/ui/category-section.ts` | Update button labels |
| `src/ui/preview.ts` | Larger chart with axes |
| `src/style.css` | Radio buttons, checkbox, preview styles |

---

## Testing Plan

1. Default state: Single phase with amount only
2. Check "Increase annually" → radio buttons appear
3. Select "By percentage" → percentage input shown
4. Select "By fixed amount" → dollar input shown
5. Add phase → new phase appears with sensible defaults
6. Preview updates correctly for all configurations
7. Load example scenarios → verify they display correctly
8. Recalculate → verify projection is correct

