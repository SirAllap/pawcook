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
    id: planId,
    name: input.name,
    petIds: input.pets.map((p) => p.id),
    durationDays: input.durationDays,
    startDate: input.startDate,
    sourcing: input.sourcing,
    days,
    shoppingList,
    cookingPlan,
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

  // When the user opted out of organs, redistribute that mass onto the
  // muscle/protein slot instead of dropping it: the user chose not to
  // *buy* organ, not to feed less food. Nutritional cost (no pre-formed
  // vitamin A, no organ-sourced taurine) is still flagged via warnings.
  const componentsForAllocation = sourcing.includeOrgans
    ? nutrition.components
    : redistributeOrganMass(nutrition.components);

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
  // protein bag covers N consecutive days of the same protein), and 1 for
  // veg-side components (we still want daily veg variety even when the
  // protein blocks). Without this alignment, sous-vide bags can never be
  // filled with N usage-days of the same ingredient — the wizard's
  // "Cook ahead" choice would be cosmetic.
  const blockSize = isMeatComponent(component.key) ? sourcing.bagDays : 1;
  const pick = mustInclude
    ?? pool[rotationIndex(component.key, dayIndex, seed, pool.length, blockSize, durationDays)]
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
