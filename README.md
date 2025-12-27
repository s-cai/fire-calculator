# Financial Planner

A financial projection tool — a static webpage for modeling income, spending, and investments over time.

> **Note:** Despite the repository name (`fire-calculator`), FIRE-specific features (4% rule, FIRE number) are deferred. Current focus is general financial planning.

## Current Status

🚧 **Project Phase:** Visualization Complete

- ✅ Vite + TypeScript + Vitest setup
- ✅ Time series engine (constant, linear, ratio, composite patterns)
- ✅ Financial components (multi-component income/spending/investment)
- ✅ Projection engine (net worth simulation)
- ✅ Serialization (JSON + URL encoding with lz-string compression)
- ✅ 4 example scenarios
- ✅ 81 unit tests passing
- ✅ **Phase 5 Complete:** Basic UI with real-time visual feedback
- ✅ **Phase 6 Complete:** Advanced Time Series UI
  - Full control over time series types (Fixed/Linear/Growth %/Segments)
  - Multiple named components per category
  - Composite series with editable year ranges
  - Add/remove components and segments dynamically
  - Real-time sparkline previews for all series types
- ✅ **Phase 7 Complete:** Visualization with Chart.js
  - Net worth line chart with gradient fill
  - Income vs. spending dual line chart
  - Interactive tooltips with formatted values
  - Responsive side-by-side layout on large screens
- **Next:** Phase 8 (Polish & Examples Gallery) — see [Implementation Roadmap](ROADMAP.md)

📐 **Architecture:** See [DESIGN.md](DESIGN.md) for internal logic overview

## Tech Stack

- **Frontend:** Static HTML/CSS
- **Logic:** TypeScript (all calculations and interactivity)
- **Build:** Vite (compiles TS → JS, outputs static files)
- **Hosting:** GitHub Pages

## Features

### Real-Time Visual Feedback

**Key UX principle:** When configuring time series inputs, users see immediate visual confirmation of what they entered. Example: entering "salary $80k with 3% growth" shows a mini-chart of projected values right next to the input.

### Progressive Complexity Interface

The tool starts with a minimal, approachable interface but reveals advanced configuration as needed. Users can go from "quick estimate" to "detailed projection" without switching tools.

### Configurable Input Categories

The core input categories are:
- **Income** — Salary, side hustles, passive income, Social Security, pensions
- **Spending** — Living expenses, discretionary, one-time large purchases
- **Investments** — Contributions, expected returns

### Time Series Inputs (Key Feature)

Each input can vary over time using flexible patterns:

| Pattern | Description | Example |
|---------|-------------|---------|
| **Constant** | Fixed value throughout | $80,000/year salary |
| **Linear growth** | Constant start + yearly fixed increase | $80k + $2k/year raises |
| **Ratio growth** | Constant start + yearly percentage growth | $80k with 3% annual raises |
| **Composite** | Multiple intervals concatenated | $80k for 5 years, then $120k for 10 years |

This enables modeling of realistic career progressions, retirement phases, and life events.

### Multi-Component Inputs

Users can break down categories into multiple named components for clarity:

**Example — Spending:**
- General living expenses: $4,000/month (constant)
- College tuition: $25,000/year for years 2030–2034
- Healthcare: $15,000/year for ages 55–65

**Example — Income:**
- Primary job: $120k with 3% growth until retirement
- Spouse income: $60k for 10 years
- Social Security: $24k/year starting at age 67

### Visualization

Charts and graphs for:
- Net worth over time (bar chart)
- Summary metrics (final net worth, savings rate, etc.)
- Individual time series previews (sparklines)

### Example Scenarios

Pre-built scenarios with pre-filled inputs:
- **High Saver Professional** — Software engineer with aggressive savings
- **Dual Income Household** — Two professionals with combined finances
- **Career Change** — Mid-career transition with salary changes
- **Variable Income** — Freelancer with growing income and major purchases

## Deferred Features

The following are explicitly out of scope for the initial version:

- **FIRE calculations** — 4% rule, FIRE number, years-to-FIRE
- **Inflation modeling** — Users can model via ratio growth
- **Tax calculations** — Users input after-tax values
- **Monthly granularity** — Annual projections only

## Development Approach

This project is primarily AI-generated under close human supervision:
- README reflects **current status** (not a changelog)
- `DESIGN.md` documents architecture and types
- `ROADMAP.md` tracks implementation phases
- Complex changes are planned in `plans/` before implementation

## Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → Opens at http://localhost:5173/fire-calculator/

# Run tests
npm test

# Build for production
npm run build
# → Outputs to dist/

# Preview production build
npm run preview
```

## Project Structure

```
src/
  lib/                    # Pure logic (calculation engine)
    timeseries.ts         # Time series types & evaluation
    components.ts         # Financial components & plan
    projection.ts         # Net worth projection
    serialization.ts      # JSON & URL encoding
    examples.ts           # Pre-built scenarios
    *.test.ts             # Unit tests
  ui/                     # UI components
    state.ts              # Reactive state management
    inputs.ts             # Form rendering
    results.ts            # Projection display
    preview.ts            # Sparkline mini-charts
  main.ts                 # Entry point
  style.css               # Styling
index.html                # HTML shell
```

## Known Limitations

- Mobile responsiveness planned for Phase 8
- No persistence/sharing UI yet — planned for Phase 8
- No simple/advanced mode toggle — planned for Phase 8
