# Deferred Projection View for Mobile

**Starting Point:** ee99fbf871e5fd4629b99fd9e6ffba4652e65ba5 on main

## Context
Mobile users reported that the current layout mixes inputs and large outputs, which makes scrolling and focus harder. The existing explicit recalc model already separates inputs and outputs by staging results until the " Recalculate\ button is hit. We can reinforce that separation by deferring any projection output on mobile until the user expressly taps \Show projection\, so the initial experience is purely input-focused.

## Code to Review
- src/ui/results.ts (projection rendering + stale flow)
- src/ui/state.ts (isStale/ecalculate + state transitions)
- src/style.css (layout, responsive rules for results)
- src/main.ts (entry wiring between inputs/results)

## Plan of Change
1. **State flag:** add showProjection to UIState, defaulting to rue on large screens and alse when the detected width is mobile-sized (<=768px). Provide oggleProjectionVisibility() on StateManager.
2. **Mobile trigger:** In enderForm, append a sticky/micro banner at the bottom of the inputs for mobile that shows the Show projection button when showProjection is alse. That button should mark state stale (if needed) and call oggleProjectionVisibility().
3. **Results guard:** In enderResults, if showProjection is alse, render only a placeholder explaining the outputs are hidden with a large button that mimics the mobile banner. When showProjection is rue, resume rendering charts/table as before. The stale banner should mention that results are hidden until the button is tapped.
4. **Responsive behavior:** Add a helper (maybe in main.ts) that checks matchMedia('(min-width:768px)') and flips showProjection to rue when hitting desktop, so desktop always shows outputs even if earlier hidden. Conversely, when shrinking to mobile, keep showProjection false until user explicitly shows projection.
5. **UX polish:** Update CSS so the results section placeholder stands out on mobile, and any stale banner/bubble mentions \Show projection\ so the flow is clear.

## Testing Plan
- Load at 390x844: confirm only inputs + show projection button appear, charts/table hidden
- Click show projection -> charts/table appear, stale state clears if necessary
- Enter input changes while outputs hidden and ensure stale banner keeps prompting, then show projection to update
- Resize from mobile to desktop while outputs hidden: confirm results auto-appear and button disappears

## Rollback Strategy
Revert this plan-specific commit to restore always-visible results.
