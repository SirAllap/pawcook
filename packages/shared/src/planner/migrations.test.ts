import { describe, expect, it } from 'vitest';
import { migratePlan } from './migrations.js';
import { MealPlanSchema, CURRENT_PLAN_SCHEMA_VERSION } from './schemas.js';

// Minimal valid plan body shared across tests. Field set matches what
// the generator emits today; absent v2 fields force the migration to
// fill them in.
function legacyPlan(overrides: Record<string, unknown> = {}) {
  return {
    id: 'plan_test_1',
    name: 'Legacy Plan',
    petIds: ['pet_1'],
    durationDays: 7,
    startDate: '2026-06-01',
    sourcing: {
      variety: 'standard',
      accessibility: 'easy',
      preferredCookingMethod: 'sous_vide',
      preferWildFish: false,
      preferGrassFed: false,
      preferOrganic: false,
      dislikedIngredientIds: [],
      mustIncludeIngredientIds: [],
      pantryIngredientIds: [],
      meatIds: [],
      vegIds: [],
      includeOrgans: true,
      simpleMeals: true,
      bagDays: 2,
    },
    days: [
      {
        date: '2026-06-01',
        petPlans: [{
          petId: 'pet_1',
          meals: [{ slot: 'breakfast', components: [], kcal: 0 }],
          totalGrams: 0,
          totalKcal: 0,
          warnings: [],
        }],
      },
    ],
    shoppingList: {
      sections: [],
      totals: { itemCount: 0, totalGrams: 0 },
    },
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('migratePlan', () => {
  it('v1 plan (no schemaVersion) migrates to current version', () => {
    const raw = legacyPlan();
    const migrated = migratePlan(raw);
    expect(migrated).not.toBeNull();
    expect(migrated!.schemaVersion).toBe(CURRENT_PLAN_SCHEMA_VERSION);
  });

  it('migrated v1 plan keeps appliesCookYield off by default', () => {
    // Hard requirement: a plan saved before yield correction shipped
    // must NOT suddenly demand 6× more spinach on next page load.
    const migrated = migratePlan(legacyPlan());
    expect(migrated!.appliesCookYield).toBe(false);
  });

  it('migrated v1 plan gets empty pantry array', () => {
    const migrated = migratePlan(legacyPlan());
    expect(Array.isArray(migrated!.pantry)).toBe(true);
    expect((migrated!.pantry as unknown[]).length).toBe(0);
  });

  it('migrated v1 sourcing gets median-home veggie defaults', () => {
    const migrated = migratePlan(legacyPlan()) as { sourcing: Record<string, unknown> };
    expect(migrated.sourcing.veggieDetail).toBe(false);
    expect(migrated.sourcing.packagingDefault).toBe('freezer_bag');
    expect(migrated.sourcing.cutRotation).toEqual([]);
  });

  it('migrated v1 cookingPlan gets empty supplementCards / veggieSessions', () => {
    const raw = legacyPlan({
      cookingPlan: {
        bagDays: 2,
        batches: [],
        cookFresh: [],
      },
    });
    const migrated = migratePlan(raw) as {
      cookingPlan: { supplementCards: unknown[]; veggieSessions: unknown[] };
    };
    expect(migrated.cookingPlan.supplementCards).toEqual([]);
    expect(migrated.cookingPlan.veggieSessions).toEqual([]);
  });

  it('v2 plan passes through unchanged (no-op)', () => {
    const raw = legacyPlan({
      schemaVersion: 2,
      appliesCookYield: true,
      pantry: [{ ingredientId: 'carrots', cookedGramsFrozen: 300, asOf: '2026-06-10' }],
    });
    const migrated = migratePlan(raw);
    expect(migrated!.schemaVersion).toBe(2);
    expect(migrated!.appliesCookYield).toBe(true);
    expect(migrated!.pantry).toEqual([
      { ingredientId: 'carrots', cookedGramsFrozen: 300, asOf: '2026-06-10' },
    ]);
  });

  it('returns null for non-object input', () => {
    expect(migratePlan(null)).toBeNull();
    expect(migratePlan(42)).toBeNull();
    expect(migratePlan([])).toBeNull();
  });

  it('migrated plan parses cleanly through MealPlanSchema', () => {
    const migrated = migratePlan(legacyPlan());
    const parsed = MealPlanSchema.safeParse(migrated);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.schemaVersion).toBe(CURRENT_PLAN_SCHEMA_VERSION);
      expect(parsed.data.sourcing.veggieDetail).toBe(false);
    }
  });

  it('does not crash when sourcing already has the new fields', () => {
    const raw = legacyPlan({
      sourcing: {
        variety: 'standard', accessibility: 'easy',
        preferredCookingMethod: 'sous_vide', preferWildFish: false,
        preferGrassFed: false, preferOrganic: false,
        dislikedIngredientIds: [], mustIncludeIngredientIds: [],
        pantryIngredientIds: [], meatIds: [], vegIds: [],
        includeOrgans: true, simpleMeals: true, bagDays: 2,
        veggieDetail: true,
        packagingDefault: 'vacuum_seal',
        cutRotation: ['mandolin_thin', 'coins'],
      },
    });
    const migrated = migratePlan(raw) as { sourcing: Record<string, unknown> };
    // Migration preserves user's explicit choices instead of clobbering.
    expect(migrated.sourcing.veggieDetail).toBe(true);
    expect(migrated.sourcing.packagingDefault).toBe('vacuum_seal');
    expect(migrated.sourcing.cutRotation).toEqual(['mandolin_thin', 'coins']);
  });
});
