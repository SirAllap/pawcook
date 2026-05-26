import type { CookingBatch, MealPlan } from '@pawcook/shared';

export interface PetPortion {
  petId: string;
  grams: number;
}

/**
 * Per-pet gram split for a single cooking batch. Walks the plan's day
 * structure, summing component grams that match the batch's ingredient
 * on each of the batch's serving days, restricted to the pets the bag
 * is for. The bag's totalGrams is the sum across pets and days — this
 * function decomposes that sum back into the per-pet portions the owner
 * scoops at bowl time (CLAUDE.md sub-#1: the deviation we cannot afford
 * to leave silent).
 */
export function computeBatchPortions(plan: MealPlan, batch: CookingBatch): PetPortion[] {
  const days = new Set(batch.dates);
  const allowedPets = new Set(batch.forPetIds);
  const totals = new Map<string, number>();
  for (const day of plan.days) {
    if (!days.has(day.date)) continue;
    for (const petPlan of day.petPlans) {
      if (!allowedPets.has(petPlan.petId)) continue;
      let grams = 0;
      for (const meal of petPlan.meals) {
        for (const comp of meal.components) {
          if (comp.ingredientId === batch.ingredientId) grams += comp.grams;
        }
      }
      if (grams > 0) totals.set(petPlan.petId, (totals.get(petPlan.petId) ?? 0) + grams);
    }
  }
  return batch.forPetIds
    .map((petId) => ({ petId, grams: Math.round(totals.get(petId) ?? 0) }))
    .filter((p) => p.grams > 0);
}
