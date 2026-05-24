import type { PetProfile } from '../pets.js';
import { getIngredient, getStoreSection, STORE_SECTIONS, type Ingredient } from './catalog.js';
import type { IngredientPolicy, PurchaseUnit, SurplusBehavior } from './policy.js';
import type {
  MealPlan,
  PlanDay,
  ShoppingItem,
  ShoppingList,
  ShoppingSection,
} from './schemas.js';

/**
 * Aggregate all planned components across pets and days into a shopping
 * list grouped by store section. Each item's purchase quantity is rounded
 * per the ingredient's policy (250 g for muscle meat, per-piece for whole
 * fish, no rounding for supplements, etc.) and surplus is reported so the
 * UI can show "X needed - Y to freeze".
 */
export function buildShoppingList(days: PlanDay[], pets: PetProfile[]): ShoppingList {
  type Bucket = { totalGrams: number; petIds: Set<string>; componentKey: string };
  const byIngredient = new Map<string, Bucket>();

  for (const day of days) {
    for (const petPlan of day.petPlans) {
      for (const meal of petPlan.meals) {
        for (const c of meal.components) {
          const bucket = byIngredient.get(c.ingredientId) ?? {
            totalGrams: 0,
            petIds: new Set<string>(),
            componentKey: c.componentKey,
          };
          bucket.totalGrams += c.grams;
          bucket.petIds.add(petPlan.petId);
          byIngredient.set(c.ingredientId, bucket);
        }
      }
    }
  }

  // Group items by their store section.
  const bySection = new Map<string, ShoppingItem[]>();
  let totalGrams = 0;

  for (const [ingredientId, bucket] of byIngredient) {
    const ingredient = getIngredient(ingredientId);
    const sectionId = ingredient?.storeSection ?? 'other';
    const purchase = computePurchase(bucket.totalGrams, ingredient);

    const item: ShoppingItem = {
      ingredientId,
      componentKey: bucket.componentKey as ShoppingItem['componentKey'],
      // Keep `totalGrams` aligned with the purchase amount so the existing
      // Cook button passes the right kilos to the calculator. Consumers
      // that need the unrounded need read `neededGrams` instead.
      totalGrams: purchase.purchaseGrams,
      neededGrams: Math.round(purchase.neededGrams),
      purchaseGrams: purchase.purchaseGrams,
      purchaseQty: purchase.purchaseQty,
      purchaseUnit: purchase.purchaseUnit,
      surplusGrams: Math.round(purchase.surplusGrams),
      surplusBehavior: purchase.surplusBehavior,
      showSurplus: purchase.showSurplus,
      storeSection: sectionId,
      forPetIds: orderPetIds(Array.from(bucket.petIds), pets),
      variantTags: ingredient?.tags ?? [],
    };

    const list = bySection.get(sectionId) ?? [];
    list.push(item);
    bySection.set(sectionId, list);
    totalGrams += item.purchaseGrams;
  }

  const sections: ShoppingSection[] = Array.from(bySection.entries())
    .map(([sectionId, items]) => {
      const meta = getStoreSection(sectionId);
      items.sort((a, b) => b.purchaseGrams - a.purchaseGrams);
      return {
        sectionId,
        order: meta?.order ?? 99,
        items,
      };
    })
    .sort((a, b) => a.order - b.order);

  const itemCount = sections.reduce((sum, s) => sum + s.items.length, 0);

  return {
    sections,
    totals: { itemCount, totalGrams: Math.round(totalGrams) },
  };
}

interface PurchaseCalc {
  neededGrams: number;
  purchaseGrams: number;
  purchaseQty: number;
  purchaseUnit: PurchaseUnit;
  surplusGrams: number;
  surplusBehavior: SurplusBehavior;
  showSurplus: boolean;
}

// Pure function so it can be reused by swap/recalc paths and tested
// independently. Falls back to the legacy "round to nearest gram" when an
// ingredient is missing from the catalog so the shopping list never
// crashes on unknown ids.
export function computePurchase(rawNeedG: number, ingredient: Ingredient | undefined): PurchaseCalc {
  if (!ingredient) {
    const g = Math.max(0, Math.round(rawNeedG));
    return {
      neededGrams: g,
      purchaseGrams: g,
      purchaseQty: g,
      purchaseUnit: 'g',
      surplusGrams: 0,
      surplusBehavior: 'none',
      showSurplus: false,
    };
  }

  const policy: IngredientPolicy = ingredient.policy;
  // Bone-in adjustment: meals are in edible grams, the butcher sells the
  // bone too. Dividing by yield bumps the buy amount up to compensate.
  const yieldAdj = rawNeedG / Math.max(policy.edibleYield, 0.01);

  let purchaseGrams: number;
  let purchaseQty: number;

  if (policy.purchaseUnit === 'g') {
    purchaseGrams = applyGramRounding(yieldAdj, policy);
    purchaseQty = purchaseGrams;
  } else {
    // Unit-based items (pieces, fish, packs): convert grams to unit count
    // first, then back to grams so surplus is still expressible.
    const perUnit = Math.max(policy.gramsPerUnit, 1);
    purchaseQty = Math.max(1, Math.ceil(yieldAdj / perUnit));
    purchaseGrams = purchaseQty * perUnit;
  }

  const surplusGrams = Math.max(0, purchaseGrams - rawNeedG);
  // Two thresholds OR'd: 10% (or whatever the class sets) AND 100 g floor.
  // Below both we hide the surplus line entirely — butcher tolerance is
  // wider than what we'd nag the user about.
  const pctOver = rawNeedG > 0 ? surplusGrams / rawNeedG : 0;
  const showSurplus = surplusGrams > 0
    && (pctOver >= policy.surplusDisplayThresholdPct || surplusGrams >= 100)
    && policy.surplusBehavior !== 'none';

  return {
    neededGrams: rawNeedG,
    purchaseGrams,
    purchaseQty,
    purchaseUnit: policy.purchaseUnit,
    surplusGrams,
    surplusBehavior: policy.surplusBehavior,
    showSurplus,
  };
}

function applyGramRounding(grams: number, policy: IngredientPolicy): number {
  if (policy.roundDirection === 'none' || policy.roundingStepGrams <= 0) {
    return Math.max(0, Math.round(grams));
  }
  const step = policy.roundingStepGrams;
  if (policy.roundDirection === 'up') return Math.ceil(grams / step) * step;
  return Math.round(grams / step) * step;
}

/**
 * Swap one ingredient for another across an existing plan. Re-aggregates
 * the shopping list. Returns a new plan (input is not mutated). The
 * cooking plan is intentionally NOT rebuilt here — swaps are point-edits
 * that don't need to re-bag everything; callers wanting the new bags
 * should regenerate the plan instead.
 */
export function swapIngredient(
  plan: MealPlan,
  oldIngredientId: string,
  newIngredientId: string,
  pets: PetProfile[],
): MealPlan {
  const days: PlanDay[] = plan.days.map((day) => ({
    ...day,
    petPlans: day.petPlans.map((pp) => ({
      ...pp,
      meals: pp.meals.map((m) => ({
        ...m,
        components: m.components.map((c) =>
          c.ingredientId === oldIngredientId ? { ...c, ingredientId: newIngredientId } : c,
        ),
      })),
    })),
  }));

  return {
    ...plan,
    days,
    shoppingList: buildShoppingList(days, pets),
    updatedAt: new Date().toISOString(),
  };
}

function orderPetIds(petIds: string[], pets: PetProfile[]): string[] {
  const order = new Map(pets.map((p, i) => [p.id, i]));
  return [...petIds].sort((a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999));
}

export { STORE_SECTIONS, getStoreSection, getIngredient };
export type { ShoppingItem, ShoppingSection };
