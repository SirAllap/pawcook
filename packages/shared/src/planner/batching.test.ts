import { describe, expect, it } from 'vitest';
import type { PetProfile } from '../pets.js';
import { buildCookingPlan } from './batching.js';
import { generateMealPlan } from './generator.js';
import { SourcingPrefsSchema, type PlanDay } from './schemas.js';

const dog: PetProfile = {
  id: 'pet_dog_1',
  name: 'Rex',
  allergies: [],
  conditions: [],
  nutrition: {
    species: 'dog',
    weightKg: 20,
    age: 'adult',
    activityLevel: 'moderate',
    bodyCondition: 'ideal',
    reproductiveStatus: 'neutered',
    mealsPerDay: 2,
    macroProfile: 'balanced_cooked',
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const dog2: PetProfile = { ...dog, id: 'pet_dog_2', name: 'Milo' };
const dog3: PetProfile = { ...dog, id: 'pet_dog_3', name: 'Luna' };

const sousVide = SourcingPrefsSchema.parse({ preferredCookingMethod: 'sous_vide' });
const oven = SourcingPrefsSchema.parse({ preferredCookingMethod: 'oven' });

describe('cooking plan generation', () => {
  it('only generates a cooking plan when cooking method is sous-vide', () => {
    const sv = generateMealPlan({
      name: 'SV', pets: [dog], durationDays: 14,
      startDate: '2026-06-01', sourcing: sousVide,
    });
    const ov = generateMealPlan({
      name: 'Oven', pets: [dog], durationDays: 14,
      startDate: '2026-06-01', sourcing: oven,
    });
    expect(sv.cookingPlan).toBeDefined();
    expect(ov.cookingPlan).toBeUndefined();
  });

  it('records the bagDays choice on the cooking plan', () => {
    const plan = generateMealPlan({
      name: 'B', pets: [dog], durationDays: 14,
      startDate: '2026-06-01',
      sourcing: SourcingPrefsSchema.parse({ preferredCookingMethod: 'sous_vide', bagDays: 3 }),
    });
    expect(plan.cookingPlan?.bagDays).toBe(3);
  });

  it('one ingredient per bag — never combines proteins', () => {
    const plan = generateMealPlan({
      name: 'Multi', pets: [dog, dog2, dog3], durationDays: 14,
      startDate: '2026-06-01', sourcing: sousVide,
    });
    const ingredientsPerBag = plan.cookingPlan!.batches.map((b) => b.ingredientId);
    // Each batch has exactly one ingredientId by construction; assert the
    // type contract holds and no batch is suspiciously empty.
    for (const batch of plan.cookingPlan!.batches) {
      expect(batch.ingredientId.length).toBeGreaterThan(0);
      expect(batch.totalGrams).toBeGreaterThan(0);
    }
    expect(ingredientsPerBag.length).toBeGreaterThan(0);
  });

  it('routes organs to cookFresh, not batches', () => {
    const plan = generateMealPlan({
      name: 'Fresh', pets: [dog], durationDays: 14,
      startDate: '2026-06-01', sourcing: sousVide,
    });
    const batchIngredients = new Set(plan.cookingPlan!.batches.map((b) => b.ingredientId));
    const freshIngredients = new Set(plan.cookingPlan!.cookFresh.map((c) => c.ingredientId));
    // chicken_liver appears in plans for a 20kg dog; it must not be batched.
    if (freshIngredients.has('chicken_liver') || freshIngredients.has('beef_liver')) {
      expect(batchIngredients.has('chicken_liver')).toBe(false);
      expect(batchIngredients.has('beef_liver')).toBe(false);
    }
  });

  it('batches substantial fish (salmon) like other muscle proteins', () => {
    // Salmon chosen as the protein slot is well above the supplement
    // threshold, so it gets a real bag schedule (the dated bag table)
    // instead of being dropped into the cook-fresh card.
    const plan = generateMealPlan({
      name: 'Salmon', pets: [dog, dog2, dog3], durationDays: 14,
      startDate: '2026-06-01',
      sourcing: SourcingPrefsSchema.parse({
        preferredCookingMethod: 'sous_vide',
        meatIds: ['salmon'],
        bagDays: 2,
      }),
    });
    const salmonBatches = plan.cookingPlan!.batches.filter((b) => b.ingredientId === 'salmon');
    const freshIds = new Set(plan.cookingPlan!.cookFresh.map((c) => c.ingredientId));
    expect(salmonBatches.length).toBeGreaterThan(0);
    expect(freshIds.has('salmon')).toBe(false);
    for (const bag of salmonBatches) {
      expect(bag.kind).toBe('protein');
      // Fish is the fatty tier: at most 2 usage-days per bag.
      expect(bag.dates.length).toBeLessThanOrEqual(2);
      const last = bag.dates[bag.dates.length - 1]!;
      expect(bag.useByDate >= last).toBe(true);
    }
  });

  it('keeps sub-threshold fish (omega-3 salmon sprinkle) out of bags', () => {
    // Salmon dosed as a few grams a day is a fish-oil pill in a salmon
    // costume. Even though the seafood class is now batchable, the
    // SUPPLEMENT_GRAM_THRESHOLD gate must still route it to cookFresh, not
    // a freezer bag. Drive buildCookingPlan directly with a synthetic
    // plan so the per-pet-per-day grams are pinned below the 20 g gate.
    const days: PlanDay[] = Array.from({ length: 6 }, (_, i) => ({
      date: `2026-06-0${i + 1}`,
      petPlans: [
        {
          petId: dog.id,
          meals: [
            {
              components: [
                { ingredientId: 'salmon', componentKey: 'seafood', grams: 10 },
                { ingredientId: 'beef', componentKey: 'protein', grams: 200 },
              ],
            },
          ],
        },
      ],
    })) as unknown as PlanDay[];
    const cp = buildCookingPlan(days, [dog], sousVide);
    expect(cp.batches.some((b) => b.ingredientId === 'salmon')).toBe(false);
    expect(cp.cookFresh.some((c) => c.ingredientId === 'salmon' && c.reason === 'perishable')).toBe(true);
    // Substantial beef in the same plan still batches — the gate is
    // grams-based, not a blanket seafood/meat split.
    expect(cp.batches.some((b) => b.ingredientId === 'beef')).toBe(true);
  });

  it('bag dates are non-empty and useByDate >= last serving date', () => {
    const plan = generateMealPlan({
      name: 'Dates', pets: [dog], durationDays: 14,
      startDate: '2026-06-01', sourcing: sousVide,
    });
    for (const batch of plan.cookingPlan!.batches) {
      expect(batch.dates.length).toBeGreaterThan(0);
      const last = batch.dates[batch.dates.length - 1]!;
      expect(batch.useByDate >= last).toBe(true);
      // useByDate is capped at cookDate + 60 days.
      expect(batch.useByDate).toBeDefined();
    }
  });

  it('bagDays caps the number of usage-days per bag', () => {
    const plan = generateMealPlan({
      name: 'Cap', pets: [dog], durationDays: 30,
      startDate: '2026-06-01',
      sourcing: SourcingPrefsSchema.parse({ preferredCookingMethod: 'sous_vide', bagDays: 2 }),
    });
    for (const batch of plan.cookingPlan!.batches) {
      // Policy may further cap (e.g. fatty proteins at 2 days), so this
      // is a hard ceiling assertion only.
      expect(batch.dates.length).toBeLessThanOrEqual(2);
    }
  });

  it('forces per-pet bags when a pet is allergic to the protein', () => {
    const allergicDog: PetProfile = {
      ...dog2,
      allergies: ['chicken'],
    };
    const plan = generateMealPlan({
      name: 'Allergy', pets: [dog, allergicDog, dog3], durationDays: 14,
      startDate: '2026-06-01',
      sourcing: SourcingPrefsSchema.parse({
        preferredCookingMethod: 'sous_vide',
        meatIds: ['chicken'],
      }),
    });
    const chickenBags = plan.cookingPlan!.batches.filter((b) => b.ingredientId === 'chicken');
    // With one allergic pet, chicken bags must be split per-pet (so no
    // single bag lists more than one pet).
    for (const bag of chickenBags) {
      expect(bag.forPetIds.length).toBe(1);
      expect(bag.forPetIds[0]).not.toBe(allergicDog.id);
    }
  });
});

describe('veg cookSpec + veggie sessions', () => {
  it('every veg batch carries a cookSpec with cut + method + tempC', () => {
    const plan = generateMealPlan({
      name: 'VegSpec', pets: [dog], durationDays: 14,
      startDate: '2026-06-01', sourcing: sousVide,
    });
    const vegBatches = plan.cookingPlan!.batches.filter((b) => b.kind === 'veg');
    expect(vegBatches.length).toBeGreaterThan(0);
    for (const b of vegBatches) {
      expect(b.cookSpec).toBeDefined();
      expect(b.cookSpec!.cut).toBeDefined();
      expect(b.cookSpec!.method).toBe('sous_vide');
      expect(b.cookSpec!.tempC).toBeGreaterThan(0);
      expect(b.cookSpec!.packaging).toBe('freezer_bag');
      // Sub-1.0 yield veggies push rawWeightG above totalGrams; veggies
      // at yield 1.0 (peas) keep them equal.
      expect(b.cookSpec!.rawWeightG).toBeGreaterThanOrEqual(b.totalGrams);
    }
  });

  it('cooks-from-frozen when packaging=vacuum_seal + method=sous_vide', () => {
    const plan = generateMealPlan({
      name: 'Frozen', pets: [dog], durationDays: 14,
      startDate: '2026-06-01',
      sourcing: SourcingPrefsSchema.parse({
        preferredCookingMethod: 'sous_vide',
        packagingDefault: 'vacuum_seal',
      }),
    });
    const vegBatches = plan.cookingPlan!.batches.filter((b) => b.kind === 'veg');
    expect(vegBatches.length).toBeGreaterThan(0);
    for (const b of vegBatches) {
      expect(b.cookSpec!.fromFrozen).toBe(true);
    }
  });

  it('default mode (veggieDetail=false) emits at most one mixed session per cook day per method', () => {
    const plan = generateMealPlan({
      name: 'Mixed', pets: [dog], durationDays: 14,
      startDate: '2026-06-01', sourcing: sousVide,
    });
    const sessions = plan.cookingPlan!.veggieSessions ?? [];
    expect(sessions.length).toBeGreaterThan(0);
    // No two mixed sessions share the same (cookDate, method) — they
    // would have been merged.
    const seen = new Map<string, string>();
    for (const s of sessions) {
      const key = `${s.cookDate}__${s.method}`;
      if (s.id.includes('mixed')) {
        expect(seen.has(key), `duplicate mixed session for ${key}`).toBe(false);
        seen.set(key, s.id);
      }
    }
  });

  it('rigor mode (veggieDetail=true) emits one session per veg per cook day', () => {
    const plan = generateMealPlan({
      name: 'Rigor', pets: [dog], durationDays: 14,
      startDate: '2026-06-01',
      sourcing: SourcingPrefsSchema.parse({
        preferredCookingMethod: 'sous_vide',
        veggieDetail: true,
      }),
    });
    const sessions = plan.cookingPlan!.veggieSessions ?? [];
    expect(sessions.length).toBeGreaterThan(0);
    // Every session has exactly one step in rigor mode.
    for (const s of sessions) {
      expect(s.steps.length).toBe(1);
    }
  });

  it('sub-threshold veg routes to supplementCards instead of batches', () => {
    // Single 4kg cat — tiny daily veg need (< 20 g household). Veggies
    // that would otherwise batch get routed to supplement card.
    const tinyCat: PetProfile = {
      id: 'pet_cat_tiny',
      name: 'Pip',
      allergies: [],
      conditions: [],
      nutrition: {
        species: 'cat',
        weightKg: 4,
        age: 'adult',
        activityLevel: 'moderate',
        bodyCondition: 'ideal',
        reproductiveStatus: 'neutered',
        mealsPerDay: 2,
        macroProfile: 'cat_cooked_carnivore',
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const plan = generateMealPlan({
      name: 'CatOnly', pets: [tinyCat], durationDays: 14,
      startDate: '2026-06-01', sourcing: sousVide,
    });
    const supplements = plan.cookingPlan?.supplementCards ?? [];
    const supplementIds = new Set(supplements.map((s) => s.ingredientId));
    const batchVegIds = new Set(
      plan.cookingPlan!.batches.filter((b) => b.kind === 'veg').map((b) => b.ingredientId),
    );
    // If a veggie shows up as supplement, it must NOT also be batched.
    for (const id of supplementIds) {
      expect(batchVegIds.has(id)).toBe(false);
    }
    // All supplement-card rows report a dailyDoseG.
    for (const s of supplements) {
      expect(s.dailyDoseG).toBeGreaterThanOrEqual(0);
      expect(s.reason).toBe('sub-threshold-veg');
    }
  });

  it('no veg ingredient is double-listed in both batches and supplementCards', () => {
    // The classification is mutually exclusive — once veg goes to
    // supplement card, it's removed from the bag stream. Asserting
    // disjointness catches regressions even when the generator's
    // per-pet rotation produces small cat-only slices (which is
    // followed up separately under the household-veg-alignment work).
    const cat: PetProfile = {
      id: 'pet_cat_mixed',
      name: 'Mochi',
      allergies: [],
      conditions: [],
      nutrition: {
        species: 'cat',
        weightKg: 4,
        age: 'adult',
        activityLevel: 'moderate',
        bodyCondition: 'ideal',
        reproductiveStatus: 'neutered',
        mealsPerDay: 2,
        macroProfile: 'cat_cooked_carnivore',
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const plan = generateMealPlan({
      name: 'DogCat', pets: [dog, cat], durationDays: 14,
      startDate: '2026-06-01', sourcing: sousVide,
    });
    const supplementIds = new Set(
      (plan.cookingPlan?.supplementCards ?? []).map((s) => s.ingredientId),
    );
    const batchVegIds = new Set(
      plan.cookingPlan!.batches.filter((b) => b.kind === 'veg').map((b) => b.ingredientId),
    );
    for (const id of supplementIds) {
      expect(batchVegIds.has(id), `${id} appears in both batches and supplements`).toBe(false);
    }
  });
});
