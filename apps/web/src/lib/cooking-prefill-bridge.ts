// URL-hash-based handoff for the cooking calculator's "Cook from plan"
// flow. The hash fragment is the most resilient slot in a URL — browsers,
// CDNs, in-app webviews, and history caches all preserve it because it's
// never sent to the server. Module-level memory and localStorage are kept
// as backup tiers for the rare case the hash gets cleared (e.g. user hits
// back, removing the hash from the URL but staying on the route).

import type { CookingPrefill } from '../pages/CookingCalculator';

const STORAGE_KEY = 'pawcook_cooking_prefill_v1';
const HASH_PREFIX = 'p=';

let pending: CookingPrefill | null = null;

/** Serialize the prefill into the form that goes into location.hash. */
export function buildPrefillHash(prefill: CookingPrefill): string {
  const params = new URLSearchParams();
  if (prefill.meatType)       params.set('meat',   prefill.meatType);
  if (prefill.cookingMethod)  params.set('method', prefill.cookingMethod);
  if (prefill.totalWeightKg)  params.set('kg',     String(prefill.totalWeightKg));
  if (prefill.petCount)       params.set('pets',   String(prefill.petCount));
  if (prefill.feedingDays)    params.set('days',   String(prefill.feedingDays));
  if (prefill.planName)       params.set('plan',   prefill.planName);
  return HASH_PREFIX + params.toString();
}

function parseHashPrefill(hash: string): CookingPrefill | null {
  if (!hash) return null;
  const stripped = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!stripped.startsWith(HASH_PREFIX)) return null;
  try {
    const params = new URLSearchParams(stripped.slice(HASH_PREFIX.length));
    const num = (k: string) => {
      const v = params.get(k);
      if (v == null) return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };
    return {
      meatType: (params.get('meat') as CookingPrefill['meatType']) ?? undefined,
      cookingMethod: (params.get('method') as CookingPrefill['cookingMethod']) ?? undefined,
      totalWeightKg: num('kg'),
      petCount: num('pets'),
      feedingDays: num('days'),
      planName: params.get('plan') ?? undefined,
    };
  } catch {
    return null;
  }
}

/** Called from ShoppingListView right before navigate('/cooking#...'). */
export function setPendingCookingPrefill(prefill: CookingPrefill): void {
  pending = prefill;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefill));
    }
  } catch { /* private mode, ITP, etc — pending and the hash cover us */ }
}

/**
 * Called from CookingCalculator on mount AND on every navigation. Reads
 * from (in priority): URL hash → in-memory module → localStorage. The
 * first source that has a payload wins, and all three are cleared after.
 */
export function consumePendingCookingPrefill(hash: string): CookingPrefill | null {
  const fromHash = parseHashPrefill(hash);
  if (fromHash) {
    pending = null;
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
    return fromHash;
  }
  if (pending) {
    const out = pending;
    pending = null;
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
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
