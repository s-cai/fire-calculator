# Financial Planner

A financial projection tool — a static webpage for modeling income, spending, and investments over time.

> **Note:** Despite the repository name (`fire-calculator`), FIRE-specific features (4% rule, FIRE number) are deferred. Current focus is general financial planning.

## Current Status

🚧 **Project Phase:** Core Engine Complete

- ✅ Vite + TypeScript + Vitest setup
- ✅ Time series engine (constant, linear, ratio, composite patterns)
- ✅ Financial components (multi-component income/spending/investment)
- ✅ Projection engine (net worth simulation)
- ✅ 50 unit tests passing
- **Next:** Phase 5 (Basic UI) — see [Implementation Roadmap](ROADMAP.md)

📐 **Architecture:** See [DESIGN.md](DESIGN.md) for internal logic overview

## Tech Stack

- **Frontend:** Static HTML/CSS
- **Logic:** TypeScript (all calculations and interactivity)
- **Build:** Vite (compiles TS → JS, outputs static files)
- **Hosting:** GitHub Pages

## Planned Features

### 1. Real-Time Visual Feedback

**Key UX principle:** When configuring time series inputs, users see immediate visual confirmation of what they entered. Example: entering "salary $80k with 3% growth" shows a mini-chart of projected values right next to the input.

### 2. Progressive Complexity Interface

The tool starts with a minimal, approachable interface but reveals advanced configuration as needed. Users can go from "quick estimate" to "detailed projection" without switching tools.

### 3. Configurable Input Categories

The core input categories are:
- **Income** — Salary, side hustles, passive income, Social Security, pensions
- **Spending** — Living expenses, discretionary, one-time large purchases
- **Investments** — Contributions, expected returns

### 4. Time Series Inputs (Key Feature)

Each input can vary over time using flexible patterns:

| Pattern | Description | Example |
|---------|-------------|---------|
| **Constant** | Fixed value throughout | $80,000/year salary |
| **Linear growth** | Constant start + yearly fixed increase | $80k + $2k/year raises |
| **Ratio growth** | Constant start + yearly percentage growth | $80k with 3% annual raises |
| **Composite** | Multiple intervals concatenated | $80k for 5 years, then $120k for 10 years |

This enables modeling of realistic career progressions, retirement phases, and life events.

### 5. Multi-Component Inputs

Users can break down categories into multiple named components for clarity:

**Example — Spending:**
- General living expenses: $4,000/month (constant)
- College tuition: $25,000/year for years 2030–2034
- Healthcare: $15,000/year for ages 55–65

**Example — Income:**
- Primary job: $120k with 3% growth until retirement
- Spouse income: $60k for 10 years
- Social Security: $24k/year starting at age 67

### 6. Visualization

Charts and graphs for:
- Net worth over time
- Income vs. spending trajectory
- Individual time series previews

### 7. Gallery of Pre-Populated Examples (Later Stage)

Demo scenarios with pre-filled inputs:
- High savings rate early retirement
- Career change scenarios
- Single vs. dual income households

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

## Known Limitations

- UI is placeholder only — calculation engine works but no interface yet
- Visualization strategy not finalized
- No persistence (save/load) yet
