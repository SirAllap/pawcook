// Plain in-memory handoff for the cooking calculator's "Cook from plan"
// flow. ShoppingListView writes here, navigate('/cooking'), the
// CookingCalculator chunk loads and reads it. ESM module state is shared
// across all importers, so this round-trip is reliable even when
// localStorage is blocked (Safari private mode, in-app webviews, ITP).
//
// The localStorage tier is a belt-and-suspenders fallback for the case
// where the cooking chunk was already loaded before the click (so the
// module's `pending` was set after CookingCalculator's initial render).

import type { CookingPrefill } from '../pages/CookingCalculator';

const STORAGE_KEY = 'pawcook_cooking_prefill_v1';

let pending: CookingPrefill | null = null;

export function setPendingCookingPrefill(prefill: CookingPrefill): void {
  pending = prefill;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefill));
    }
  } catch {
    // localStorage may be blocked (private mode, ITP). The in-memory
    // `pending` covers us.
  }
}

export function consumePendingCookingPrefill(): CookingPrefill | null {
  if (pending) {
    const out = pending;
    pending = null;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch { /* ignore */ }
    return out;
  }
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    localStorage.removeItem(STORAGE_KEY);
    const parsed = JSON.parse(raw) as CookingPrefill;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}
