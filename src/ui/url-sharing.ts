/**
 * URL Sharing Utilities
 * 
 * Handles encoding/decoding financial plans in URLs for easy sharing.
 */

import { encodeForURL, decodeFromURL, ValidationError } from '../lib/serialization';
import { FinancialPlan } from '../lib/components';

/**
 * Get the current shareable URL for a plan.
 */
export function getShareableURL(plan: FinancialPlan): string {
  const encoded = encodeForURL(plan);
  const url = new URL(window.location.href);
  url.searchParams.set('plan', encoded);
  return url.toString();
}

/**
 * Load a plan from URL parameters.
 * Returns null if no plan parameter or if decoding fails.
 */
export function loadPlanFromURL(): FinancialPlan | null {
  const urlParams = new URLSearchParams(window.location.search);
  const encoded = urlParams.get('plan');
  
  if (!encoded) {
    return null;
  }
  
  try {
    return decodeFromURL(encoded);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.warn('Invalid plan data in URL:', error.message);
      return null;
    }
    throw error;
  }
}

/**
 * Update the browser URL with the current plan (without page reload).
 */
export function updateURL(plan: FinancialPlan, replace: boolean = true): void {
  const url = getShareableURL(plan);
  if (replace) {
    window.history.replaceState({}, '', url);
  } else {
    window.history.pushState({}, '', url);
  }
}

/**
 * Clear the plan parameter from the URL.
 */
export function clearURL(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('plan');
  window.history.replaceState({}, '', url.toString());
}

