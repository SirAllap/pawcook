import { z } from 'zod';
import { CookingMethodSchema } from '../schemas.js';

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
  /**
   * How the user plans to cook this plan's meat. Stored with the plan so
   * that "Cook this" from the shopping list can pre-select the method
   * without asking again — the planner itself doesn't read this field.
   */
  preferredCookingMethod: CookingMethodSchema.default('sous_vide'),
  preferWildFish: z.boolean().default(false),
  preferGrassFed: z.boolean().default(false),
  preferOrganic: z.boolean().default(false),
  dislikedIngredientIds: z.array(z.string()).default([]),
  mustIncludeIngredientIds: z.array(z.string()).default([]),
  pantryIngredientIds: z.array(z.string()).default([]),
  /**
   * Explicit whitelist of meat-side ingredient ids the user wants in the
   * plan (proteins, organs, fish). Empty = any meat allowed by the
   * variety/accessibility tiers. Non-empty narrows the protein pool to
   * exactly these ids before tier filtering is applied.
   */
  meatIds: z.array(z.string()).default([]),
  /**
   * Same idea as meatIds, but for produce-side components (veg, fiber).
   * Empty = any veg allowed.
   */
  vegIds: z.array(z.string()).default([]),
  /**
   * Whether the planner should include organ meats (liver, kidney,
   * spleen) in the shopping list. Default true preserves the
   * historically more nutritionally complete plan. Setting false skips
   * the organ/liver component slots entirely — useful for users who
   * prefer to source these separately or don't buy them at all.
   */
  includeOrgans: z.boolean().default(true),
  /**
   * Days of meals each sous-vide bag should cover. Only used when
   * preferredCookingMethod === 'sous_vide'. Default 2 — one bag of meat
   * and one of veg lasts two days across all pets.
   */
  bagDays: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).default(2),
});
export type SourcingPrefs = z.infer<typeof SourcingPrefsSchema>;

// Shared ISO date primitive. Hoisted so cooking-batch schemas can use it.
const ISO_DATE = z.string();

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
const PurchaseUnitSchema = z.enum([
  'g', 'piece', 'pack', 'bunch', 'punnet', 'fish', 'bottle',
]);
const SurplusBehaviorSchema = z.enum(['freeze', 'do-not-feed', 'discard', 'none']);

// Inner shape — required fields only. Defaults for the new (post-rounding)
// columns are applied in the .transform below so plans saved before the
// feature shipped still parse.
const ShoppingItemBaseSchema = z.object({
  ingredientId: z.string(),
  componentKey: ComponentKeySchema,
  // Kept for backward compatibility with the calorie-summing UI and
  // downstream consumers (Cook button) that pass grams to the calculator.
  totalGrams: z.number().nonnegative(),
  // Precise grams needed across all pets and days (yield-adjusted).
  // Optional for plans saved before this feature shipped.
  neededGrams: z.number().nonnegative().optional(),
  // After rounding/unit conversion — the amount the user actually buys,
  // expressed in grams. Falls back to totalGrams for legacy plans.
  purchaseGrams: z.number().nonnegative().optional(),
  purchaseQty: z.number().nonnegative().optional(),
  purchaseUnit: PurchaseUnitSchema.optional(),
  surplusGrams: z.number().optional(),
  surplusBehavior: SurplusBehaviorSchema.optional(),
  showSurplus: z.boolean().optional(),
  storeSection: z.string(),
  forPetIds: z.array(z.string()),
  variantTags: z.array(z.string()).default([]),
});

export const ShoppingItemSchema = ShoppingItemBaseSchema.transform((item) => ({
  ...item,
  neededGrams: item.neededGrams ?? item.totalGrams,
  purchaseGrams: item.purchaseGrams ?? item.totalGrams,
  purchaseQty: item.purchaseQty ?? item.totalGrams,
  purchaseUnit: item.purchaseUnit ?? ('g' as const),
  surplusGrams: item.surplusGrams ?? 0,
  surplusBehavior: item.surplusBehavior ?? ('none' as const),
  showSurplus: item.showSurplus ?? false,
}));
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

// ─── Cooking batches (sous-vide bags) ────────────────────────────────
// One bag = one ingredient, covering N usage-days for the pets that eat
// from it. Dates may be non-consecutive when proteins rotate; the UI
// surfaces that via `rotationGap` and the bag's `dates` array.
export const CookingBatchSchema = z.object({
  id: z.string(),
  ingredientId: z.string(),
  // 'protein' (butcher/fish) vs 'veg' — keeps grouping headers tidy.
  kind: z.enum(['protein', 'veg']),
  sequence: z.number().int().positive(),
  totalInSequence: z.number().int().positive(),
  // Calendar dates the bag's meals fall on. Length matches usage-days
  // for this ingredient inside the bag's window; not always consecutive.
  dates: z.array(ISO_DATE).min(1),
  forPetIds: z.array(z.string()).min(1),
  totalGrams: z.number().positive(),
  cookDate: ISO_DATE,
  thawDate: ISO_DATE,
  useByDate: ISO_DATE,
  rotationGap: z.boolean(),
});
export type CookingBatch = z.infer<typeof CookingBatchSchema>;

// Ingredients excluded from batching (cook-fresh items: organs, raw fish,
// leafy greens, oils). Surfaced as a list under the bag groups so the
// user knows what they still have to handle ad-hoc.
export const CookFreshItemSchema = z.object({
  ingredientId: z.string(),
  reason: z.enum(['perishable', 'no-batch-veg', 'organ', 'supplement-equiv']),
  forPetIds: z.array(z.string()),
});
export type CookFreshItem = z.infer<typeof CookFreshItemSchema>;

export const CookingPlanSchema = z.object({
  bagDays: z.number().int().min(1).max(4),
  batches: z.array(CookingBatchSchema),
  cookFresh: z.array(CookFreshItemSchema),
});
export type CookingPlan = z.infer<typeof CookingPlanSchema>;

// ─── Meal plan (root) ────────────────────────────────────────────────
export const MealPlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(64),
  petIds: z.array(z.string()).min(1),
  durationDays: PlanDurationSchema,
  startDate: ISO_DATE,
  sourcing: SourcingPrefsSchema,
  days: z.array(PlanDaySchema),
  shoppingList: ShoppingListSchema,
  /**
   * Optional — only generated when preferredCookingMethod === 'sous_vide'.
   * Older saved plans won't have it; the Cooking plan tab degrades to a
   * hint pointing the user at the wizard.
   */
  cookingPlan: CookingPlanSchema.optional(),
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
});
export type MealPlan = z.infer<typeof MealPlanSchema>;

export function newPlanId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `plan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
