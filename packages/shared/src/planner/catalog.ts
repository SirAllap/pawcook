import ingredientMeta from '@pawcook/data/ingredient-meta';
import meatsData from '@pawcook/data/meats';
import vegData from '@pawcook/data/vegetables';
import fruitsData from '@pawcook/data/fruits';
import type { ComponentKey } from '../nutrition.js';
import type { Species } from '../schemas.js';
import type { VarietyTier, AccessibilityTier } from './schemas.js';
import type { HealthCondition } from '../pets.js';
import { resolvePolicy, type IngredientPolicy, type PolicyOverride } from './policy.js';

export type StoreSection = {
  id: string;
  order: number;
  label: string;
};

export type RotationRule = {
  everyDays?: number;
  maxConsecutiveDays?: number;
};

export type Ingredient = {
  id: string;
  label: string;
  componentRoles: ComponentKey[];
  species: Species[];
  varietyTier: VarietyTier;
  accessibility: AccessibilityTier;
  storeSection: string;
  tags: string[];
  catMaxPctDaily?: number;
  dogMaxPctDaily?: number;
  rotation?: RotationRule;
  avoidForConditions?: HealthCondition[];
  notes?: string;
  catNotes?: string;
  policy: IngredientPolicy;
};

type RawMeta = {
  id: string;
  label?: string;
  componentRoles: ComponentKey[];
  species: Species[];
  varietyTier: VarietyTier;
  accessibility: AccessibilityTier;
  storeSection: string;
  tags?: string[];
  catMaxPctDaily?: number;
  dogMaxPctDaily?: number;
  rotation?: RotationRule;
  avoidForConditions?: HealthCondition[];
  policy?: PolicyOverride;
};

type Labelable = { id: string; label: string; notes?: string; catNotes?: string };

const labelLookup = new Map<string, Labelable>();
for (const m of meatsData as Labelable[]) labelLookup.set(m.id, m);
for (const v of vegData as Labelable[]) labelLookup.set(v.id, v);
for (const f of fruitsData as Labelable[]) labelLookup.set(f.id, f);

const meta = ingredientMeta as {
  ingredients: RawMeta[];
  storeSections: StoreSection[];
};

export const STORE_SECTIONS: StoreSection[] = meta.storeSections;
const sectionLookup = new Map(STORE_SECTIONS.map((s) => [s.id, s]));

export const INGREDIENTS: Ingredient[] = meta.ingredients.map((raw) => {
  const labelable = labelLookup.get(raw.id);
  const partial: Omit<Ingredient, 'policy'> = {
    id: raw.id,
    label: raw.label ?? labelable?.label ?? raw.id,
    componentRoles: raw.componentRoles,
    species: raw.species,
    varietyTier: raw.varietyTier,
    accessibility: raw.accessibility,
    storeSection: raw.storeSection,
    tags: raw.tags ?? [],
    catMaxPctDaily: raw.catMaxPctDaily,
    dogMaxPctDaily: raw.dogMaxPctDaily,
    rotation: raw.rotation,
    avoidForConditions: raw.avoidForConditions,
    notes: labelable?.notes,
    catNotes: labelable?.catNotes,
  };
  // Resolve at module load using only the fields the policy reader needs.
  // `partial as Ingredient` is safe because `resolvePolicy` never touches
  // `policy` on its input.
  return { ...partial, policy: resolvePolicy(partial as Ingredient, raw.policy) };
});

const ingredientLookup = new Map(INGREDIENTS.map((i) => [i.id, i]));

export function getIngredient(id: string): Ingredient | undefined {
  return ingredientLookup.get(id);
}

export function getStoreSection(id: string): StoreSection | undefined {
  return sectionLookup.get(id);
}

/**
 * Return all ingredients capable of filling `componentKey` for `species`,
 * with the species/component/condition filters applied. Sourcing-tier
 * filtering happens later (see filterBySourcing).
 */
export function findIngredientsForComponent(
  componentKey: ComponentKey,
  species: Species,
  excludeIds: Set<string>,
  conditions: HealthCondition[],
): Ingredient[] {
  return INGREDIENTS.filter((i) => {
    if (excludeIds.has(i.id)) return false;
    if (!i.species.includes(species)) return false;
    if (!i.componentRoles.includes(componentKey)) return false;
    if (i.avoidForConditions && i.avoidForConditions.some((c) => conditions.includes(c))) {
      return false;
    }
    return true;
  });
}

// Component keys we treat as "meat-side" (proteins, organs, fish) vs
// "veg-side" (vegetables and fibrous starches). Used by the planner UI to
// surface meaningful pickers and by the generator to apply a user's
// explicit whitelist only to the relevant components.
export const MEAT_COMPONENT_KEYS = ['protein', 'muscle', 'bone', 'liver', 'organ', 'seafood'] as const;
export const VEG_COMPONENT_KEYS  = ['veg', 'fiber', 'starch', 'fruit'] as const;

export type MeatComponentKey = typeof MEAT_COMPONENT_KEYS[number];
export type VegComponentKey  = typeof VEG_COMPONENT_KEYS[number];

export function isMeatComponent(key: ComponentKey): boolean {
  return (MEAT_COMPONENT_KEYS as readonly string[]).includes(key);
}
export function isVegComponent(key: ComponentKey): boolean {
  return (VEG_COMPONENT_KEYS as readonly string[]).includes(key);
}

/**
 * All ingredients that can fill at least one meat-side component for the
 * given species. Used to populate the planner's "meats to include" picker.
 */
export function getMeatIngredients(species: Species): Ingredient[] {
  return INGREDIENTS.filter(
    (i) => i.species.includes(species)
      && i.componentRoles.some((r) => isMeatComponent(r)),
  );
}

/**
 * All ingredients that can fill at least one veg-side component for the
 * given species. Used to populate the planner's "veggies to include" picker.
 */
export function getVegIngredients(species: Species): Ingredient[] {
  return INGREDIENTS.filter(
    (i) => i.species.includes(species)
      && i.componentRoles.some((r) => isVegComponent(r)),
  );
}

/**
 * Narrow a candidate pool by sourcing preferences. Variety tier acts as a
 * floor: 'standard' allows everything, 'diverse' adds diverse+novel,
 * 'novel' restricts to novel proteins (for allergy elimination diets).
 * Accessibility 'easy' excludes specialty items; 'specialty' allows both.
 */
export function filterBySourcing(
  pool: Ingredient[],
  variety: VarietyTier,
  accessibility: AccessibilityTier,
): Ingredient[] {
  const allowedTiers: VarietyTier[] = variety === 'novel'
    ? ['novel']
    : variety === 'diverse'
      ? ['standard', 'diverse', 'novel']
      : ['standard', 'diverse'];

  return pool.filter((i) => {
    if (!allowedTiers.includes(i.varietyTier)) return false;
    if (accessibility === 'easy' && i.accessibility === 'specialty') return false;
    return true;
  });
}
