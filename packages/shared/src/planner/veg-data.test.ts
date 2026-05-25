import { describe, expect, it } from 'vitest';
import ingredientMeta from '@pawcook/data/ingredient-meta';
import {
  listVegCookingIds,
  getVegCookingEntry,
  selectCutMethodSpec,
  yieldForCut,
  applicableCutsFor,
  defaultCutFor,
} from './veg-data.js';

type IngredientMetaShape = {
  ingredients: Array<{ id: string; componentRoles: string[] }>;
};

const META = ingredientMeta as IngredientMetaShape;

// Ingredient ids in ingredient-meta.json with veg-like component
// roles. Used to enforce two-way parity with the cooking JSON.
const VEG_META_IDS = new Set(
  META.ingredients
    .filter((i) => i.componentRoles.some((r) => r === 'veg' || r === 'starch'))
    .map((i) => i.id),
);

describe('vegetable-cooking.json shape', () => {
  it('loads and validates without throwing', () => {
    expect(listVegCookingIds().length).toBeGreaterThan(0);
  });

  it('every veggie advertises a defaultCut that is also in applicableCuts', () => {
    for (const id of listVegCookingIds()) {
      const entry = getVegCookingEntry(id);
      expect(entry, `missing entry for ${id}`).toBeDefined();
      expect(entry!.applicableCuts).toContain(entry!.defaultCut);
    }
  });
});

describe('ingredient-meta ↔ vegetable-cooking parity', () => {
  it('every veg entry in cooking.json has an ingredient-meta entry', () => {
    const cookingIds = listVegCookingIds();
    const missing = cookingIds.filter((id) => !VEG_META_IDS.has(id));
    expect(missing, `cooking.json ids missing from ingredient-meta.json: ${missing.join(', ')}`)
      .toEqual([]);
  });

  it('every veg/starch ingredient that has a cookable form has a cooking.json entry', () => {
    const cookingIds = new Set(listVegCookingIds());
    // Some veg/starch ingredients may legitimately never have a cook
    // step (e.g. rolled oats, seaweed flakes) — keep an opt-out list
    // small and explicit. Empty today; populate as we add such items.
    const ALLOWED_TO_SKIP = new Set<string>([]);
    const missing = Array.from(VEG_META_IDS).filter(
      (id) => !cookingIds.has(id) && !ALLOWED_TO_SKIP.has(id),
    );
    expect(missing, `veg/starch ids missing from cooking.json: ${missing.join(', ')}`)
      .toEqual([]);
  });
});

describe('selectCutMethodSpec', () => {
  it('returns the per-cut override when one exists', () => {
    // User's hero workflow: mandolin slices → sous-vide from frozen.
    const spec = selectCutMethodSpec('carrots', 'mandolin_thin', 'sous_vide');
    expect(spec).not.toBeNull();
    expect(spec!.tempC).toBe(85);
    expect(spec!.minutes.min).toBe(25);
    expect(spec!.fromFrozenAddMin).toBe(10);
  });

  it('falls back to the default cut spec when the per-cut override is absent', () => {
    // 'cubed' is in carrots' applicableCuts but has no specsByCut
    // entry — should return the same as the default 'coins' spec.
    const cubed = selectCutMethodSpec('carrots', 'cubed', 'sous_vide');
    const def = selectCutMethodSpec('carrots', 'coins', 'sous_vide');
    expect(cubed).toEqual(def);
  });

  it('returns null when the method is not supported for the veggie', () => {
    // Spinach has sous_vide: null at the methods level — leafy greens
    // and a sealed bag are a bad combo.
    expect(selectCutMethodSpec('spinach', 'leaves_whole', 'sous_vide')).toBeNull();
  });

  it('returns null for an unapplicable cut on a veggie', () => {
    // Broccoli only knows florets — asking for sticks is incoherent.
    expect(selectCutMethodSpec('broccoli', 'sticks', 'stovetop_low')).toBeNull();
  });
});

describe('yieldForCut', () => {
  it('returns per-cut yield when defined', () => {
    expect(yieldForCut('spinach', 'leaves_whole')).toBe(0.18);
    expect(yieldForCut('carrots', 'mandolin_thin')).toBe(0.78);
    expect(yieldForCut('carrots', 'coins')).toBe(0.88);
  });

  it('returns 1.0 for veggies without a yield entry (safe default)', () => {
    expect(yieldForCut('nonexistent_veg', 'coins')).toBe(1.0);
  });

  it('returns 1.0 for an unmapped cut on a known veggie', () => {
    // Carrots have no leaves_whole yield — they're a root vegetable.
    expect(yieldForCut('carrots', 'leaves_whole')).toBe(1.0);
  });
});

describe('cut helpers', () => {
  it('exposes applicableCuts for a veggie', () => {
    const cuts = applicableCutsFor('carrots');
    expect(cuts).toContain('coins');
    expect(cuts).toContain('mandolin_thin');
    expect(cuts).not.toContain('florets'); // florets is cruciferous-only
  });

  it('exposes defaultCut for a veggie', () => {
    expect(defaultCutFor('carrots')).toBe('coins');
    expect(defaultCutFor('sweet_potato')).toBe('cubed');
    expect(defaultCutFor('spinach')).toBe('leaves_whole');
  });
});
