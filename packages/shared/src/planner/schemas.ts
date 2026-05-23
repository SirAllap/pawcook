import { z } from 'zod';

// ─── Sourcing preferences ────────────────────────────────────────────
// Pricing-free framing — these flags drive which ingredients the
// generator picks, never an estimated cost.
export const VarietyTierSchema = z.enum(['standard', 'diverse', 'novel']);
export type VarietyTier = z.infer<typeof VarietyTierSchema>;

export const AccessibilityTierSchema = z.enum(['easy', 'specialty']);
export type AccessibilityTier = z.infer<typeof AccessibilityTierSchema>;

export const SourcingPrefsSchema = z.object({
  variety: VarietyTierSchema.default('standard'),
  accessibility: AccessibilityTierSchema.default('easy'),
  preferWildFish: z.boolean().default(false),
  preferGrassFed: z.boolean().default(false),
  preferOrganic: z.boolean().default(false),
  dislikedIngredientIds: z.array(z.string()).default([]),
  mustIncludeIngredientIds: z.array(z.string()).default([]),
  pantryIngredientIds: z.array(z.string()).default([]),
});
export type SourcingPrefs = z.infer<typeof SourcingPrefsSchema>;

// ─── Plan structure ──────────────────────────────────────────────────
export const PlanDurationSchema = z.union([
  z.literal(7),
  z.literal(14),
  z.literal(30),
]);
export type PlanDuration = z.infer<typeof PlanDurationSchema>;

const ComponentKeySchema = z.enum([
  'protein', 'muscle', 'bone', 'liver', 'organ',
  'seafood', 'fiber', 'veg', 'seeds', 'fruit', 'starch',
]);

export const PlannedComponentSchema = z.object({
  ingredientId: z.string(),
  componentKey: ComponentKeySchema,
  grams: z.number().nonnegative(),
});
export type PlannedComponent = z.infer<typeof PlannedComponentSchema>;

export const PlannedMealSchema = z.object({
  slot: z.string(),
  components: z.array(PlannedComponentSchema),
  kcal: z.number().nonnegative(),
});
export type PlannedMeal = z.infer<typeof PlannedMealSchema>;

const WarningRefSchema = z.object({
  id: z.string(),
  values: z.record(z.union([z.string(), z.number()])).optional(),
});

export const PetDayPlanSchema = z.object({
  petId: z.string(),
  meals: z.array(PlannedMealSchema),
  totalGrams: z.number().nonnegative(),
  totalKcal: z.number().nonnegative(),
  warnings: z.array(WarningRefSchema).default([]),
});
export type PetDayPlan = z.infer<typeof PetDayPlanSchema>;

export const PlanDaySchema = z.object({
  date: z.string(),
  petPlans: z.array(PetDayPlanSchema),
});
export type PlanDay = z.infer<typeof PlanDaySchema>;

// ─── Shopping list ───────────────────────────────────────────────────
export const ShoppingItemSchema = z.object({
  ingredientId: z.string(),
  componentKey: ComponentKeySchema,
  totalGrams: z.number().nonnegative(),
  storeSection: z.string(),
  forPetIds: z.array(z.string()),
  variantTags: z.array(z.string()).default([]),
});
export type ShoppingItem = z.infer<typeof ShoppingItemSchema>;

export const ShoppingSectionSchema = z.object({
  sectionId: z.string(),
  order: z.number(),
  items: z.array(ShoppingItemSchema),
});
export type ShoppingSection = z.infer<typeof ShoppingSectionSchema>;

export const ShoppingListSchema = z.object({
  sections: z.array(ShoppingSectionSchema),
  totals: z.object({
    itemCount: z.number().nonnegative(),
    totalGrams: z.number().nonnegative(),
  }),
});
export type ShoppingList = z.infer<typeof ShoppingListSchema>;

// ─── Meal plan (root) ────────────────────────────────────────────────
const ISO_DATE = z.string();

export const MealPlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(64),
  petIds: z.array(z.string()).min(1),
  durationDays: PlanDurationSchema,
  startDate: ISO_DATE,
  sourcing: SourcingPrefsSchema,
  days: z.array(PlanDaySchema),
  shoppingList: ShoppingListSchema,
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
});
export type MealPlan = z.infer<typeof MealPlanSchema>;

export function newPlanId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `plan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
