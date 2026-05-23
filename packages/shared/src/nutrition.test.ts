import { describe, expect, it } from 'vitest';
import { calculateNutrition, calcRER, modifiedAtwater, toDryMatter } from './nutrition.js';

describe('calcRER', () => {
  it('matches 70 · BW^0.75 for a 20 kg dog (≈662 kcal)', () => {
    expect(Math.round(calcRER(20))).toBe(662);
  });
});

describe('modifiedAtwater', () => {
  it('returns ~3.5 kcal/g for 25 P + 5 F + 70 C dry matter', () => {
    // (3.5*25 + 3.5*70 + 8.5*5) / 100 = (87.5 + 245 + 42.5) / 100 = 3.75
    expect(modifiedAtwater(25, 70, 5)).toBeCloseTo(3.75, 2);
  });
});

describe('toDryMatter', () => {
  it('converts as-fed to DM correctly (10% protein at 70% moisture = 33.3% DM)', () => {
    expect(toDryMatter(10, 70)).toBeCloseTo(33.33, 1);
  });
});

describe('calculateNutrition', () => {
  const base = {
    species: 'dog' as const,
    weightKg: 20, age: 'adult' as const, activityLevel: 'moderate' as const,
    bodyCondition: 'ideal' as const, reproductiveStatus: 'neutered' as const,
    mealsPerDay: 2, macroProfile: 'balanced_cooked' as const,
  };

  it('PMR raw diet has a healthy Ca:P ratio within the 1:1–2:1 safe range', () => {
    const r = calculateNutrition({ ...base, macroProfile: 'pmr' });
    expect(r.caPRatio).toBeGreaterThanOrEqual(1);
    expect(r.caPRatio).toBeLessThanOrEqual(2);
    expect(r.aafcoStatus).not.toBe('fail');
  });

  it('cooked balanced diet recommends a calcium supplement', () => {
    const r = calculateNutrition({ ...base, macroProfile: 'balanced_cooked' });
    expect(r.calciumSupplementMg).toBeGreaterThan(0);
    expect(r.warnings.map(w => w.id)).toContain('cookedCaDeficient');
  });

  it('produces component grams that sum approximately to mid daily food', () => {
    const r = calculateNutrition(base);
    const totalGrams = r.components.reduce((s, c) => s + c.grams, 0);
    const midDaily = (r.dailyFoodGrams.min + r.dailyFoodGrams.max) / 2;
    // Allow ±5 g of rounding error
    expect(Math.abs(totalGrams - midDaily)).toBeLessThan(5);
  });

  it('BARF diet exposes all 7 components from the PDF profile', () => {
    const r = calculateNutrition({ ...base, macroProfile: 'barf' });
    expect(r.components).toHaveLength(7);
    expect(r.isRawDiet).toBe(true);
  });

  it('Real Ancestral diet includes seafood and animal fiber', () => {
    const r = calculateNutrition({ ...base, macroProfile: 'real_ancestral' });
    expect(r.components.map(c => c.key)).toContain('seafood');
    expect(r.components.map(c => c.key)).toContain('fiber');
  });
});
