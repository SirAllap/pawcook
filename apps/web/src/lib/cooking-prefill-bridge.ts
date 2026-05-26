// URL-hash-based handoff for the cooking calculator's "Cook from plan"
// flow. The hash fragment is the most resilient slot in a URL — browsers,
// CDNs, in-app webviews, and history caches all preserve it because it's
// never sent to the server. Module-level memory and localStorage are kept
// as backup tiers for the rare case the hash gets cleared (e.g. user hits
// back, removing the hash from the URL but staying on the route).

import { MeatTypeSchema, CookingMethodSchema } from '@pawcook/shared';
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
  if (prefill.planId)         params.set('planId', prefill.planId);
  if (prefill.ingredientId)   params.set('ing',    prefill.ingredientId);
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
    // Validate enums against their Zod schema rather than trust the raw
    // hash. Hashes are user-controllable (shareable links, copy-paste),
    // so a typo or malicious value would otherwise be rendered verbatim
    // in the prefill banner (e.g. "lizard", "microwave"). Reject anything
    // unknown so the banner only ever shows recognised meats/methods.
    const meatRaw = params.get('meat');
    const methodRaw = params.get('method');
    const meatParsed = meatRaw ? MeatTypeSchema.safeParse(meatRaw) : null;
    const methodParsed = methodRaw ? CookingMethodSchema.safeParse(methodRaw) : null;
    const pets = num('pets');
    const days = num('days');
    return {
      meatType: meatParsed?.success ? meatParsed.data : undefined,
      cookingMethod: methodParsed?.success ? methodParsed.data : undefined,
      totalWeightKg: num('kg'),
      // Drop nonsensical pet/day counts (negatives, decimals from arbitrary
      // hash crafting). The banner shows these unsanitised in chips.
      petCount: pets != null && pets > 0 && Number.isInteger(pets) ? pets : undefined,
      feedingDays: days != null && days > 0 && Number.isInteger(days) ? days : undefined,
      // Plan name is free text; cap length to keep the banner shape sane.
      planName: params.get('plan')?.slice(0, 80) ?? undefined,
      planId: params.get('planId') ?? undefined,
      ingredientId: params.get('ing') ?? undefined,
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
