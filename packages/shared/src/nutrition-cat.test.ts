import { describe, expect, it } from 'vitest';
import { calculateNutrition } from './nutrition.js';
import type { NutritionInput } from './schemas.js';

const catBase: NutritionInput = {
  species: 'cat',
  weightKg: 4,
  age: 'adult',
  activityLevel: 'moderate',
  bodyCondition: 'ideal',
  reproductiveStatus: 'neutered',
  mealsPerDay: 2,
  macroProfile: 'cat_pmr',
};

describe('cat nutrition — energy', () => {
  it('neutered 4 kg adult ≈ 260 kcal (RER ≈ 198 × 1.2 multiplier)', () => {
    const r = calculateNutrition(catBase);
    expect(r.rerKcal).toBeGreaterThanOrEqual(196);
    expect(r.rerKcal).toBeLessThanOrEqual(202);
    expect(r.derKcal).toBeGreaterThanOrEqual(235);
    expect(r.derKcal).toBeLessThanOrEqual(244);
  });

  it('intact 4 kg adult uses a higher (×1.4) multiplier', () => {
    const r = calculateNutrition({ ...catBase, reproductiveStatus: 'intact' });
    expect(r.derKcal).toBeGreaterThan(catBase.weightKg * 50); // ~277
  });

  it('kitten ages get a 2.0–2.5× multiplier', () => {
    const r = calculateNutrition({ ...catBase, age: 'kitten', weightKg: 2.5 });
    // RER for 2.5kg ≈ 139, × ~2.0 = ~279 minimum
    expect(r.derKcal).toBeGreaterThan(270);
  });
});

describe('cat nutrition — taurine guardrails', () => {
  it('cooked cat diet flags lowTaurine warning + fails AAFCO', () => {
    const r = calculateNutrition({ ...catBase, macroProfile: 'cat_cooked_carnivore' });
    expect(r.warnings.map((w) => w.id)).toContain('lowTaurine');
    expect(r.aafcoStatus).toBe('fail');
  });

  it('raw PMR diet has natural taurine (hearts assumed) — passes', () => {
    const r = calculateNutrition(catBase);
    expect(r.warnings.map((w) => w.id)).not.toContain('lowTaurine');
    expect(r.notes.map((n) => n.id)).toContain('taurineHeartsNote');
  });
});

describe('cat nutrition — vitamin A ceiling', () => {
  it('does not flag vit A toxicity for default 5% liver share', () => {
    const r = calculateNutrition(catBase);
    expect(r.warnings.map((w) => w.id)).not.toContain('vitAToxicity');
  });
});

describe('cat nutrition — Ca:P band', () => {
  it('PMR cat diet sits within AAFCO Ca:P 1.0–2.0 (naturally near 1.8 due to bone)', () => {
    const r = calculateNutrition(catBase);
    expect(r.caPRatio).toBeGreaterThanOrEqual(1.0);
    expect(r.caPRatio).toBeLessThanOrEqual(2.0);
  });
});

describe('cat nutrition — schema coherence', () => {
  it('all cat profiles produce a positive daily food range', () => {
    const profiles = ['cat_pmr', 'cat_frankenprey', 'cat_whole_prey', 'cat_barf_lite', 'cat_cooked_carnivore'] as const;
    for (const macroProfile of profiles) {
      const r = calculateNutrition({ ...catBase, macroProfile });
      expect(r.dailyFoodGrams.min).toBeGreaterThan(0);
      expect(r.dailyFoodGrams.max).toBeGreaterThan(r.dailyFoodGrams.min);
    }
  });

  it('cooked profile always includes cookedCatSupplements note', () => {
    const r = calculateNutrition({ ...catBase, macroProfile: 'cat_cooked_carnivore' });
    expect(r.notes.map((n) => n.id)).toContain('cookedCatSupplementsNote');
  });

  it('every cat result includes the hydration note', () => {
    const r = calculateNutrition(catBase);
    expect(r.notes.map((n) => n.id)).toContain('hydrationCatNote');
  });
});
