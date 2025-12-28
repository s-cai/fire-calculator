/**
 * Tests for UI state management.
 */
import { describe, it, expect, vi } from 'vitest';
import { createState } from './state';

describe('createState', () => {
  it('creates state with default values', () => {
    const stateManager = createState();
    const state = stateManager.get();
    
    expect(state.baseYear).toBe(new Date().getFullYear());
    expect(state.projectionYears).toBe(20);
    expect(state.initialNetWorth).toBe(50000);
    expect(state.investmentReturnRate).toBe(0.07);
  });

  it('creates default components for income, spending, investment', () => {
    const stateManager = createState();
    const state = stateManager.get();
    
    expect(state.components.length).toBe(3);
    
    const categories = state.components.map(c => c.category);
    expect(categories).toContain('income');
    expect(categories).toContain('spending');
    expect(categories).toContain('investment');
  });

  it('starts with isStale = false', () => {
    const stateManager = createState();
    expect(stateManager.get().isStale).toBe(false);
  });

  it('has initial projection calculated', () => {
    const stateManager = createState();
    const state = stateManager.get();
    
    expect(state.projection.length).toBeGreaterThan(0);
    expect(state.projection[0].year).toBe(state.baseYear);
  });
});

describe('markStale', () => {
  it('sets isStale to true', () => {
    const stateManager = createState();
    expect(stateManager.get().isStale).toBe(false);
    
    stateManager.markStale();
    expect(stateManager.get().isStale).toBe(true);
  });

  it('notifies results listeners', () => {
    const stateManager = createState();
    const listener = vi.fn();
    
    stateManager.onResultsChange(listener);
    stateManager.markStale();
    
    expect(listener).toHaveBeenCalled();
  });
});

describe('recalculate', () => {
  it('sets isStale to false', () => {
    const stateManager = createState();
    stateManager.markStale();
    expect(stateManager.get().isStale).toBe(true);
    
    stateManager.recalculate();
    expect(stateManager.get().isStale).toBe(false);
  });

  it('updates projection based on current state', () => {
    const stateManager = createState();
    
    // In the explicit recalculate model, values are read from DOM
    // For testing, we can verify that recalculate() works with current state
    stateManager.recalculate();
    
    const newProjection = stateManager.get().projection;
    
    // Projection should still be valid
    expect(newProjection.length).toBeGreaterThan(0);
    expect(newProjection[0].year).toBe(stateManager.get().baseYear);
  });
});

describe('addComponent', () => {
  it('adds a new component to the list', () => {
    const stateManager = createState();
    const initialCount = stateManager.get().components.length;
    
    stateManager.addComponent('income');
    
    expect(stateManager.get().components.length).toBe(initialCount + 1);
  });

  it('assigns correct category', () => {
    const stateManager = createState();
    stateManager.addComponent('spending');
    
    const components = stateManager.get().components;
    const lastComponent = components[components.length - 1];
    
    expect(lastComponent.category).toBe('spending');
  });

  it('marks state as stale', () => {
    const stateManager = createState();
    stateManager.recalculate(); // Clear any initial staleness
    
    stateManager.addComponent('income');
    expect(stateManager.get().isStale).toBe(true);
  });
});

describe('deleteComponent', () => {
  it('removes the component from the list', () => {
    const stateManager = createState();
    const initialCount = stateManager.get().components.length;
    const componentId = stateManager.get().components[0].id;
    
    stateManager.deleteComponent(componentId);
    
    expect(stateManager.get().components.length).toBe(initialCount - 1);
  });

  it('does nothing if component not found', () => {
    const stateManager = createState();
    const initialCount = stateManager.get().components.length;
    
    stateManager.deleteComponent('nonexistent-id');
    
    expect(stateManager.get().components.length).toBe(initialCount);
  });
});


describe('listener management', () => {
  it('onFormChange returns unsubscribe function', () => {
    const stateManager = createState();
    const listener = vi.fn();
    
    const unsubscribe = stateManager.onFormChange(listener);
    stateManager.addComponent('income');
    expect(listener).toHaveBeenCalledTimes(1);
    
    unsubscribe();
    stateManager.addComponent('income');
    expect(listener).toHaveBeenCalledTimes(1); // Not called again
  });

  it('onResultsChange returns unsubscribe function', () => {
    const stateManager = createState();
    const listener = vi.fn();
    
    const unsubscribe = stateManager.onResultsChange(listener);
    stateManager.markStale();
    expect(listener).toHaveBeenCalledTimes(1);
    
    unsubscribe();
    stateManager.markStale();
    expect(listener).toHaveBeenCalledTimes(1); // Not called again
  });
});

describe('loadComponents', () => {
  it('replaces existing components', () => {
    const stateManager = createState();
    
    const newComponents = [{
      id: 'test-1',
      name: 'Test Component',
      category: 'income' as const,
      seriesType: 'composite' as const,
      value: 0,
      startValue: 0,
      yearlyIncrement: 0,
      yearlyGrowthRate: 0,
      segments: [{
        id: 'seg-1',
        seriesType: 'constant' as const,
        startYear: 2025,
        endYear: 2030,
        value: 50000,
        startValue: 50000,
        yearlyIncrement: 0,
        yearlyGrowthRate: 0,
      }],
    }];
    
    stateManager.loadComponents(2025, newComponents);
    
    expect(stateManager.get().components.length).toBe(1);
    expect(stateManager.get().components[0].name).toBe('Test Component');
    expect(stateManager.get().baseYear).toBe(2025);
  });
});

