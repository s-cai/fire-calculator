/**
 * FIRE Calculator - Main Entry Point
 * 
 * Wires together the UI components and state management.
 */

import './style.css';
import { createState } from './ui/state';
import { renderForm } from './ui/inputs';
import { renderResults } from './ui/results';

// Initialize the application
function init() {
  const app = document.querySelector<HTMLDivElement>('#app')!;
  
  // Create layout structure
  app.innerHTML = `
    <header class="app-header">
      <h1>🔥 FIRE Calculator</h1>
      <p class="tagline">Financial Independence / Retire Early</p>
    </header>
    <main class="app-main">
      <section id="inputs" class="inputs-panel"></section>
      <section id="results" class="results-panel"></section>
    </main>
    <footer class="app-footer">
      <p>Plan your path to financial independence</p>
    </footer>
  `;
  
  const inputsContainer = document.getElementById('inputs')!;
  const resultsContainer = document.getElementById('results')!;
  
  // Create state manager - hide projection on mobile initially
  const isMobile = window.innerWidth <= 768;
  const stateManager = createState({ showProjection: !isMobile });
  
  // Initial render
  renderForm(inputsContainer, stateManager);
  renderResults(resultsContainer, stateManager);
  
  // Re-render form only on structural changes (add/delete, type changes, load example)
  stateManager.onFormChange(() => {
    renderForm(inputsContainer, stateManager);
  });
  
  // Re-render results on any change (stale, recalculate, structural)
  stateManager.onResultsChange(() => {
    renderResults(resultsContainer, stateManager);
  });
  
  // Auto-show projection when resizing to desktop
  const mediaQuery = window.matchMedia('(min-width: 769px)');
  const handleResize = () => {
    if (mediaQuery.matches && !stateManager.get().showProjection) {
      stateManager.setProjectionVisibility(true);
    }
  };
  mediaQuery.addEventListener('change', handleResize);
}

// Start the app
init();
