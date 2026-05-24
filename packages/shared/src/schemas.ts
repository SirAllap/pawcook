import { z } from 'zod';

export const MeatTypeSchema = z.enum([
  'beef', 'chicken', 'turkey', 'lamb', 'pork',
  'duck', 'rabbit', 'venison', 'salmon', 'mackerel',
  'sardines', 'whitefish',
]);

export const MeatFormSchema = z.enum(['minced', 'cubed', 'whole_cut', 'fillet']);

export const CookingMethodSchema = z.enum([
  'sous_vide', 'oven', 'stovetop_low', 'slow_cooker',
]);
export type CookingMethod = z.infer<typeof CookingMethodSchema>;

export const FatContentSchema = z.enum(['lean', 'medium', 'fatty']);

export const TemperatureUnitSchema = z.enum(['celsius', 'fahrenheit']);

export const CookingInputSchema = z.object({
  meatType: MeatTypeSchema,
  form: MeatFormSchema,
  cookingMethod: CookingMethodSchema,
  fatContent: FatContentSchema.default('medium'),
  temperatureUnit: TemperatureUnitSchema.default('celsius'),
  weightKg: z.number().min(0.1).max(5).optional(),
  numberOfBags: z.number().int().min(1).max(20).optional(),
  thicknessCm: z.number().min(1).max(10).optional(),
  totalWeightKg: z.number().min(0.1).max(30).optional(),
}).superRefine((data, ctx) => {
  if (data.cookingMethod === 'sous_vide') {
    if (data.weightKg == null) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['weightKg'], message: 'Required' });
    if (data.numberOfBags == null) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['numberOfBags'], message: 'Required' });
    if (data.thicknessCm == null) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['thicknessCm'], message: 'Required' });
  } else {
    if (data.totalWeightKg == null) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['totalWeightKg'], message: 'Required' });
  }
});

export type CookingInput = z.infer<typeof CookingInputSchema>;

// ─── Species ──────────────────────────────────────────────────────
export const SpeciesSchema = z.enum(['dog', 'cat']);
export type Species = z.infer<typeof SpeciesSchema>;

// ─── Life-stage (orthogonal to species) ──────────────────────────
// 'puppy' and 'kitten' both map to growth math; UI surfaces one or
// the other based on species. The engine treats them equivalently.
export const PetAgeSchema = z.enum(['puppy', 'kitten', 'adult', 'senior']);
export type PetAge = z.infer<typeof PetAgeSchema>;

export const ActivityLevelSchema = z.enum(['sedentary', 'moderate', 'active', 'working']);
export const BodyConditionSchema = z.enum(['underweight', 'ideal', 'overweight']);
export const ReproductiveStatusSchema = z.enum(['intact', 'neutered', 'pregnant', 'lactating']);

// Dog diet profiles (the original five).
export const DogMacroProfileSchema = z.enum([
  'balanced_cooked',
  'high_protein',
  'pmr',
  'barf',
  'real_ancestral',
]);

// Preparation method, orthogonal to the diet approach itself. Each preset
// has a canonical default (BARF/PMR/Ancestral → raw; Balanced/HighProtein
// → fully_cooked); the user can override per-pet via the Cooking method
// toggle on the form. PMR is locked to raw because cooked bone is unsafe.
export const CookingPreparationSchema = z.enum(['raw', 'lightly_cooked', 'fully_cooked']);
export type CookingPreparation = z.infer<typeof CookingPreparationSchema>;

// Cat diet profiles — obligate-carnivore aware.
//   • cat_cooked_carnivore : cooked, mandatory taurine + B-complex supplement
//   • cat_pmr              : prey-model raw 84/6/10 (muscle/bone/organ)
//   • cat_frankenprey      : same 84/6/10 ratios assembled from cuts
//   • cat_whole_prey       : informational only (mice, quail) — engine still computes targets
//   • cat_barf_lite        : raw with small veg + seafood, taurine still required
export const CatMacroProfileSchema = z.enum([
  'cat_cooked_carnivore',
  'cat_pmr',
  'cat_frankenprey',
  'cat_whole_prey',
  'cat_barf_lite',
]);

export const MacroRatioProfileSchema = z.union([DogMacroProfileSchema, CatMacroProfileSchema]);
export type MacroRatioProfile = z.infer<typeof MacroRatioProfileSchema>;
export type DogMacroProfile = z.infer<typeof DogMacroProfileSchema>;
export type CatMacroProfile = z.infer<typeof CatMacroProfileSchema>;

// ─── Nutrition input ──────────────────────────────────────────────
export const NutritionInputSchema = z.object({
  species: SpeciesSchema.default('dog'),
  weightKg: z.number().min(0.5).max(120),
  idealWeightKg: z.number().min(0.5).max(120).optional(),
  age: PetAgeSchema,
  activityLevel: ActivityLevelSchema,
  bodyCondition: BodyConditionSchema.default('ideal'),
  reproductiveStatus: ReproductiveStatusSchema.default('neutered'),
  mealsPerDay: z.number().int().min(1).max(4).default(2),
  macroProfile: MacroRatioProfileSchema.default('balanced_cooked'),
  cookingMethod: CookingPreparationSchema.optional(),
}).superRefine((data, ctx) => {
  // Cross-field validation: species × age × profile coherence
  if (data.species === 'dog' && data.age === 'kitten') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['age'], message: 'Dogs use "puppy", not "kitten".' });
  }
  if (data.species === 'cat' && data.age === 'puppy') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['age'], message: 'Cats use "kitten", not "puppy".' });
  }
  const isCatProfile = (data.macroProfile as string).startsWith('cat_');
  if (data.species === 'dog' && isCatProfile) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['macroProfile'], message: 'Cat diet profile selected for a dog.' });
  }
  if (data.species === 'cat' && !isCatProfile) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['macroProfile'], message: 'Dog diet profile selected for a cat — cats need a cat-specific profile.' });
  }
  // PMR (dog or cat) cannot be cooked: cooked bone splinters.
  if ((data.macroProfile === 'pmr' || data.macroProfile === 'cat_pmr')
      && data.cookingMethod && data.cookingMethod !== 'raw') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['cookingMethod'],
      message: 'PMR contains raw bone — switch to BARF (cooked) or use a custom diet with a calcium supplement.',
    });
  }
});

export type NutritionInput = z.infer<typeof NutritionInputSchema>;

// Cat-specific profile keys for ergonomic narrowing
export const CAT_PROFILES: readonly CatMacroProfile[] = [
  'cat_cooked_carnivore', 'cat_pmr', 'cat_frankenprey', 'cat_whole_prey', 'cat_barf_lite',
] as const;

export const DOG_PROFILES: readonly DogMacroProfile[] = [
  'balanced_cooked', 'high_protein', 'pmr', 'barf', 'real_ancestral',
] as const;
