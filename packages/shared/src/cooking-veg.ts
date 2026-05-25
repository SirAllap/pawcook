// Pure planner functions for the veggie cooking flow. No DOM, no
// React, no IO — just math the UI layers (VegBagPlanner, CookingPlan
// generator) call. Tested in cooking-veg.test.ts.

import {
  selectCutMethodSpec,
  yieldForCut,
  applicableCutsFor,
} from './planner/veg-data.js';
import type { VegCut, CookingMethod } from './schemas.js';

// ─── Bag sizing ──────────────────────────────────────────────────

/**
 * Container-friendly bag sizes. The bag planner rounds UP to one of
 * these so the user gets 250 g portions instead of 237 g portions.
 * Calibrated against typical silicone trays, vacuum bag widths, and
 * what people actually portion in domestic kitchens.
 */
export const NICE_BAG_SIZES_G = [
  50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 600, 750, 1000,
] as const;

export type BagRoundingPref = 'auto' | 'step50' | 'step100' | 'halves';

export type BagPlan = {
  bagCount: number;
  bagSizeCookedG: number;
  bagSizeRawG: number;
  // Last bag's cooked grams — equal to bagSizeCookedG when cooked
  // total divides evenly, smaller otherwise (under-fill is honest).
  lastBagCookedG: number;
  totalCookedG: number;
  totalRawG: number;
  // Empty headroom in the last bag when the chosen bag size doesn't
  // divide evenly into the cooked target. Different from shortage.
  bagHeadroomG: number;
  // How many days this bag plan covers given dailyHouseholdG. 0 when
  // dailyHouseholdG is unknown / zero.
  coversDays: number;
  rounding: BagRoundingPref;
};

export type BagPlanInput = {
  /** Cooked-weight gram target to portion. */
  cookedG: number;
  /** Household total daily cooked-gram need for this veggie. */
  dailyHouseholdG: number;
  /** Preferred days each bag should cover (1–7). Seeds bag size. */
  prefBagDays: number;
  /** Rounding policy. Default 'auto' uses NICE_BAG_SIZES_G. */
  rounding?: BagRoundingPref;
};

function ceilToNice(g: number): number {
  for (const size of NICE_BAG_SIZES_G) {
    if (size >= g) return size;
  }
  return NICE_BAG_SIZES_G[NICE_BAG_SIZES_G.length - 1];
}

function ceilToStep(g: number, step: number): number {
  return Math.ceil(g / step) * step;
}

function snapBagSize(
  naiveG: number,
  rounding: BagRoundingPref,
  cookedG: number,
): number {
  switch (rounding) {
    case 'step50':
      return Math.max(50, ceilToStep(naiveG, 50));
    case 'step100':
      return Math.max(100, ceilToStep(naiveG, 100));
    case 'halves': {
      // Force bag count into {2, 4, 8}; pick the option whose
      // resulting bag size is closest to the naive target.
      const candidates = [2, 4, 8];
      let best = candidates[0];
      let bestDelta = Math.abs(cookedG / candidates[0] - naiveG);
      for (const c of candidates) {
        const delta = Math.abs(cookedG / c - naiveG);
        if (delta < bestDelta) { best = c; bestDelta = delta; }
      }
      return Math.ceil(cookedG / best);
    }
    case 'auto':
    default:
      return ceilToNice(naiveG);
  }
}

const ZERO_BAG_PLAN: BagPlan = {
  bagCount: 0,
  bagSizeCookedG: 0,
  bagSizeRawG: 0,
  lastBagCookedG: 0,
  totalCookedG: 0,
  totalRawG: 0,
  bagHeadroomG: 0,
  coversDays: 0,
  rounding: 'auto',
};

/**
 * Portion a cooked-weight target into bags using NICE_BAG_SIZES_G
 * (or the requested rounding pref). Pure function — no IO.
 *
 * cookedG is rounded to the nearest gram up front so floating-point
 * residuals (e.g. 100.08 g out of a yield calc) don't spawn a third
 * bag containing 0.08 g of carrot dust.
 */
export function planVegBags(input: BagPlanInput): BagPlan {
  if (input.cookedG <= 0) {
    return { ...ZERO_BAG_PLAN, rounding: input.rounding ?? 'auto' };
  }

  const cookedG = Math.round(input.cookedG);
  const rounding = input.rounding ?? 'auto';
  const targetBagG = Math.max(1, input.dailyHouseholdG * Math.max(1, input.prefBagDays));
  const naiveBagCount = Math.max(1, Math.round(cookedG / targetBagG));
  const naiveBagG = cookedG / naiveBagCount;
  const bagSizeCookedG = snapBagSize(naiveBagG, rounding, cookedG);
  const bagCount = Math.max(1, Math.ceil(cookedG / bagSizeCookedG));
  const lastBagCookedG = cookedG - bagSizeCookedG * (bagCount - 1);

  return {
    bagCount,
    bagSizeCookedG,
    bagSizeRawG: bagSizeCookedG, // overridden by planVegBagsFromRaw
    lastBagCookedG,
    totalCookedG: cookedG,
    totalRawG: cookedG,
    bagHeadroomG: Math.max(0, bagSizeCookedG - lastBagCookedG),
    coversDays:
      input.dailyHouseholdG > 0
        ? cookedG / input.dailyHouseholdG
        : 0,
    rounding,
  };
}

/**
 * Higher-level entry point: user has `rawOnHandG` of a veggie cut a
 * specific way; compute the bag plan in both raw and cooked grams so
 * the UI can speak both languages. Cooked-weight portions are what
 * goes in the bowl; raw weight is what the user is staring at on the
 * cutting board.
 */
export function planVegBagsFromRaw(input: {
  ingredientId: string;
  cut: VegCut;
  rawOnHandG: number;
  dailyHouseholdG: number;
  prefBagDays: number;
  rounding?: BagRoundingPref;
}): BagPlan {
  const yieldRatio = yieldForCut(input.ingredientId, input.cut);
  const cookedG = input.rawOnHandG * yieldRatio;
  const plan = planVegBags({
    cookedG,
    dailyHouseholdG: input.dailyHouseholdG,
    prefBagDays: input.prefBagDays,
    rounding: input.rounding,
  });
  return {
    ...plan,
    bagSizeRawG: yieldRatio > 0 ? Math.round(plan.bagSizeCookedG / yieldRatio) : plan.bagSizeCookedG,
    totalRawG: input.rawOnHandG,
  };
}

/**
 * Produce three alternative bag plans — recommended (the input
 * pref), one with bigger bags (fewer of them), one with smaller bags
 * (more of them). UI shows these as radio chips so the user can pick
 * the option that fits their containers without re-typing inputs.
 */
export function bagPlanAlternatives(input: BagPlanInput): {
  recommended: BagPlan;
  bigger: BagPlan;
  smaller: BagPlan;
} {
  return {
    recommended: planVegBags(input),
    bigger: planVegBags({ ...input, prefBagDays: input.prefBagDays + 1 }),
    smaller: planVegBags({
      ...input,
      prefBagDays: Math.max(1, input.prefBagDays - 1),
    }),
  };
}

// ─── Mixed cook session ──────────────────────────────────────────

export type MixedSessionVeggie = {
  ingredientId: string;
  cut: VegCut;
  rawG: number;
};

export type MixedSessionInput = {
  veggies: MixedSessionVeggie[];
  method: CookingMethod;
  fromFrozen?: boolean;
};

export type MixedSessionStep = {
  ingredientId: string;
  cut: VegCut;
  rawGrams: number;
  cookedGrams: number;
  cookMinutes: number;
  // Minutes from session start when this veg goes into the pot/bath.
  // 0 = first in. Sequence is "longest cooks first" so everything
  // finishes together at totalMinutes.
  addAtMinute: number;
};

export type MixedSessionResult = {
  method: CookingMethod;
  tempC: number;
  totalMinutes: number;
  steps: MixedSessionStep[];
};

/**
 * Plan a mixed cook session: choose a common temperature, sequence
 * the veggies so the longest cook goes in first, emit addAtMinute so
 * everything finishes together. Returns null when any veg in the mix
 * doesn't support the chosen method (caller pre-filters with
 * `canCoCook` for cut compatibility).
 *
 * Common temp = minimum across each veg's spec for the method.
 * Under-temping is the safe failure mode (slight under-cook of the
 * tolerant veggie) vs over-temping (burning the sensitive one).
 */
export function planMixedSession(
  input: MixedSessionInput,
): MixedSessionResult | null {
  if (input.veggies.length === 0) return null;

  type Resolved = MixedSessionStep & { tempC: number };
  const resolved: Resolved[] = [];

  for (const v of input.veggies) {
    const spec = selectCutMethodSpec(v.ingredientId, v.cut, input.method);
    if (!spec) return null;
    const cookMinutes =
      spec.minutes.max + (input.fromFrozen ? spec.fromFrozenAddMin ?? 0 : 0);
    const yieldRatio = yieldForCut(v.ingredientId, v.cut);
    const cookedGrams = Math.round(v.rawG * yieldRatio);
    resolved.push({
      ingredientId: v.ingredientId,
      cut: v.cut,
      rawGrams: v.rawG,
      cookedGrams,
      cookMinutes,
      addAtMinute: 0,
      tempC: spec.tempC,
    });
  }

  resolved.sort((a, b) => b.cookMinutes - a.cookMinutes);
  const totalMinutes = resolved[0].cookMinutes;
  for (const step of resolved) {
    step.addAtMinute = totalMinutes - step.cookMinutes;
  }

  const tempC = Math.min(...resolved.map((r) => r.tempC));

  return {
    method: input.method,
    tempC,
    totalMinutes,
    steps: resolved.map(({ tempC: _tempC, ...rest }) => rest),
  };
}

/**
 * Which cuts can join a mixed cook session. Co-cooking requires
 * shape and density that hold up next to each other — root coins
 * yes, leafy greens no, broccoli florets no (sulfur taint).
 *
 * The mixed default-session path uses this. Per-veg rigor mode
 * bypasses the check (user explicitly opted into separate cooks).
 */
export function canCoCook(cut: VegCut): boolean {
  switch (cut) {
    case 'whole':
    case 'large_chunks':
    case 'cubed':
    case 'coins':
    case 'mandolin_thin':
    case 'sticks':
      return true;
    case 'shredded':
    case 'florets':
    case 'leaves_whole':
    case 'leaves_shredded':
      return false;
  }
}

/**
 * Pet-servability advisory. Informational chips on the bag planner
 * output card — never blocking. Returns null when the cut is fine
 * for the pet, otherwise an i18n key + values for the chip text.
 *
 * Heuristics are intentionally simple: too-large pieces for small
 * mouths, too-thin pieces for large jaws. Vet-specific guidance lives
 * in the safety matrix, not here.
 */
export function cutAdvisoryFor(
  petWeightKg: number,
  cut: VegCut,
): { i18nKey: string; cut: VegCut } | null {
  if (petWeightKg <= 6 && (cut === 'whole' || cut === 'large_chunks')) {
    return { i18nKey: 'cooking.veg.advisory.tooLargeForSmallPet', cut };
  }
  if (petWeightKg >= 25 && cut === 'mandolin_thin') {
    return { i18nKey: 'cooking.veg.advisory.tooThinForLargePet', cut };
  }
  return null;
}

/**
 * Convenience: which cuts a given veggie supports. Re-exported here
 * so UI components don't need to dig through veg-data.
 */
export function vegApplicableCuts(id: string): readonly VegCut[] {
  return applicableCutsFor(id);
}
