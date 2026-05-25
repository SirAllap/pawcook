import { describe, expect, it } from 'vitest';
import { buildShoppingList, computePurchase } from './shopping.js';
import { getIngredient } from './catalog.js';
import type { PetProfile } from '../pets.js';
import type { PlanDay } from './schemas.js';

describe('computePurchase — rounding by ingredient class', () => {
  it('rounds muscle meat (chicken) UP to 250 g', () => {
    const result = computePurchase(1847, getIngredient('chicken'));
    expect(result.purchaseGrams).toBe(2000);
    expect(result.purchaseUnit).toBe('g');
    expect(result.surplusBehavior).toBe('freeze');
    expect(result.surplusGrams).toBeCloseTo(153, 0);
  });

  it('rounds 300 g of beef UP to 500 g (next quarter-kilo)', () => {
    const result = computePurchase(300, getIngredient('beef'));
    expect(result.purchaseGrams).toBe(500);
  });

  it('shows surplus only when over 10% OR over 100 g for muscle meat', () => {
    // 1.05 kg need rounds to 1.25 kg — surplus 200g, ~19% → shown.
    const big = computePurchase(1050, getIngredient('chicken'));
    expect(big.showSurplus).toBe(true);
    // 245 g need rounds to 250 g — only 5 g over, hide it.
    const tiny = computePurchase(245, getIngredient('chicken'));
    expect(tiny.showSurplus).toBe(false);
  });

  it('rounds organ meat (liver) to 100 g and marks surplus as do-not-feed', () => {
    const result = computePurchase(180, getIngredient('chicken_liver'));
    expect(result.purchaseGrams).toBe(200);
    expect(result.surplusBehavior).toBe('do-not-feed');
  });

  it('whole fish (mackerel) buys by fish, never rounds to grams', () => {
    const result = computePurchase(500, getIngredient('mackerel'));
    expect(result.purchaseUnit).toBe('fish');
    expect(result.purchaseQty).toBeGreaterThanOrEqual(2);
    expect(result.surplusBehavior).toBe('none');
  });

  it('discrete produce (carrots) buys by piece, not grams', () => {
    const result = computePurchase(350, getIngredient('carrots'));
    expect(result.purchaseUnit).toBe('piece');
    // 350g / 80g per carrot → 5 carrots
    expect(result.purchaseQty).toBe(5);
  });

  it('leafy greens (spinach) round to 100 g, never to 250', () => {
    const result = computePurchase(180, getIngredient('spinach'));
    expect(result.purchaseGrams).toBe(200);
  });

  it('unknown ingredient falls back to gram-rounded passthrough', () => {
    const result = computePurchase(123, undefined);
    expect(result.purchaseGrams).toBe(123);
    expect(result.surplusBehavior).toBe('none');
  });

  it('cookedYield param bumps the raw buy amount to compensate for shrinkage', () => {
    // 100 g cooked spinach target × (1 / 0.18) ≈ 556 g raw, then
    // rounded up to the next 100 g step → 600 g.
    const result = computePurchase(100, getIngredient('spinach'), 0.18);
    expect(result.purchaseGrams).toBe(600);
    expect(result.neededGrams).toBe(100);
  });

  it('default cookedYield=1 preserves the legacy (yield-unaware) math', () => {
    // Pre-existing call shape — must keep giving the same answers.
    const legacy = computePurchase(180, getIngredient('spinach'));
    const explicit = computePurchase(180, getIngredient('spinach'), 1);
    expect(legacy.purchaseGrams).toBe(explicit.purchaseGrams);
  });
});

describe('buildShoppingList — veg yield correction', () => {
  it('marks veggies with cookedYield<1 as yieldAdjusted', () => {
    const pet: PetProfile = {
      id: 'p1', name: 'X', allergies: [], conditions: [],
      nutrition: {
        species: 'dog', weightKg: 20, age: 'adult',
        activityLevel: 'moderate', bodyCondition: 'ideal',
        reproductiveStatus: 'neutered', mealsPerDay: 2,
        macroProfile: 'balanced_cooked',
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const days: PlanDay[] = [{
      date: '2026-06-01',
      petPlans: [{
        petId: 'p1',
        meals: [{
          slot: 'breakfast',
          components: [
            { ingredientId: 'spinach', componentKey: 'veg', grams: 100 },
            // peas have yield 1.0 → must NOT be flagged.
            { ingredientId: 'peas', componentKey: 'veg', grams: 100 },
            // meats have edibleYield handled separately, cookedYield=1.
            { ingredientId: 'beef', componentKey: 'protein', grams: 500 },
          ],
          kcal: 0,
        }],
        totalGrams: 700,
        totalKcal: 0,
        warnings: [],
      }],
    }];
    const list = buildShoppingList(days, [pet]);
    const items = list.sections.flatMap((s) => s.items);
    const spinach = items.find((i) => i.ingredientId === 'spinach');
    const peas = items.find((i) => i.ingredientId === 'peas');
    const beef = items.find((i) => i.ingredientId === 'beef');

    expect(spinach?.yieldAdjusted).toBe(true);
    expect(spinach!.purchaseGrams).toBeGreaterThan(400);  // 100g/0.18 → 600g
    expect(peas?.yieldAdjusted).toBe(false);
    expect(beef?.yieldAdjusted).toBe(false);
  });
});
