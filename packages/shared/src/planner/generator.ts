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
      buildPetDay(pet, d, seed, input.sourcing),
    );
    days.push({ date, petPlans });
  }

  const shoppingList = buildShoppingList(days, input.pets);

  return {
    id: planId,
    name: input.name,
    petIds: input.pets.map((p) => p.id),
    durationDays: input.durationDays,
    startDate: input.startDate,
    sourcing: input.sourcing,
    days,
    shoppingList,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

function buildPetDay(
  pet: PetProfile,
  dayIndex: number,
  seed: number,
  sourcing: SourcingPrefs,
): PetDayPlan {
  const nutrition = calculateNutrition(pet.nutrition);
  const components = nutrition.components;
  const dislikedSet = new Set(sourcing.dislikedIngredientIds);

  const allocations: PlannedComponent[] = components
    .filter((c) => c.grams > 0)
    .map((component) => pickIngredientForComponent(pet, component, dayIndex, seed, sourcing, dislikedSet));

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

function pickIngredientForComponent(
  pet: PetProfile,
  component: DietComponent,
  dayIndex: number,
  seed: number,
  sourcing: SourcingPrefs,
  dislikedSet: Set<string>,
): PlannedComponent {
  const species = pet.nutrition.species;
  const candidates = findIngredientsForComponent(
    component.key,
    species,
    dislikedSet,
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

  const pick = mustInclude
    ?? pool[rotationIndex(component.key, dayIndex, seed, pool.length)]
    // last-resort fallback so the type is always defined
    ?? { id: 'unknown', label: 'Unknown' } as Ingredient;

  return {
    ingredientId: pick.id,
    componentKey: component.key,
    grams: Math.max(0, Math.round(component.grams)),
  };
}

function rotationIndex(componentKey: string, dayIndex: number, seed: number, poolLen: number): number {
  if (poolLen <= 0) return 0;
  // Component-specific offset so different components rotate independently.
  const componentSeed = hashSeed(componentKey);
  return Math.abs((dayIndex * 31 + componentSeed + seed)) % poolLen;
}

function splitIntoMeals(
  allocations: PlannedComponent[],
  mealsPerDay: number,
  nutrition: NutritionResult,
): PlannedMeal[] {
  const kcalPerMeal = nutrition.derKcal / Math.max(1, mealsPerDay);
  const meals: PlannedMeal[] = [];

  for (let i = 0; i < mealsPerDay; i++) {
    const components: PlannedComponent[] = allocations.map((a) => ({
      ingredientId: a.ingredientId,
      componentKey: a.componentKey,
      grams: Math.round(a.grams / mealsPerDay),
    }));
    meals.push({
      slot: mealSlot(i, mealsPerDay),
      components,
      kcal: Math.round(kcalPerMeal),
    });
  }

  return meals;
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
