import { z } from 'zod';
import { CookingMethodSchema, VegCutSchema, VegPackagingSchema } from '../schemas.js';

// Bump when MealPlan shape changes in a way migrations care about.
// 1 → pre-veg-cooking
// 2 → veg cookSpec, pantry, sub-threshold supplement cards, sourcing
//     veggieDetail / packagingDefault / cutRotation
export const CURRENT_PLAN_SCHEMA_VERSION = 2 as const;

// ─── Sourcing preferences ────────────────────────────────────────────
// Pricing-free framing — these flags drive which ingredients the
// generator picks, never an estimated cost.
export const VarietyTierSchema = z.enum(['standard', 'diverse', 'novel']);
export type VarietyTier = z.infer<typeof VarietyTierSchema>;

export const AccessibilityTierSchema = z.enum(['easy', 'specialty']);
export type AccessibilityTier = z.infer<typeof AccessibilityTierSchema>;

/**
 * Plan focus — which ingredient class this plan is built around.
 *
 * 'complete' (default) is the historical behaviour: a full, balanced
 * diet mixing meat, fish, organs and veg per the pet's profile.
 *
 * The single-class focuses ('meat' | 'fish' | 'veg') let an owner cook
 * one shopping aisle at a time — "this week I'm only buying fish." A
 * single-class plan portions the *full* daily food mass into that one
 * class (no balancing, no scaling-down to a supplement-sized sliver):
 * it is intentionally a partial diet meant to be paired with the
 * owner's other plans + daily supplements. Because it is nutritionally
 * incomplete on its own, the UI surfaces a loud-but-non-blocking notice
 * (Followability Mandate, sub-principle #4 in /CLAUDE.md: surface
 * deficits loudly; never block the owner's freedom to cook one class).
 */
export const PlanFocusSchema = z.enum(['complete', 'meat', 'fish', 'veg']);
export type PlanFocus = z.infer<typeof PlanFocusSchema>;

export const SourcingPrefsSchema = z.object({
  variety: VarietyTierSchema.default('standard'),
  accessibility: AccessibilityTierSchema.default('easy'),
  /**
   * Which ingredient class this plan is built around. Default 'complete'
   * preserves the historical full-diet behaviour exactly. The single-
   * class values collapse every meal to one class at the full daily
   * gram target — see PlanFocusSchema above and buildPetDay in
   * generator.ts.
   */
  planFocus: PlanFocusSchema.default('complete'),
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
   *
   * Kept for backward compatibility with saved plans. The `simpleMeals`
   * toggle below subsumes this — when simpleMeals is true, organs and
   * other add-in components are dropped and surfaced as supplements
   * regardless of includeOrgans. See /CLAUDE.md (Followability Mandate).
   */
  includeOrgans: z.boolean().default(true),
  /**
   * Simple-meals mode (Followability Mandate; see /CLAUDE.md). When
   * true (the default for the median household), every pet in the
   * plan eats just the rotating muscle protein + a small veg portion
   * — same single ingredient the dogs are cooking for the day. Cat-
   * specific add-ins (organ, liver, seafood supplement) are dropped
   * from meals and surfaced as a daily supplement recommendation
   * (taurine powder + cod liver oil), not silently re-bagged.
   *
   * Set to false to opt into the full multi-component diet profiles
   * (cat_cooked_carnivore with its seafood + organ slots, BARF with
   * its organ/bone slots). Recommended for raw-feeders, vet-supervised
   * diets, and single-pet households where bag overhead is trivial.
   */
  simpleMeals: z.boolean().default(true),
  /**
   * Days of meals each sous-vide bag should cover. Only used when
   * preferredCookingMethod === 'sous_vide'. Default 2 — one bag of meat
   * and one of veg lasts two days across all pets.
   */
  bagDays: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).default(2),
  /**
   * Balance ingredient weights evenly across the plan. Off (default) uses
   * the 2-day alternating block rotation, which leaves an uneven remainder
   * when the plan length doesn't divide evenly by the pool size (e.g. 14
   * days / 3 proteins → 6/4/4 days, so one protein dominates the shopping
   * list). On splits the plan into even *consecutive runs* per ingredient
   * (14 / 3 → 5/5/4 days), so the household buys roughly equal weights of
   * each protein. Each run is still chunked into ≤bagDays bags, so cook-
   * ahead batching is preserved — the trade-off is slightly less day-to-day
   * variety. Opt-in; rigor lives behind a switch (CLAUDE.md sub-principle 7).
   */
  balanceProteins: z.boolean().default(false),
  /**
   * Off (default) = one mixed veggie batch per household per cook day.
   * On = per-veggie cook sessions with staggered schedule and per-cut
   * rotation. Rigor lives behind a switch (CLAUDE.md sub-principle 7).
   */
  veggieDetail: z.boolean().default(false),
  /**
   * Default packaging when portioning veg bags. The user can override
   * per batch in the bag planner; this just seeds the default.
   */
  packagingDefault: VegPackagingSchema.default('freezer_bag'),
  /**
   * Optional cut rotation (rigor mode only). When non-empty and
   * `veggieDetail === true`, the generator block-rotates cut form
   * across days the same way it rotates ingredients. Empty = single
   * default cut from each veggie's metadata.
   */
  cutRotation: z.array(VegCutSchema).default([]),
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
  // True when the purchase amount was bumped to compensate for veg
  // cooking shrinkage (e.g. raw spinach → cooked weight). UI shows
  // a tooltip on these rows so the user understands why they're
  // buying 670 g raw spinach for a 100 g cooked target.
  yieldAdjusted: z.boolean().optional(),
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
  yieldAdjusted: item.yieldAdjusted ?? false,
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

// Per-batch cooking spec. Optional today (older plans don't have it,
// proteins get it populated in a follow-up commit). For veg batches the
// generator fills it in from vegetable-cooking.json keyed by (id, cut,
// method). Sub-fields cut/packaging are veg-only; protein leaves them
// undefined.
export const CookSpecSchema = z.object({
  method: CookingMethodSchema,
  tempC: z.number(),
  minutes: z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
  }),
  cut: VegCutSchema.optional(),
  packaging: VegPackagingSchema.optional(),
  fromFrozen: z.boolean().default(false),
  fromFrozenAddMin: z.number().nonnegative().default(0),
  // Cooked-yield back-calc. For veg with cookedYield < 1, this is the
  // raw weight to buy/prep before cooking. Optional so protein and v1
  // veg batches that haven't been re-saved don't fail validation.
  rawWeightG: z.number().positive().optional(),
  // When multiple veg batches share a cook session (mixed mode), they
  // carry the same sessionGroupId so the UI can render them as one
  // "Sunday cook" card.
  sessionGroupId: z.string().optional(),
  notes: z.string().optional(),
});
export type CookSpec = z.infer<typeof CookSpecSchema>;

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
  cookSpec: CookSpecSchema.optional(),
});
export type CookingBatch = z.infer<typeof CookingBatchSchema>;

// Ingredients excluded from batching (cook-fresh items: organs, raw fish,
// leafy greens, oils). Surfaced as a list under the bag groups so the
// user knows what they still have to handle ad-hoc.
export const CookFreshItemSchema = z.object({
  ingredientId: z.string(),
  reason: z.enum([
    'perishable', 'no-batch-veg', 'organ', 'supplement-equiv',
    // New v2 reason — emitted when a veg's household total falls below
    // SUPPLEMENT_GRAM_THRESHOLD on a per-day basis (CLAUDE.md sub-#3).
    'sub-threshold-veg',
  ]),
  forPetIds: z.array(z.string()),
});
export type CookFreshItem = z.infer<typeof CookFreshItemSchema>;

// Sub-threshold ingredients surfaced as supplement-card rows rather
// than cook steps. Currently only fed by the veg sub-threshold check
// in batching.ts; future flows (taurine, omega3) can reuse the shape.
export const SupplementCardItemSchema = z.object({
  ingredientId: z.string(),
  reason: z.enum(['sub-threshold-veg', 'taurine', 'omega3', 'multivit']),
  forPetIds: z.array(z.string()),
  // Suggested daily dose for the supplement card. Optional because
  // not every reason needs a numeric — taurine has a fixed mg dose
  // surfaced via i18n.
  dailyDoseG: z.number().nonnegative().optional(),
  // i18n key for the card body text. Resolved in the web layer.
  noteI18nKey: z.string().optional(),
});
export type SupplementCardItem = z.infer<typeof SupplementCardItemSchema>;

// A cook session groups veg batches that share a cook day, method,
// temperature — the "Sunday cook" card in the UI. One step per veg
// in the session; order driven by addAtMinute.
export const VeggieSessionStepSchema = z.object({
  ingredientId: z.string(),
  cut: VegCutSchema,
  // Minutes from session start when this veg goes in the pot. 0 = first.
  addAtMinute: z.number().nonnegative(),
  cookMinutes: z.number().positive(),
  rawGrams: z.number().nonnegative(),
  cookedGrams: z.number().nonnegative(),
});
export type VeggieSessionStep = z.infer<typeof VeggieSessionStepSchema>;

export const VeggieSessionSchema = z.object({
  id: z.string(),
  cookDate: ISO_DATE,
  method: CookingMethodSchema,
  tempC: z.number(),
  packaging: VegPackagingSchema,
  fromFrozen: z.boolean().default(false),
  totalMinutes: z.number().positive(),
  steps: z.array(VeggieSessionStepSchema).min(1),
  // Which batches this session produces — referenced back into
  // CookingBatch.id for label/calendar printing.
  batchIds: z.array(z.string()).min(1),
});
export type VeggieSession = z.infer<typeof VeggieSessionSchema>;

export const CookingPlanSchema = z.object({
  bagDays: z.number().int().min(1).max(4),
  batches: z.array(CookingBatchSchema),
  cookFresh: z.array(CookFreshItemSchema),
  // Both optional so older plans keep parsing. Default empty when read.
  supplementCards: z.array(SupplementCardItemSchema).optional(),
  veggieSessions: z.array(VeggieSessionSchema).optional(),
});
export type CookingPlan = z.infer<typeof CookingPlanSchema>;

// Cooked-veg the user has frozen and saved for next week. Subtracted
// from next week's shopping list when the plan is regenerated.
export const PantryItemSchema = z.object({
  ingredientId: z.string(),
  cut: VegCutSchema.optional(),
  cookedGramsFrozen: z.number().nonnegative(),
  asOf: ISO_DATE,
});
export type PantryItem = z.infer<typeof PantryItemSchema>;

// ─── Meal plan (root) ────────────────────────────────────────────────
export const MealPlanSchema = z.object({
  // Per-plan schema version. Missing = v1 (legacy, pre-veg-cooking).
  // Migrations in planner/migrations.ts bump this on load.
  schemaVersion: z.literal(1).or(z.literal(2)).optional(),
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
  // Whether the shopping list applies raw→cooked yield correction.
  // v1 plans default to false on migration so existing lists do not
  // suddenly demand 6× more spinach. v2 plans set it true on regen.
  appliesCookYield: z.boolean().optional(),
  // User-saved frozen veg cubes carried into next plan. Empty on a
  // freshly-generated plan; populated by "Save for next week" in the
  // VegBagPlanner UI.
  pantry: z.array(PantryItemSchema).optional(),
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
});
export type MealPlan = z.infer<typeof MealPlanSchema>;

export function newPlanId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `plan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
