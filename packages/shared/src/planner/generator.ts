import { calculateNutrition } from '../nutrition.js';
import type { DietComponent, NutritionResult, NutritionWarning } from '../nutrition.js';
import type { PetProfile } from '../pets.js';
import {
  filterBySourcing,
  findIngredientsForComponent,
  isMeatComponent,
  isVegComponent,
  type Ingredient,
} from './catalog.js';
import {
  newPlanId,
  type MealPlan,
  type PlanDay,
  type PlannedComponent,
  type PlannedMeal,
  type PetDayPlan,
  type SourcingPrefs,
  type PlanDuration,
} from './schemas.js';
import { buildShoppingList } from './shopping.js';
import { buildCookingPlan } from './batching.js';

export interface GeneratePlanInput {
  name: string;
  pets: PetProfile[];
  durationDays: PlanDuration;
  startDate: string;
  sourcing: SourcingPrefs;
}

/**
 * Build a multi-pet meal plan. Each pet's per-day target comes from
 * `calculateNutrition`, then ingredients fill each component slot using
 * deterministic rotation seeded by the plan id (so regenerate gives a
 * different but reproducible plan).
 */
export function generateMealPlan(input: GeneratePlanInput): MealPlan {
  const planId = newPlanId();
  const nowIso = new Date().toISOString();
  const seed = hashSeed(planId);

  const days: PlanDay[] = [];

  for (let d = 0; d < input.durationDays; d++) {
    const date = addDaysIso(input.startDate, d);
    const petPlans: PetDayPlan[] = input.pets.map((pet) =>
      buildPetDay(pet, d, seed, input.sourcing, input.durationDays),
    );
    days.push({ date, petPlans });
  }

  const shoppingList = buildShoppingList(days, input.pets);
  // Only build the cooking plan for sous-vide. Other methods (oven,
  // stovetop, slow cooker) are governed by tray/pot size, not batch
  // days — generating bags for them would imply a workflow we don't
  // actually support.
  const cookingPlan = input.sourcing.preferredCookingMethod === 'sous_vide'
    ? buildCookingPlan(days, input.pets, input.sourcing)
    : undefined;

  return {
    schemaVersion: 2,
    id: planId,
    name: input.name,
    petIds: input.pets.map((p) => p.id),
    durationDays: input.durationDays,
    startDate: input.startDate,
    sourcing: input.sourcing,
    days,
    shoppingList,
    cookingPlan,
    // New plans always apply veg cooking-shrinkage to the shopping
    // list. v1 plans on migration keep appliesCookYield=false so
    // their saved shopping lists don't suddenly change shape.
    appliesCookYield: true,
    pantry: [],
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

function buildPetDay(
  pet: PetProfile,
  dayIndex: number,
  seed: number,
  sourcing: SourcingPrefs,
  durationDays: number,
): PetDayPlan {
  const nutrition = calculateNutrition(pet.nutrition);
  const dislikedSet = new Set(sourcing.dislikedIngredientIds);

  // Component reshape order matters:
  //  1. simpleMeals (Followability Mandate, /CLAUDE.md): drop every
  //     add-in component (organ, liver, seafood, fiber) — these are
  //     daily supplement-sized portions the owner won't realistically
  //     maintain. Their mass redistributes onto muscle/protein so the
  //     pet still hits the kcal + gram target. Deficits (taurine,
  //     pre-formed vitamin A, omega-3) are flagged via warnings and
  //     surfaced as supplement recommendations in the UI.
  //  2. includeOrgans (legacy toggle): if simpleMeals is OFF and the
  //     user explicitly excluded organs, drop liver + organ slots and
  //     redistribute that mass to protein.
  let componentsForAllocation = nutrition.components;
  if (sourcing.simpleMeals) {
    componentsForAllocation = collapseToSimpleMeal(componentsForAllocation);
  } else if (!sourcing.includeOrgans) {
    componentsForAllocation = redistributeOrganMass(componentsForAllocation);
  }

  const allocations: PlannedComponent[] = componentsForAllocation
    .filter((c) => c.grams > 0)
    .map((component) =>
      pickIngredientForComponent(pet, component, dayIndex, seed, sourcing, dislikedSet, durationDays),
    );

  const meals = splitIntoMeals(allocations, pet.nutrition.mealsPerDay, nutrition);

  const totalGrams = allocations.reduce((s, a) => s + a.grams, 0);
  const totalKcal = meals.reduce((s, m) => s + m.kcal, 0);

  return {
    petId: pet.id,
    meals,
    totalGrams,
    totalKcal: Math.round(totalKcal),
    warnings: nutrition.warnings.map((w: NutritionWarning) => ({ id: w.id, values: w.values })),
  };
}

/**
 * When the user excludes organs, fold the dropped 'liver' + 'organ' grams
 * into the largest muscle-meat slot ('protein' if present, otherwise the
 * first remaining component). This keeps the daily food mass close to the
 * pet's body-weight range — without it, cats lose ~20% of mass and end up
 * under their daily gram target while kcal-correct.
 */
function redistributeOrganMass(components: DietComponent[]): DietComponent[] {
  const dropped = components
    .filter((c) => c.key === 'liver' || c.key === 'organ')
    .reduce((s, c) => s + c.grams, 0);
  if (dropped <= 0) return components.filter((c) => c.key !== 'liver' && c.key !== 'organ');
  const kept = components.filter((c) => c.key !== 'liver' && c.key !== 'organ');
  const target = kept.find((c) => c.key === 'protein') ?? kept.find((c) => c.key === 'muscle') ?? kept[0];
  if (!target) return kept;
  return kept.map((c) => (c === target ? { ...c, grams: c.grams + dropped } : c));
}

/**
 * Followability Mandate (see /CLAUDE.md): collapse the diet profile into
 * a single muscle-protein slot plus optional veg / starch. Add-in
 * components (organ, liver, seafood, fiber, bone) are removed and their
 * grams redistributed to the muscle/protein slot so totalGrams and kcal
 * stay on target. Result: the pet eats the same single protein as the
 * rest of the household with a small veg side — no daily 3 g organ
 * sprinkles, no 6 g salmon-as-supplement.
 *
 * Nutritional deficits (taurine, pre-formed vit A, omega-3) are still
 * flagged via the engine's warnings; the UI surfaces them as supplement
 * cards.
 */
const SIMPLE_MEAL_KEEP_KEYS = new Set(['protein', 'muscle', 'veg', 'starch']);
function collapseToSimpleMeal(components: DietComponent[]): DietComponent[] {
  const dropped = components
    .filter((c) => !SIMPLE_MEAL_KEEP_KEYS.has(c.key))
    .reduce((s, c) => s + c.grams, 0);
  const kept = components.filter((c) => SIMPLE_MEAL_KEEP_KEYS.has(c.key));
  if (kept.length === 0) return kept;
  // Canonicalize muscle → protein so multi-species households share the
  // rotation key. Without this, a cat profile that uses 'muscle' and a
  // dog profile that uses 'protein' would hash to different rotation
  // seeds and end up cooking different proteins on the same day —
  // violating the "household is the unit" sub-principle (/CLAUDE.md #2).
  const normalized: DietComponent[] = kept.map((c) =>
    c.key === 'muscle' ? { ...c, key: 'protein' as const } : c,
  );
  // Merge any duplicate 'protein' entries that resulted from the rename
  // (rare, but possible if a profile listed both 'protein' and 'muscle').
  const merged: DietComponent[] = [];
  for (const c of normalized) {
    const existing = merged.find((m) => m.key === c.key);
    if (existing) existing.pct += c.pct, existing.grams += c.grams;
    else merged.push({ ...c });
  }
  if (dropped <= 0) return merged;
  const target = merged.find((c) => c.key === 'protein') ?? merged[0]!;
  return merged.map((c) => (c === target ? { ...c, grams: c.grams + dropped } : c));
}

function pickIngredientForComponent(
  pet: PetProfile,
  component: DietComponent,
  dayIndex: number,
  seed: number,
  sourcing: SourcingPrefs,
  dislikedSet: Set<string>,
  durationDays: number,
): PlannedComponent {
  const species = pet.nutrition.species;
  // Per-pet exclude set = plan-level dislikes + this pet's allergies.
  // Without this, an allergic pet would silently get the offending
  // ingredient via the shared rotation.
  const excludeForPet = new Set(dislikedSet);
  for (const a of pet.allergies) excludeForPet.add(a);
  const candidates = findIngredientsForComponent(
    component.key,
    species,
    excludeForPet,
    pet.conditions,
  );

  // If the user picked an explicit set of meats/veggies, restrict the pool
  // to those for the matching component family before tier filtering. We
  // gracefully fall back to the full candidate pool if the intersection
  // ends up empty so the slot never goes unfilled.
  let scoped = candidates;
  if (sourcing.meatIds.length > 0 && isMeatComponent(component.key)) {
    const allowed = new Set(sourcing.meatIds);
    const intersect = candidates.filter((i) => allowed.has(i.id));
    if (intersect.length > 0) scoped = intersect;
  } else if (sourcing.vegIds.length > 0 && isVegComponent(component.key)) {
    const allowed = new Set(sourcing.vegIds);
    const intersect = candidates.filter((i) => allowed.has(i.id));
    if (intersect.length > 0) scoped = intersect;
  }

  let pool = filterBySourcing(scoped, sourcing.variety, sourcing.accessibility);

  // If sourcing filter empties the pool, fall back to species+component candidates
  // so the plan never produces an empty slot. Generator surfaces a warning later.
  if (pool.length === 0) pool = scoped.length > 0 ? scoped : candidates;

  // Must-include ingredients win the slot whenever they're a valid candidate.
  const mustInclude = sourcing.mustIncludeIngredientIds
    .map((id) => pool.find((p) => p.id === id))
    .find((p): p is Ingredient => Boolean(p));

  // Block size for rotation = bagDays for protein-side components (so each
  // Block size = bagDays for every component (meat AND veg) so each bag
  // can hold N consecutive days of the same ingredient. Daily rotation
  // of veggies would leave veg bags partially filled with one day's
  // worth even though the user picked "Cook ahead = 2 days." One veggie
  // per bag is the companion rule to one protein per bag (see /CLAUDE.md
  // sub-principle 6: the cook flow drives the meal plan).
  const blockSize = sourcing.bagDays;
  // Balanced mode (opt-in): assign even consecutive runs per ingredient so
  // the plan's shopping list buys roughly equal weights of each protein/veg,
  // instead of the alternating rotation's uneven remainder. See balancedIndex
  // and SourcingPrefs.balanceProteins (CLAUDE.md sub-principle 7).
  const poolIdx = sourcing.balanceProteins
    ? balancedIndex(component.key, dayIndex, seed, pool.length, durationDays)
    : rotationIndex(component.key, dayIndex, seed, pool.length, blockSize, durationDays);
  const pick = mustInclude
    ?? pool[poolIdx]
    // last-resort fallback so the type is always defined
    ?? { id: 'unknown', label: 'Unknown' } as Ingredient;

  return {
    ingredientId: pick.id,
    componentKey: component.key,
    grams: Math.max(0, Math.round(component.grams)),
  };
}

/**
 * Block rotation. dayIndex 0..durationDays-1 maps onto a block index by
 * integer division by blockSize, so all days in the same block resolve to
 * the same ingredient. blockSize=1 = daily rotation (preserves prior
 * behaviour). Seed determinism is preserved because the seed mixes into
 * the result identically — the only change is the cadence of advances.
 */
function rotationIndex(
  componentKey: string,
  dayIndex: number,
  seed: number,
  poolLen: number,
  blockSize: number,
  _durationDays: number,
): number {
  if (poolLen <= 0) return 0;
  const block = Math.floor(dayIndex / Math.max(1, blockSize));
  // Component-specific offset so different components rotate independently.
  const componentSeed = hashSeed(componentKey);
  return Math.abs((block * 31 + componentSeed + seed)) % poolLen;
}

/**
 * Balanced allocation (opt-in via `SourcingPrefs.balanceProteins`). Splits
 * the plan into one *consecutive run* per pool entry, sized as evenly as
 * possible: `durationDays` divided by `poolLen`, with the first `rem` runs
 * getting one extra day. Over 14 days with 3 proteins this yields 5/5/4
 * days instead of the alternating rotation's 6/4/4 — so each ingredient's
 * total weight in the shopping list comes out roughly equal.
 *
 * Determinism mirrors rotationIndex: the (componentKey + seed) offset
 * rotates which pool entry leads, so different components stay independent
 * and regenerate produces a different-but-reproducible plan. Because the
 * mapping is a pure function of (componentKey, dayIndex, poolLen, seed),
 * every pet sharing the same pool resolves to the same ingredient on the
 * same day — household batching is preserved (CLAUDE.md sub-principle 2).
 *
 * Runs are consecutive, so batching.ts chunks each run into ≤bagDays bags
 * (a 5-day run → 2 + 2 + 1), keeping the cook-ahead contract intact.
 */
function balancedIndex(
  componentKey: string,
  dayIndex: number,
  seed: number,
  poolLen: number,
  durationDays: number,
): number {
  if (poolLen <= 0) return 0;
  const base = Math.floor(durationDays / poolLen);
  const rem = durationDays % poolLen;
  // Walk run boundaries to find which run dayIndex lands in. The first
  // `rem` runs are one day longer so the days distribute as evenly as
  // integer division allows.
  let start = 0;
  let run = 0;
  for (; run < poolLen; run++) {
    const len = base + (run < rem ? 1 : 0);
    if (dayIndex < start + len) break;
    start += len;
  }
  const offset = hashSeed(componentKey) + seed;
  return Math.abs(run + offset) % poolLen;
}

function splitIntoMeals(
  allocations: PlannedComponent[],
  mealsPerDay: number,
  nutrition: NutritionResult,
): PlannedMeal[] {
  const meals = Math.max(1, mealsPerDay);
  const kcalPerMeal = nutrition.derKcal / meals;
  const out: PlannedMeal[] = [];

  // Round once at the day level, then distribute that integer across the
  // meals (giving the leftover grams to the first meals). Without this,
  // independent per-meal Math.round() shaves ~½ g per component per meal —
  // on small cats with five components × two meals, that's enough mass
  // loss to drop a 130 g/day plan to 99 g/day.
  const perMealComponents: PlannedComponent[][] = Array.from({ length: meals }, () => []);
  for (const a of allocations) {
    const dayTotal = Math.max(0, Math.round(a.grams));
    const base = Math.floor(dayTotal / meals);
    const remainder = dayTotal - base * meals;
    for (let i = 0; i < meals; i++) {
      perMealComponents[i]!.push({
        ingredientId: a.ingredientId,
        componentKey: a.componentKey,
        grams: base + (i < remainder ? 1 : 0),
      });
    }
  }

  for (let i = 0; i < meals; i++) {
    out.push({
      slot: mealSlot(i, meals),
      components: perMealComponents[i]!,
      kcal: Math.round(kcalPerMeal),
    });
  }

  return out;
}

function mealSlot(index: number, total: number): string {
  if (total === 1) return 'meal';
  if (total === 2) return index === 0 ? 'breakfast' : 'dinner';
  if (total === 3) return ['breakfast', 'lunch', 'dinner'][index] ?? `meal-${index + 1}`;
  return `meal-${index + 1}`;
}

function addDaysIso(startIso: string, days: number): string {
  const d = new Date(startIso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
