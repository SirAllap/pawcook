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

export const FatContentSchema = z.enum(['lean', 'medium', 'fatty']);

export const TemperatureUnitSchema = z.enum(['celsius', 'fahrenheit']);

export const CookingInputSchema = z.object({
  meatType: MeatTypeSchema,
  form: MeatFormSchema,
  cookingMethod: CookingMethodSchema,
  fatContent: FatContentSchema.default('medium'),
  temperatureUnit: TemperatureUnitSchema.default('celsius'),
  // Sous-vide: per-bag weight, bag count, and bag thickness (heat penetration)
  weightKg: z.number().min(0.1).max(5).optional(),
  numberOfBags: z.number().int().min(1).max(20).optional(),
  thicknessCm: z.number().min(1).max(10).optional(),
  // Oven / stovetop / slow cooker: total batch weight
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

export const DogAgeSchema = z.enum(['puppy', 'adult', 'senior']);
export const ActivityLevelSchema = z.enum(['sedentary', 'moderate', 'active', 'working']);
export const BodyConditionSchema = z.enum(['underweight', 'ideal', 'overweight']);
export const ReproductiveStatusSchema = z.enum(['intact', 'neutered', 'pregnant', 'lactating']);
export const MacroRatioProfileSchema = z.enum([
  'balanced_cooked',
  'high_protein',
  'pmr',
  'barf',
  'real_ancestral',
]);

export const NutritionInputSchema = z.object({
  weightKg: z.number().min(0.5).max(120),
  age: DogAgeSchema,
  activityLevel: ActivityLevelSchema,
  bodyCondition: BodyConditionSchema.default('ideal'),
  reproductiveStatus: ReproductiveStatusSchema.default('neutered'),
  mealsPerDay: z.number().int().min(1).max(4).default(2),
  macroProfile: MacroRatioProfileSchema.default('balanced_cooked'),
});

export type NutritionInput = z.infer<typeof NutritionInputSchema>;
export type MacroRatioProfile = z.infer<typeof MacroRatioProfileSchema>;
