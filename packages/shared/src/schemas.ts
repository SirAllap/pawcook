import { z } from 'zod';

export const MeatTypeSchema = z.enum([
  'beef', 'chicken', 'turkey', 'lamb', 'pork',
  'duck', 'rabbit', 'venison', 'salmon', 'mackerel',
  'sardines', 'whitefish',
]);

export const MeatFormSchema = z.enum(['minced', 'cubed', 'whole_cut', 'fillet']);

export const CookingMethodSchema = z.enum([
  'sous_vide', 'oven', 'stovetop_low', 'slow_cooker', 'pressure_cooker',
]);
export type CookingMethod = z.infer<typeof CookingMethodSchema>;

// ─── Vegetable cut form ──────────────────────────────────────────
// Analog of MeatFormSchema. Cut drives cook time, yield, packaging
// fit, and pet-servability advisories. The same carrot at 2 mm
// mandolin vs 3 cm chunk is two different cook problems.
export const VegCutSchema = z.enum([
  'whole',           // whole carrot, halved pumpkin
  'large_chunks',    // 3–4 cm cubes
  'cubed',           // 1–2 cm cubes
  'coins',           // 6–10 mm rounds
  'mandolin_thin',   // 2–4 mm slices — vacuum-seal-friendly
  'sticks',          // batons / matchsticks
  'shredded',        // grated
  'florets',         // cruciferous only
  'leaves_whole',
  'leaves_shredded',
]);
export type VegCut = z.infer<typeof VegCutSchema>;

// How portioned veg is packaged. Affects bag-life, label format,
// and unlocks the cook-from-frozen sous-vide path when vacuum_seal.
export const VegPackagingSchema = z.enum([
  'vacuum_seal',
  'freezer_bag',
  'silicone_tray',
  'rigid_container',
]);
export type VegPackaging = z.infer<typeof VegPackagingSchema>;

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

// Dog diet profiles. 'custom' is resolved at runtime from NutritionInput.customDiet
// rather than from a static spec — it lets users build their own macro split
// (e.g., vet-prescribed 90/10 cooked) without us shipping a marquee preset
// that implies endorsement of a single ratio.
export const DogMacroProfileSchema = z.enum([
  'balanced_cooked',
  'high_protein',
  'pmr',
  'barf',
  'real_ancestral',
  'custom',
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

// ─── Custom diet payload ──────────────────────────────────────────
// When macroProfile === 'custom', the engine builds the spec from this
// payload at runtime. Easy mode only uses protein + veg; Advanced unlocks
// fat, carb, protein composition, calcium source, and supplement hints.
export const CalciumSourceSchema = z.enum(['bone_in', 'eggshell', 'supplement', 'none']);
export type CalciumSource = z.infer<typeof CalciumSourceSchema>;

export const CustomDietSchema = z.object({
  // Drives which controls the UI shows. The engine treats both modes the
  // same — proteinComposition is just optional.
  mode: z.enum(['easy', 'advanced']).default('easy'),
  macros: z.object({
    protein: z.number().min(0).max(100),
    fat: z.number().min(0).max(100).default(0),
    veg: z.number().min(0).max(100),
    carb: z.number().min(0).max(100).default(0),
  }),
  // Advanced-only: how the protein share splits into muscle/organ/bone.
  // Each value is a % of the protein share, not of the whole diet.
  proteinComposition: z.object({
    muscle: z.number().min(0).max(100),
    organ: z.number().min(0).max(100),
    bone: z.number().min(0).max(100),
  }).optional(),
  calciumSource: CalciumSourceSchema.default('eggshell'),
  supplements: z.object({
    omega3: z.boolean().default(false),
    vitaminE: z.boolean().default(false),
    taurine: z.boolean().default(false),
    multivitamin: z.boolean().default(false),
  }).default({ omega3: false, vitaminE: false, taurine: false, multivitamin: false }),
}).superRefine((data, ctx) => {
  const macroSum = data.macros.protein + data.macros.fat + data.macros.veg + data.macros.carb;
  if (Math.abs(macroSum - 100) > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['macros'],
      message: `Macros must sum to 100% (currently ${Math.round(macroSum)}%).`,
    });
  }
  if (data.proteinComposition) {
    const compSum = data.proteinComposition.muscle + data.proteinComposition.organ + data.proteinComposition.bone;
    if (Math.abs(compSum - 100) > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['proteinComposition'],
        message: `Protein composition must sum to 100% (currently ${Math.round(compSum)}%).`,
      });
    }
  }
});
export type CustomDiet = z.infer<typeof CustomDietSchema>;

// ─── Vet-prescribed therapeutic diets ─────────────────────────────
// A diet flagged as vet-prescribed gets clinical context (condition,
// vet name, optional review date) that the planner uses to relax some
// safety refusals which would otherwise block the plan. Toxicology and
// mechanical-injury refusals (cooked bone, allium, xylitol, etc.) stay
// absolute — there's no clinical scenario where they're justified.
export const ClinicalConditionSchema = z.enum([
  'renal_ckd', 'hepatic', 'pancreatitis', 'ibd', 'food_allergy',
  'urolithiasis_struvite', 'urolithiasis_calcium_oxalate', 'urolithiasis_urate',
  'diabetes', 'obesity', 'cardiac', 'epi', 'cancer_cachexia', 'other',
]);
export type ClinicalCondition = z.infer<typeof ClinicalConditionSchema>;

export const VetPrescriptionSchema = z.object({
  vetName: z.string().max(120).optional(),
  condition: ClinicalConditionSchema,
  restrictedIngredients: z.array(z.string()).default([]),
  prescribedAt: z.string().datetime().optional(),
  reviewDate: z.string().date().optional(),
  // User-acknowledged override notes — required when relaxing an
  // overridable refusal (logged as part of the audit trail).
  acknowledgments: z.array(z.string()).default([]),
});
export type VetPrescription = z.infer<typeof VetPrescriptionSchema>;

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
  customDiet: CustomDietSchema.optional(),
  vetPrescription: VetPrescriptionSchema.optional(),
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
  // Custom diets require their payload to be present.
  if (data.macroProfile === 'custom' && !data.customDiet) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['customDiet'],
      message: 'Custom diet selected — fill in the macro sliders to continue.',
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
