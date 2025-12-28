/**
 * URL Sharing Utilities
 * 
 * Handles encoding/decoding financial plans in URLs for easy sharing.
 */

import { encodeExtendedPlanForURL, decodeExtendedPlanFromURL, decodeFromURL, ValidationError, ExtendedPlan } from '../lib/serialization';

/**
 * Get the current shareable URL for a plan with all basic parameters.
 */
export function getShareableURL(extendedPlan: ExtendedPlan): string {
  const encoded = encodeExtendedPlanForURL(extendedPlan);
  const url = new URL(window.location.href);
  url.searchParams.set('plan', encoded);
  return url.toString();
}

/**
 * Load an extended plan from URL parameters.
 * Returns null if no plan parameter or if decoding fails.
 */
export function loadPlanFromURL(): ExtendedPlan | null {
  const urlParams = new URLSearchParams(window.location.search);
  const encoded = urlParams.get('plan');
  
  if (!encoded) {
    return null;
  }
  
  try {
    // Try to decode as extended plan first (new format)
    return decodeExtendedPlanFromURL(encoded);
  } catch (error) {
    if (error instanceof ValidationError) {
      // If extended plan fails, try legacy format (just FinancialPlan)
      try {
        const legacyPlan = decodeFromURL(encoded);
        // Convert legacy plan to extended plan with defaults
        return {
          baseYear: legacyPlan.baseYear,
          projectionYears: 20, // default
          initialNetWorth: 50000, // default
          investmentReturnRate: 0.07, // default
          components: legacyPlan.components,
        };
      } catch (legacyError) {
        console.warn('Invalid plan data in URL:', error.message);
        return null;
      }
    }
    throw error;
  }
}

/**
 * Update the browser URL with the current plan (without page reload).
 */
export function updateURL(extendedPlan: ExtendedPlan, replace: boolean = true): void {
  const url = getShareableURL(extendedPlan);
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

