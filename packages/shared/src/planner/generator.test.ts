import { describe, expect, it } from 'vitest';
import type { PetProfile } from '../pets.js';
import { generateMealPlan } from './generator.js';
import { swapIngredient } from './shopping.js';
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

const cat: PetProfile = {
  id: 'pet_cat_1',
  name: 'Whiskers',
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
    macroProfile: 'cat_pmr',
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const defaultSourcing = SourcingPrefsSchema.parse({});

describe('generateMealPlan', () => {
  it('produces one day per durationDays', () => {
    const plan = generateMealPlan({
      name: 'Week 1', pets: [dog], durationDays: 7,
      startDate: '2026-06-01', sourcing: defaultSourcing,
    });
    expect(plan.days).toHaveLength(7);
  });

  it('multi-species plan creates per-pet day plans without engine errors', () => {
    const plan = generateMealPlan({
      name: 'Mixed', pets: [dog, cat], durationDays: 7,
      startDate: '2026-06-01', sourcing: defaultSourcing,
    });
    for (const day of plan.days) {
      expect(day.petPlans).toHaveLength(2);
      expect(day.petPlans[0].meals.length).toBeGreaterThan(0);
      expect(day.petPlans[1].meals.length).toBeGreaterThan(0);
    }
  });

  it('respects mealsPerDay', () => {
    const threeMealPet: PetProfile = {
      ...dog,
      nutrition: { ...dog.nutrition, mealsPerDay: 3 },
    };
    const plan = generateMealPlan({
      name: 'Three meals', pets: [threeMealPet], durationDays: 7,
      startDate: '2026-06-01', sourcing: defaultSourcing,
    });
    for (const day of plan.days) {
      expect(day.petPlans[0].meals).toHaveLength(3);
    }
  });

  it('disliked ingredients never appear in the plan', () => {
    const sourcing = SourcingPrefsSchema.parse({
      dislikedIngredientIds: ['beef', 'chicken'],
    });
    const plan = generateMealPlan({
      name: 'No beef/chicken', pets: [dog], durationDays: 14,
      startDate: '2026-06-01', sourcing,
    });
    const usedIngredients = new Set<string>();
    for (const day of plan.days) {
      for (const pp of day.petPlans) {
        for (const meal of pp.meals) {
          for (const c of meal.components) usedIngredients.add(c.ingredientId);
        }
      }
    }
    expect(usedIngredients.has('beef')).toBe(false);
    expect(usedIngredients.has('chicken')).toBe(false);
  });

  it('plan ingredients respect pet species (cats never get dog-only veg)', () => {
    const plan = generateMealPlan({
      name: 'Cat plan', pets: [cat], durationDays: 7,
      startDate: '2026-06-01', sourcing: defaultSourcing,
    });
    const usedIngredients = new Set<string>();
    for (const day of plan.days) {
      for (const meal of day.petPlans[0].meals) {
        for (const c of meal.components) usedIngredients.add(c.ingredientId);
      }
    }
    // sweet_potato, broccoli, spinach, green_beans, peas, blueberries, apple
    // are tagged dog-only in ingredient-meta. None should appear in a cat plan.
    const dogOnly = ['sweet_potato', 'broccoli', 'spinach', 'green_beans', 'peas', 'blueberries', 'apple'];
    for (const id of dogOnly) {
      expect(usedIngredients.has(id)).toBe(false);
    }
  });

  it('explicit meatIds whitelist restricts proteins to the user picks', () => {
    const sourcing = SourcingPrefsSchema.parse({
      meatIds: ['turkey', 'rabbit'],
    });
    const plan = generateMealPlan({
      name: 'Turkey + rabbit only', pets: [dog], durationDays: 14,
      startDate: '2026-06-01', sourcing,
    });
    // Collect meat-side ingredients used (proteins, organs, fish — i.e. anything
    // in the butcher / fish-counter / pantry sections in the shopping list).
    const meatSections = new Set(['butcher', 'fish-counter', 'pantry']);
    const meatsUsed = new Set<string>();
    for (const section of plan.shoppingList.sections) {
      if (!meatSections.has(section.sectionId)) continue;
      for (const item of section.items) meatsUsed.add(item.ingredientId);
    }
    expect(meatsUsed.size).toBeGreaterThan(0);
    for (const id of meatsUsed) {
      expect(['turkey', 'rabbit']).toContain(id);
    }
  });

  it('explicit vegIds whitelist scopes the veg component slot to the user picks', () => {
    const sourcing = SourcingPrefsSchema.parse({
      vegIds: ['carrots'],
    });
    const plan = generateMealPlan({
      name: 'Carrots only', pets: [dog], durationDays: 14,
      startDate: '2026-06-01', sourcing,
    });
    // For every component slot that carrots is eligible to fill (key='veg'),
    // the planner must use carrots — never another vegetable.
    for (const day of plan.days) {
      for (const pp of day.petPlans) {
        for (const meal of pp.meals) {
          for (const c of meal.components) {
            if (c.componentKey === 'veg') expect(c.ingredientId).toBe('carrots');
          }
        }
      }
    }
  });

  it('includeOrgans=false drops liver and organ slots from the plan', () => {
    // BARF needs liver + organ; if the toggle works those slots vanish.
    const barfDog: PetProfile = {
      ...dog,
      nutrition: { ...dog.nutrition, macroProfile: 'barf' },
    };
    const sourcing = SourcingPrefsSchema.parse({ includeOrgans: false });
    const plan = generateMealPlan({
      name: 'No organs', pets: [barfDog], durationDays: 7,
      startDate: '2026-06-01', sourcing,
    });
    for (const day of plan.days) {
      for (const pp of day.petPlans) {
        for (const meal of pp.meals) {
          for (const c of meal.components) {
            expect(c.componentKey).not.toBe('liver');
            expect(c.componentKey).not.toBe('organ');
          }
        }
      }
    }
  });

  it('shopping list aggregates grams across days', () => {
    const plan = generateMealPlan({
      name: 'Two week', pets: [dog], durationDays: 14,
      startDate: '2026-06-01', sourcing: defaultSourcing,
    });
    expect(plan.shoppingList.sections.length).toBeGreaterThan(0);
    expect(plan.shoppingList.totals.totalGrams).toBeGreaterThan(0);
    expect(plan.shoppingList.totals.itemCount).toBe(
      plan.shoppingList.sections.reduce((s, sec) => s + sec.items.length, 0),
    );
  });

  it('shopping list attributes items to the pets eating them', () => {
    const plan = generateMealPlan({
      name: 'Mixed', pets: [dog, cat], durationDays: 7,
      startDate: '2026-06-01', sourcing: defaultSourcing,
    });
    const allItems = plan.shoppingList.sections.flatMap((s) => s.items);
    expect(allItems.some((i) => i.forPetIds.includes(dog.id))).toBe(true);
    expect(allItems.some((i) => i.forPetIds.includes(cat.id))).toBe(true);
  });
});

describe('swapIngredient', () => {
  it('replaces every occurrence and rebuilds the shopping list', () => {
    const plan = generateMealPlan({
      name: 'Swap test', pets: [dog], durationDays: 7,
      startDate: '2026-06-01', sourcing: SourcingPrefsSchema.parse({
        dislikedIngredientIds: ['chicken', 'turkey', 'lamb', 'pork', 'duck', 'rabbit', 'venison'],
      }),
    });
    // With only beef remaining as a meat option, it must appear somewhere
    const usedIds = new Set(
      plan.shoppingList.sections.flatMap((s) => s.items.map((i) => i.ingredientId)),
    );
    expect(usedIds.has('beef')).toBe(true);
    const swapped = swapIngredient(plan, 'beef', 'rabbit', [dog]);
    const swappedIds = new Set(
      swapped.shoppingList.sections.flatMap((s) => s.items.map((i) => i.ingredientId)),
    );
    expect(swappedIds.has('beef')).toBe(false);
    expect(swappedIds.has('rabbit')).toBe(true);
  });
});
