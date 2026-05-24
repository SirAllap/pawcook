import type { PetProfile } from '../pets.js';
import { getIngredient, type Ingredient } from './catalog.js';
import type {
  CookFreshItem,
  CookingBatch,
  CookingPlan,
  PlanDay,
  SourcingPrefs,
} from './schemas.js';

// Absolute frozen shelf life for cooked sous-vide. Beyond this, fat
// oxidation and freezer burn dominate even in vacuum bags — we reject
// bag windows that would force the user to eat 60+ day-old food.
const FROZEN_SHELF_LIFE_DAYS = 60;
// How long before the first serve date a bag moves from freezer to
// fridge. 24h is the standard guideline for cooked-then-frozen meat.
const THAW_LEAD_HOURS = 24;
// Followability Mandate (see /CLAUDE.md sub-principle 3): anything in
// the add-in classes (seafood, organ, liver, fiber) producing less than
// this many grams per pet per day is treated as a supplement, not an
// ingredient — it gets routed to cookFresh regardless of what
// policy.maxBagDays says. This is the structural fix that makes the
// salmon-as-6g-supplement-in-7-bags bug impossible to reintroduce.
const SUPPLEMENT_GRAM_THRESHOLD = 20;
const ADD_IN_COMPONENT_ROLES = new Set(['seafood', 'organ', 'liver', 'fiber']);

interface IngredientUsage {
  date: string;
  grams: number;
  petIds: Set<string>;
}

interface BatchingResult {
  batches: CookingBatch[];
  cookFresh: CookFreshItem[];
  /**
   * Bag windows that would violate the 60-day frozen-shelf-life rule.
   * Surfaced to the caller as a warning rather than throwing so the plan
   * still generates; the UI nudges the user to either shorten the plan
   * or shrink bagDays.
   */
  warnings: string[];
}

/**
 * Group cooked food into sous-vide bags. One ingredient per bag, one
 * protein per bag, never combining proteins. Each bag covers up to
 * `bagDays` usage-days for that ingredient (capped per-ingredient by
 * policy.maxBagDays) and up to policy.maxBagWeightG cooked weight.
 *
 * Ingredients with policy.maxBagDays === 0 are routed to cookFresh
 * instead — they're listed alongside the bags so the user knows what
 * still needs daily handling (organs, fish, oils, leafy greens).
 */
export function buildCookingPlan(
  days: PlanDay[],
  pets: PetProfile[],
  prefs: SourcingPrefs,
): CookingPlan {
  const result = buildBatches(days, pets, prefs.bagDays);
  return {
    bagDays: prefs.bagDays,
    batches: result.batches,
    cookFresh: result.cookFresh,
  };
}

function buildBatches(
  days: PlanDay[],
  pets: PetProfile[],
  bagDays: 1 | 2 | 3 | 4,
): BatchingResult {
  const usageByIngredient = collectUsage(days);
  const petOrder = new Map(pets.map((p, i) => [p.id, i]));

  const batches: CookingBatch[] = [];
  const cookFresh: CookFreshItem[] = [];
  const warnings: string[] = [];

  for (const [ingredientId, usages] of usageByIngredient) {
    const ingredient = getIngredient(ingredientId);
    if (!ingredient) continue;
    const policy = ingredient.policy;

    // Followability gate: an add-in-class ingredient producing tiny
    // per-pet-per-day quantities is a supplement, not a meal. Route to
    // cookFresh ahead of the policy.maxBagDays check so a stale
    // per-ingredient override can't accidentally re-bag a 6 g/day cat
    // omega-3 portion. See /CLAUDE.md sub-principle 3.
    const isAddIn = ingredient.componentRoles.some((r) => ADD_IN_COMPONENT_ROLES.has(r));
    const petIdSet = collectPetIds(usages, petOrder);
    const totalGrams = usages.reduce((s, u) => s + u.grams, 0);
    const days = usages.length;
    const perPetPerDayGrams = days > 0 && petIdSet.length > 0
      ? totalGrams / days / petIdSet.length
      : 0;
    const supplementSized = isAddIn && perPetPerDayGrams < SUPPLEMENT_GRAM_THRESHOLD;

    if (policy.maxBagDays <= 0 || supplementSized) {
      cookFresh.push({
        ingredientId,
        reason: classifyCookFresh(ingredient),
        forPetIds: petIdSet,
      });
      continue;
    }

    // Allergy-aware cross-pet batching: if any pet in the usage set lists
    // this ingredient as an allergen, fall back to per-pet bags. Keeps
    // the user from accidentally dosing the wrong dog from a shared bag.
    const allergic = pets.filter((p) =>
      p.allergies.some((a) => a === ingredientId || a === ingredient.label.toLowerCase()),
    );
    const splitPerPet = !policy.allowCrossPetBatching || allergic.length > 0;

    const streams: IngredientUsage[][] = splitPerPet
      ? splitByPet(usages, pets)
      : [usages];

    for (const stream of streams) {
      const windows = chunkUsages(stream, Math.min(bagDays, policy.maxBagDays), policy.maxBagWeightG, policy.maxFridgeHoursPostThaw);
      const total = windows.length;
      windows.forEach((window, idx) => {
        const sortedDates = window.map((u) => u.date).sort();
        const first = sortedDates[0]!;
        const last = sortedDates[sortedDates.length - 1]!;
        const cook = isoOffset(first, -1);
        const thaw = cook;
        const useByCap = isoOffset(cook, FROZEN_SHELF_LIFE_DAYS);
        const useByThaw = isoOffset(last, 3);
        const useBy = earliest(useByCap, useByThaw);
        if (daysBetween(cook, last) > FROZEN_SHELF_LIFE_DAYS) {
          warnings.push(`Bag for ${ingredient.label} would sit ${daysBetween(cook, last)} days frozen`);
        }
        const totalGrams = window.reduce((s, u) => s + u.grams, 0);
        const petIds = collectPetIds(window, petOrder);
        const dates = sortedDates;
        batches.push({
          id: `bag_${ingredientId}_${idx + 1}_${first}`,
          ingredientId,
          kind: ingredientKind(ingredient),
          sequence: idx + 1,
          totalInSequence: total,
          dates,
          forPetIds: petIds,
          totalGrams: Math.round(totalGrams),
          cookDate: cook,
          thawDate: thaw,
          useByDate: useBy,
          rotationGap: hasGap(dates),
        });
      });
    }
  }

  // Stable order: by ingredient (alphabetical), then sequence. Keeps the
  // UI predictable across regenerates with the same seed.
  batches.sort((a, b) => {
    if (a.ingredientId !== b.ingredientId) return a.ingredientId < b.ingredientId ? -1 : 1;
    return a.sequence - b.sequence;
  });

  return { batches, cookFresh, warnings };
}

function collectUsage(days: PlanDay[]): Map<string, IngredientUsage[]> {
  const out = new Map<string, IngredientUsage[]>();
  for (const day of days) {
    const dayBuckets = new Map<string, IngredientUsage>();
    for (const pp of day.petPlans) {
      for (const meal of pp.meals) {
        for (const c of meal.components) {
          if (c.grams <= 0) continue;
          const bucket = dayBuckets.get(c.ingredientId) ?? {
            date: day.date,
            grams: 0,
            petIds: new Set<string>(),
          };
          bucket.grams += c.grams;
          bucket.petIds.add(pp.petId);
          dayBuckets.set(c.ingredientId, bucket);
        }
      }
    }
    for (const [id, bucket] of dayBuckets) {
      const list = out.get(id) ?? [];
      list.push(bucket);
      out.set(id, list);
    }
  }
  // Ensure chronological order for the chunker.
  for (const list of out.values()) list.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

function splitByPet(usages: IngredientUsage[], pets: PetProfile[]): IngredientUsage[][] {
  return pets.map((pet) =>
    usages
      .filter((u) => u.petIds.has(pet.id))
      .map((u) => ({
        date: u.date,
        // When splitting per-pet, the bag only holds this pet's share. We
        // don't have a per-pet gram breakdown on the bucket, so derive
        // an even split — accurate enough since the planner emits equal
        // per-meal portions.
        grams: u.grams / u.petIds.size,
        petIds: new Set([pet.id]),
      })),
  ).filter((stream) => stream.length > 0);
}

function chunkUsages(
  usages: IngredientUsage[],
  maxUsageDays: number,
  maxBagWeightG: number,
  maxFridgeHoursPostThaw: number,
): IngredientUsage[][] {
  const out: IngredientUsage[][] = [];
  if (usages.length === 0) return out;
  const maxCalendarSpan = Math.max(1, Math.floor(maxFridgeHoursPostThaw / 24));

  let current: IngredientUsage[] = [];
  for (const u of usages) {
    if (current.length === 0) {
      current.push(u);
      continue;
    }
    const firstDate = current[0]!.date;
    const newWeight = current.reduce((s, x) => s + x.grams, 0) + u.grams;
    const calendarSpan = daysBetween(firstDate, u.date);
    const tooMany = current.length >= maxUsageDays;
    const tooHeavy = maxBagWeightG > 0 && newWeight > maxBagWeightG;
    const tooLongInFridge = calendarSpan > maxCalendarSpan;
    if (tooMany || tooHeavy || tooLongInFridge) {
      out.push(current);
      current = [u];
    } else {
      current.push(u);
    }
  }
  if (current.length > 0) out.push(current);
  return out;
}

function collectPetIds(usages: IngredientUsage[], order: Map<string, number>): string[] {
  const set = new Set<string>();
  for (const u of usages) for (const id of u.petIds) set.add(id);
  return Array.from(set).sort((a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999));
}

function ingredientKind(ing: Ingredient): 'protein' | 'veg' {
  const protein = ing.componentRoles.some((r) =>
    r === 'protein' || r === 'muscle' || r === 'seafood' || r === 'liver' || r === 'organ' || r === 'bone',
  );
  return protein ? 'protein' : 'veg';
}

function classifyCookFresh(ing: Ingredient): CookFreshItem['reason'] {
  if (ing.storeSection === 'supplements') return 'supplement-equiv';
  if (ing.componentRoles.some((r) => r === 'liver' || r === 'organ')) return 'organ';
  if (ing.componentRoles.includes('seafood')) return 'perishable';
  return 'no-batch-veg';
}

function hasGap(dates: string[]): boolean {
  if (dates.length <= 1) return false;
  for (let i = 1; i < dates.length; i++) {
    if (daysBetween(dates[i - 1]!, dates[i]!) > 1) return true;
  }
  return false;
}

function isoOffset(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z').getTime();
  const db = new Date(b + 'T00:00:00Z').getTime();
  return Math.round((db - da) / 86_400_000);
}

function earliest(a: string, b: string): string {
  return a < b ? a : b;
}

export const COOKING_CONSTANTS = {
  FROZEN_SHELF_LIFE_DAYS,
  THAW_LEAD_HOURS,
};
