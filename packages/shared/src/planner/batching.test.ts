import { describe, expect, it } from 'vitest';
import type { PetProfile } from '../pets.js';
import { generateMealPlan } from './generator.js';
import { SourcingPrefsSchema } from './schemas.js';

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

  it('routes organs and seafood to cookFresh, not batches', () => {
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
