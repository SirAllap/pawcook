import type { PetProfile } from '../pets.js';
import { getIngredient, getStoreSection, STORE_SECTIONS } from './catalog.js';
import type {
  MealPlan,
  PlanDay,
  ShoppingItem,
  ShoppingList,
  ShoppingSection,
} from './schemas.js';

/**
 * Aggregate all planned components across pets and days into a shopping
 * list grouped by store section. Pet attribution is tracked so the UI
 * can label cat-only or dog-only items in mixed-species plans.
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

    const item: ShoppingItem = {
      ingredientId,
      componentKey: bucket.componentKey as ShoppingItem['componentKey'],
      totalGrams: Math.round(bucket.totalGrams),
      storeSection: sectionId,
      forPetIds: orderPetIds(Array.from(bucket.petIds), pets),
      variantTags: ingredient?.tags ?? [],
    };

    const list = bySection.get(sectionId) ?? [];
    list.push(item);
    bySection.set(sectionId, list);
    totalGrams += item.totalGrams;
  }

  const sections: ShoppingSection[] = Array.from(bySection.entries())
    .map(([sectionId, items]) => {
      const meta = getStoreSection(sectionId);
      items.sort((a, b) => b.totalGrams - a.totalGrams);
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
    totals: { itemCount, totalGrams },
  };
}

/**
 * Swap one ingredient for another across an existing plan. Re-aggregates
 * the shopping list. Returns a new plan (input is not mutated).
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
