# FIRE Calculator

A financial independence / retire early (FIRE) calculator — a static webpage for projecting your path to financial freedom.

## Current Status

🚧 **Project Phase:** Planning & Design

- Repository initialized
- Development guidelines established in `.cursor/rules/`
- Feature requirements documented (see below)
- **Next:** Create implementation roadmap

## Tech Stack

- **Frontend:** Static HTML/CSS
- **Logic:** TypeScript (all calculations and interactivity)
- **Build:** TBD (likely Vite or similar)

## Planned Features

### 1. Progressive Complexity Interface

The calculator starts with a minimal, approachable interface but reveals advanced configuration as needed. Users can go from "quick estimate" to "detailed projection" without switching tools.

### 2. Configurable Inputs

#### Core Categories
- **Income** — Salary, side hustles, passive income, Social Security, pensions
- **Spending** — Living expenses, discretionary, one-time large purchases
- **Investments** — Contributions, expected returns, asset allocation

#### Suggested Additional Configurables
- **Tax rates** — Federal, state, effective rates over time
- **Inflation rate** — For adjusting projections to real dollars
- **Withdrawal strategy** — Safe withdrawal rate, variable strategies
- **Current net worth / savings** — Starting point for projections
- **Age parameters** — Current age, target retirement age, life expectancy
- **Healthcare costs** — Often a critical FIRE consideration

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

## Development Approach

This project is primarily AI-generated under close human supervision:
- README reflects **current status** (not a changelog)
- Complex changes are planned in `plans/` before implementation
- See `.cursor/rules/base.mdc` for full guidelines

## Setup

*Setup instructions will be added once the project structure is established.*

## Known Limitations

- Project is in planning phase — no implementation yet
- Visualization strategy not finalized
- Tax modeling complexity TBD
