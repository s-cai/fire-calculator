# FIRE Calculator

A financial independence / retire early (FIRE) calculator — a static webpage for projecting your path to financial freedom.

## Current Status

🚧 **Project Phase:** Development Environment Ready

- Repository initialized
- Development guidelines established in `.cursor/rules/`
- Feature requirements documented (see below)
- Vite + TypeScript setup complete
- **Next:** Create implementation roadmap

## Tech Stack

- **Frontend:** Static HTML/CSS
- **Logic:** TypeScript (all calculations and interactivity)
- **Build:** Vite (compiles TS → JS, outputs static files)
- **Hosting:** GitHub Pages

## Planned Features

### 1. Progressive Complexity Interface

The calculator starts with a minimal, approachable interface but reveals advanced configuration as needed. Users can go from "quick estimate" to "detailed projection" without switching tools.

### 2. Configurable Input Categories

The core input categories are:
- **Income** — Salary, side hustles, passive income, Social Security, pensions
- **Spending** — Living expenses, discretionary, one-time large purchases
- **Investments** — Contributions, expected returns, asset allocation

Additional parameters (tax rates, inflation, healthcare costs, etc.) are simply more inputs using the same flexible system described below.

### 3. Time Series Inputs (Key Feature)

Each input can vary over time using flexible patterns:

| Pattern | Description | Example |
|---------|-------------|---------|
| **Constant** | Fixed value throughout | $80,000/year salary |
| **Linear growth** | Constant start + yearly fixed increase | $80k + $2k/year raises |
| **Ratio growth** | Constant start + yearly percentage growth | $80k with 3% annual raises |
| **Composite** | Multiple intervals concatenated | $80k for 5 years, then $120k for 10 years |

This enables modeling of realistic career progressions, retirement phases, and life events.

### 4. Multi-Component Inputs

Users can break down categories into multiple named components for clarity:

**Example — Spending:**
- General living expenses: $4,000/month (constant)
- College tuition: $25,000/year for years 2030–2034
- Healthcare (pre-Medicare): $15,000/year for ages 55–65
- Healthcare (Medicare): $5,000/year after age 65

**Example — Income:**
- Primary job: $120k with 3% growth until retirement
- Spouse income: $60k for 10 years
- Social Security: $24k/year starting at age 67

### 5. Visualization (TBD)

Final demonstration will include charts/graphs. Candidates for plotting:
- Net worth over time
- Income vs. spending trajectory
- FIRE number progress (% to goal)
- Projected runway / years until FI
- Sensitivity analysis (what-if scenarios)

*Specific visualizations require further discussion.*

### 6. Gallery of Pre-Populated Examples (Later Stage)

A showcase of demo scenarios with pre-filled inputs to illustrate different FIRE paths:
- Traditional FIRE (high savings rate, early retirement)
- Coast FIRE (front-load investments, then coast)
- Barista FIRE (part-time work in retirement)
- Lean FIRE vs. Fat FIRE comparisons
- Single income vs. dual income households
- Career change / sabbatical scenarios

Users can load any example as a starting point and customize from there.

## Development Approach

This project is primarily AI-generated under close human supervision:
- README reflects **current status** (not a changelog)
- Complex changes are planned in `plans/` before implementation
- See `.cursor/rules/base.mdc` for full guidelines

## Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → Opens at http://localhost:5173/fire-calculator/

# Build for production
npm run build
# → Outputs to dist/

# Preview production build
npm run preview
```

## Known Limitations

- UI is placeholder only — no features implemented yet
- Visualization strategy not finalized
