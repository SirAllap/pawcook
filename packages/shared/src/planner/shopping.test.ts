import { describe, expect, it } from 'vitest';
import { computePurchase } from './shopping.js';
import { getIngredient } from './catalog.js';

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
});
