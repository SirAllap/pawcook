import { describe, expect, it } from 'vitest';
import {
  planVegBags,
  planVegBagsFromRaw,
  bagPlanAlternatives,
  planMixedSession,
  canCoCook,
  cutAdvisoryFor,
  NICE_BAG_SIZES_G,
} from './cooking-veg.js';

describe('planVegBags — rounding', () => {
  it('rounds to NICE_BAG_SIZES_G by default', () => {
    // 936 g cooked, 150 g/day household, 3 day pref
    // → target 450 g, naive 2 bags × 468 g → ceil-nice 500 g
    const plan = planVegBags({
      cookedG: 936,
      dailyHouseholdG: 150,
      prefBagDays: 3,
    });
    expect(plan.bagSizeCookedG).toBe(500);
    expect(plan.bagCount).toBe(2);
    expect(plan.lastBagCookedG).toBe(436);
    expect(plan.bagHeadroomG).toBe(64);
    // ~6.24 days of coverage
    expect(plan.coversDays).toBeCloseTo(6.24, 1);
  });

  it('step50 mode snaps to 50 g multiples', () => {
    const plan = planVegBags({
      cookedG: 800,
      dailyHouseholdG: 100,
      prefBagDays: 2,
      rounding: 'step50',
    });
    expect(plan.bagSizeCookedG % 50).toBe(0);
  });

  it('step100 mode snaps to 100 g multiples', () => {
    const plan = planVegBags({
      cookedG: 850,
      dailyHouseholdG: 100,
      prefBagDays: 2,
      rounding: 'step100',
    });
    expect(plan.bagSizeCookedG % 100).toBe(0);
  });

  it('halves mode forces bag count into {2, 4, 8}', () => {
    const plan = planVegBags({
      cookedG: 1000,
      dailyHouseholdG: 100,
      prefBagDays: 2,
      rounding: 'halves',
    });
    expect([2, 4, 8]).toContain(plan.bagCount);
  });

  it('returns zero plan for zero target', () => {
    const plan = planVegBags({
      cookedG: 0,
      dailyHouseholdG: 100,
      prefBagDays: 2,
    });
    expect(plan.bagCount).toBe(0);
    expect(plan.bagSizeCookedG).toBe(0);
  });

  it('bag sizes are always at least 1 and on the NICE_BAG_SIZES_G list (auto)', () => {
    const plan = planVegBags({
      cookedG: 30,
      dailyHouseholdG: 10,
      prefBagDays: 1,
      rounding: 'auto',
    });
    expect(NICE_BAG_SIZES_G as readonly number[]).toContain(plan.bagSizeCookedG);
  });
});

describe('planVegBagsFromRaw — yield handling', () => {
  it('1.2 kg mandolin carrots → ~936 g cooked, 2 bags of 500 g', () => {
    // User's hero scenario, part 1
    const plan = planVegBagsFromRaw({
      ingredientId: 'carrots',
      cut: 'mandolin_thin',
      rawOnHandG: 1200,
      dailyHouseholdG: 150,
      prefBagDays: 3,
    });
    // 1200 × 0.78 yield = 936 g cooked
    expect(plan.totalCookedG).toBeCloseTo(936, 0);
    expect(plan.totalRawG).toBe(1200);
    expect(plan.bagSizeCookedG).toBe(500);
    expect(plan.bagCount).toBe(2);
    // raw bag size = 500 / 0.78 ≈ 641 g
    expect(plan.bagSizeRawG).toBe(641);
  });

  it('100 g spinach cooked target needs ~556 g raw (0.18 yield)', () => {
    // The "silent under-feeding" case that motivated yield correction.
    // 556 g raw × 0.18 yield ≈ 100 g cooked. With 20 g/day household
    // need and 3-day bag pref, target bag = 60 g → algorithm rounds
    // naive count to 2, snaps to 50 g (the next nice size ≥ 50).
    const plan = planVegBagsFromRaw({
      ingredientId: 'spinach',
      cut: 'leaves_whole',
      rawOnHandG: 556,
      dailyHouseholdG: 20,
      prefBagDays: 3,
    });
    expect(plan.totalCookedG).toBe(100);
    expect(plan.bagCount).toBe(2);
    expect(plan.bagSizeCookedG).toBe(50);
  });

  it('unknown yield defaults to 1.0 (no inflation)', () => {
    const plan = planVegBagsFromRaw({
      ingredientId: 'nonexistent_veg',
      cut: 'coins',
      rawOnHandG: 500,
      dailyHouseholdG: 100,
      prefBagDays: 2,
    });
    expect(plan.totalCookedG).toBe(500);
    expect(plan.bagSizeRawG).toBe(plan.bagSizeCookedG);
  });
});

describe('bagPlanAlternatives', () => {
  it('bigger has fewer or equal bags than recommended', () => {
    const alts = bagPlanAlternatives({
      cookedG: 1000,
      dailyHouseholdG: 150,
      prefBagDays: 3,
    });
    expect(alts.bigger.bagCount).toBeLessThanOrEqual(alts.recommended.bagCount);
  });

  it('smaller has more or equal bags than recommended', () => {
    const alts = bagPlanAlternatives({
      cookedG: 1000,
      dailyHouseholdG: 150,
      prefBagDays: 3,
    });
    expect(alts.smaller.bagCount).toBeGreaterThanOrEqual(alts.recommended.bagCount);
  });

  it('smaller floors prefBagDays at 1 (does not go to 0)', () => {
    const alts = bagPlanAlternatives({
      cookedG: 1000,
      dailyHouseholdG: 150,
      prefBagDays: 1,
    });
    expect(alts.smaller.bagCount).toBeGreaterThan(0);
  });
});

describe('planMixedSession — user hero scenario', () => {
  // 1.2 kg carrots mandolin_thin, 1 kg sweet potato cubed, 700 g peas
  // whole. All sous_vide from frozen. The user described this exact
  // workflow.
  it('plans a 3-veg sous_vide-from-frozen session', () => {
    const session = planMixedSession({
      method: 'sous_vide',
      fromFrozen: true,
      veggies: [
        { ingredientId: 'carrots',      cut: 'mandolin_thin', rawG: 1200 },
        { ingredientId: 'sweet_potato', cut: 'cubed',         rawG: 1000 },
        { ingredientId: 'peas',         cut: 'whole',         rawG: 700 },
      ],
    });
    expect(session).not.toBeNull();
    expect(session!.method).toBe('sous_vide');
    // Common temp = min(85, 85, 85) = 85
    expect(session!.tempC).toBe(85);
    // Longest cook = sweet_potato cubed (75–90 + 0 frozenAdd; we
    // didn't set fromFrozenAddMin for cubed in JSON, so just 90).
    expect(session!.totalMinutes).toBe(90);

    const sortedSteps = [...session!.steps].sort((a, b) => a.addAtMinute - b.addAtMinute);
    // Sweet potato goes in first (longest cook).
    expect(sortedSteps[0].ingredientId).toBe('sweet_potato');
    expect(sortedSteps[0].addAtMinute).toBe(0);
    // Carrots mandolin_thin: 35 max + 10 frozenAdd = 45 → addAt 45.
    const carrotsStep = session!.steps.find((s) => s.ingredientId === 'carrots');
    expect(carrotsStep!.cookMinutes).toBe(45);
    expect(carrotsStep!.addAtMinute).toBe(45);
    // Peas: 15 max + 0 frozenAdd (none defined) = 15 → addAt 75.
    const peasStep = session!.steps.find((s) => s.ingredientId === 'peas');
    expect(peasStep!.cookMinutes).toBe(15);
    expect(peasStep!.addAtMinute).toBe(75);
  });

  it('returns null when one veg cannot do the chosen method', () => {
    // Spinach + sous_vide is null in the methods table.
    const session = planMixedSession({
      method: 'sous_vide',
      veggies: [
        { ingredientId: 'carrots', cut: 'coins',         rawG: 200 },
        { ingredientId: 'spinach', cut: 'leaves_whole',  rawG: 100 },
      ],
    });
    expect(session).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(planMixedSession({ method: 'sous_vide', veggies: [] })).toBeNull();
  });

  it('computes cookedGrams via yieldForCut', () => {
    const session = planMixedSession({
      method: 'stovetop_low',
      veggies: [
        { ingredientId: 'carrots', cut: 'coins', rawG: 1000 },
      ],
    });
    // 1000 × 0.88 yield = 880 g cooked
    expect(session!.steps[0].cookedGrams).toBe(880);
  });
});

describe('canCoCook', () => {
  it('root cuts can co-cook', () => {
    expect(canCoCook('whole')).toBe(true);
    expect(canCoCook('large_chunks')).toBe(true);
    expect(canCoCook('cubed')).toBe(true);
    expect(canCoCook('coins')).toBe(true);
    expect(canCoCook('mandolin_thin')).toBe(true);
    expect(canCoCook('sticks')).toBe(true);
  });

  it('leafy and cruciferous cuts cannot co-cook', () => {
    expect(canCoCook('shredded')).toBe(false);
    expect(canCoCook('florets')).toBe(false);
    expect(canCoCook('leaves_whole')).toBe(false);
    expect(canCoCook('leaves_shredded')).toBe(false);
  });
});

describe('cutAdvisoryFor', () => {
  it('flags whole/large_chunks as too big for a small pet (≤6 kg)', () => {
    const a = cutAdvisoryFor(4, 'whole');
    expect(a).not.toBeNull();
    expect(a!.i18nKey).toContain('tooLargeForSmallPet');
  });

  it('flags mandolin_thin as too thin for a large pet (≥25 kg)', () => {
    const a = cutAdvisoryFor(30, 'mandolin_thin');
    expect(a).not.toBeNull();
    expect(a!.i18nKey).toContain('tooThinForLargePet');
  });

  it('returns null when cut fits the pet size', () => {
    expect(cutAdvisoryFor(20, 'coins')).toBeNull();
    expect(cutAdvisoryFor(10, 'cubed')).toBeNull();
  });
});
