import type { NutritionInput, MacroRatioProfile, DogMacroProfile, CookingPreparation, CustomDiet } from './schemas.js';
import { calculateCatNutrition } from './nutrition-cat.js';

export type ComponentKey =
  | 'protein' | 'muscle' | 'bone' | 'liver' | 'organ'
  | 'seafood' | 'fiber' | 'veg' | 'seeds' | 'fruit' | 'starch';

export interface DietComponent {
  key: ComponentKey;
  pct: number;
  grams: number;
}

export type AafcoStatus = 'pass' | 'caution' | 'fail';

export type NoteId =
  | 'rer' | 'der' | 'rawDiet' | 'realAncestralOmega'
  // Cat-only notes
  | 'taurineHeartsNote'        // raw cat diet w/ hearts assumed
  | 'arachidonicCookedNote'    // cooked cat: AA from animal fat reminder
  | 'cookedCatSupplementsNote' // cooked cat: B-complex + taurine + AA reminder
  | 'hydrationCatNote';        // cats have weak thirst drive

export type WarningId =
  | 'caPLow' | 'caPHigh' | 'puppyCaP' | 'cookedCaDeficient'
  // Cat-only warnings (cat engine emits these)
  | 'lowTaurine'
  | 'lowArachidonic'
  | 'lowArginine'
  | 'vitAToxicity'
  | 'thiamineRiskRawFish'
  | 'steatitisTunaExcess';

export interface NutritionNote {
  id: NoteId;
  values?: Record<string, number | string>;
}
export interface NutritionWarning {
  id: WarningId;
  values?: Record<string, number | string>;
}

export interface NutritionResult {
  rerKcal: number;
  derKcal: number;
  merKcal: number;
  dailyFoodGrams: { min: number; max: number };
  perMealGrams: { min: number; max: number };
  components: DietComponent[];
  macros: { proteinG: number; vegG: number; starchG: number };
  calciumMg: number;
  phosphorusMg: number;
  caPRatio: number;
  caPTarget: { min: number; max: number };
  calciumSupplementMg: number;
  omega3Mg: number;
  notes: NutritionNote[];
  warnings: NutritionWarning[];
  aafcoStatus: AafcoStatus;
  dietProfile: MacroRatioProfile;
  isRawDiet: boolean;
}

// Approximate Ca / P density (mg per 100 g, as-fed) for diet component categories.
// Derived from USDA FoodData Central averages; rough but adequate for ratio checks.
const COMPONENT_CA_P: Record<ComponentKey, { ca: number; p: number }> = {
  protein: { ca: 12,    p: 200  }, // cooked muscle meat (avg)
  muscle:  { ca: 10,    p: 175  }, // raw muscle meat
  bone:    { ca: 36000, p: 17000 }, // raw edible bone
  liver:   { ca: 7,     p: 350  },
  organ:   { ca: 8,     p: 230  },
  seafood: { ca: 380,   p: 490  }, // small whole fish (sardines avg)
  fiber:   { ca: 30,    p: 30   }, // animal fiber (fur, feathers)
  veg:     { ca: 40,    p: 45   },
  seeds:   { ca: 80,    p: 380  },
  fruit:   { ca: 9,     p: 12   },
  starch:  { ca: 10,    p: 75   },
};

const COMPONENT_LABEL: Record<ComponentKey, string> = {
  protein: 'Protein (cooked meat)',
  muscle:  'Muscle meat (raw)',
  bone:    'Raw edible bone',
  liver:   'Liver',
  organ:   'Secreting organs',
  seafood: 'Whole seafood',
  fiber:   'Animal fiber',
  veg:     'Vegetables',
  seeds:   'Seeds & nuts',
  fruit:   'Fruits',
  starch:  'Starch',
};

interface ProfileSpec {
  isRaw: boolean;
  defaultCookingMethod: CookingPreparation;
  // When set, the user cannot override the cooking method for this profile.
  // PMR is locked to raw because cooked bone splinters.
  cookingLock?: CookingPreparation;
  components: { key: ComponentKey; pct: number }[];
}

// Ratios sourced from the PawCook nutritional engineering blueprint.
// 'custom' is intentionally omitted — it's resolved at runtime from the
// NutritionInput.customDiet payload via buildCustomSpec.
type PresetMacroProfile = Exclude<DogMacroProfile, 'custom'>;
const DIET_PROFILES: Record<PresetMacroProfile, ProfileSpec> = {
  balanced_cooked: {
    isRaw: false,
    defaultCookingMethod: 'fully_cooked',
    components: [
      { key: 'protein', pct: 0.50 },
      { key: 'veg',     pct: 0.30 },
      { key: 'starch',  pct: 0.20 },
    ],
  },
  high_protein: {
    isRaw: false,
    defaultCookingMethod: 'fully_cooked',
    components: [
      { key: 'protein', pct: 0.55 },
      { key: 'veg',     pct: 0.30 },
      { key: 'starch',  pct: 0.15 },
    ],
  },
  pmr: {
    isRaw: true,
    defaultCookingMethod: 'raw',
    cookingLock: 'raw',
    components: [
      { key: 'muscle', pct: 0.80 },
      { key: 'bone',   pct: 0.10 },
      { key: 'liver',  pct: 0.05 },
      { key: 'organ',  pct: 0.05 },
    ],
  },
  barf: {
    isRaw: true,
    defaultCookingMethod: 'raw',
    components: [
      { key: 'muscle', pct: 0.70 },
      { key: 'bone',   pct: 0.10 },
      { key: 'liver',  pct: 0.05 },
      { key: 'organ',  pct: 0.05 },
      { key: 'veg',    pct: 0.07 },
      { key: 'seeds',  pct: 0.02 },
      { key: 'fruit',  pct: 0.01 },
    ],
  },
  real_ancestral: {
    isRaw: true,
    defaultCookingMethod: 'raw',
    components: [
      { key: 'muscle',  pct: 0.64 },
      { key: 'bone',    pct: 0.11 },
      { key: 'liver',   pct: 0.05 },
      { key: 'organ',   pct: 0.05 },
      { key: 'seafood', pct: 0.10 },
      { key: 'fiber',   pct: 0.05 },
    ],
  },
};

function getMerMultiplier(input: NutritionInput): number {
  const { age, activityLevel, reproductiveStatus } = input;
  if (reproductiveStatus === 'pregnant') return 3.0;
  if (reproductiveStatus === 'lactating') return 5.0;
  if (age === 'puppy') return activityLevel === 'active' ? 3.0 : 2.0;
  if (age === 'senior') return 1.3;
  if (reproductiveStatus === 'neutered') {
    if (activityLevel === 'working') return 3.0;
    if (activityLevel === 'active') return 2.0;
    if (activityLevel === 'moderate') return 1.6;
    return 1.4;
  }
  if (activityLevel === 'working') return 4.0;
  if (activityLevel === 'active') return 2.5;
  if (activityLevel === 'moderate') return 1.8;
  return 1.6;
}

// Resting Energy Requirement: 70 · BW(kg)^0.75
export function calcRER(weightKg: number): number {
  return 70 * Math.pow(weightKg, 0.75);
}

// Modified Atwater (kcal/g, as-fed): 3.5 P + 3.5 C + 8.5 F
// All inputs are grams per 100 g of recipe.
export function modifiedAtwater(proteinG: number, carbsG: number, fatG: number): number {
  return (3.5 * proteinG + 3.5 * carbsG + 8.5 * fatG) / 100;
}

// Dry-matter conversion: nutrientPct_DM = nutrientPct_AsFed / (1 - moisture)
export function toDryMatter(asFedPct: number, moisturePct: number): number {
  if (moisturePct >= 100) return 0;
  return asFedPct / (1 - moisturePct / 100);
}

export function getDietProfile(profile: PresetMacroProfile): ProfileSpec {
  return DIET_PROFILES[profile];
}

// Form-layer helper: which cooking method does this preset default to, and is
// it locked? Cheaper than importing the full ProfileSpec into UI code.
// 'custom' has no canonical preparation, so it defaults to fully_cooked and
// is never locked — the user picks via the global Cooking method toggle.
export function getDietCookingDefaults(profile: DogMacroProfile): {
  defaultCookingMethod: CookingPreparation;
  cookingLock?: CookingPreparation;
} {
  if (profile === 'custom') {
    return { defaultCookingMethod: 'fully_cooked' };
  }
  const spec = DIET_PROFILES[profile];
  return { defaultCookingMethod: spec.defaultCookingMethod, cookingLock: spec.cookingLock };
}

// Build a dynamic ProfileSpec from a CustomDiet payload. The user's macro
// percentages map to existing ComponentKeys so the rest of the engine
// (Ca:P math, ingredient selection, shopping list) needs no further
// changes — custom diets are just an additional source of specs.
function buildCustomSpec(custom: CustomDiet, cookingMethod: CookingPreparation): ProfileSpec {
  const isRaw = cookingMethod === 'raw';
  const components: { key: ComponentKey; pct: number }[] = [];
  const proteinFraction = custom.macros.protein / 100;
  const meatKey: ComponentKey = isRaw ? 'muscle' : 'protein';

  if (custom.proteinComposition) {
    // Advanced mode: split protein share into muscle/organ/bone. Bone is
    // dropped silently for cooked diets — the schema-level PMR check
    // doesn't fire here because Custom isn't PMR, so we rebalance into
    // muscle and rely on the calcium ladder + cookedCaDeficient warning
    // (or the user's explicit calciumSource selection) to cover the gap.
    const { muscle, organ, bone } = custom.proteinComposition;
    const muscleShare = isRaw ? muscle : muscle + bone;
    if (muscleShare > 0) {
      components.push({ key: meatKey, pct: proteinFraction * (muscleShare / 100) });
    }
    if (organ > 0) {
      // Half to liver, half to other organ — mirrors PMR/BARF convention.
      const organShare = proteinFraction * (organ / 100);
      components.push({ key: 'liver', pct: organShare / 2 });
      components.push({ key: 'organ', pct: organShare / 2 });
    }
    if (bone > 0 && isRaw) {
      components.push({ key: 'bone', pct: proteinFraction * (bone / 100) });
    }
  } else {
    components.push({ key: meatKey, pct: proteinFraction });
  }

  if (custom.macros.veg > 0) {
    components.push({ key: 'veg', pct: custom.macros.veg / 100 });
  }
  if (custom.macros.carb > 0) {
    components.push({ key: 'starch', pct: custom.macros.carb / 100 });
  }
  // Fat is implicit in the meat component (varies by cut/trim); not a
  // standalone component in this engine.

  return {
    isRaw,
    defaultCookingMethod: cookingMethod,
    components,
  };
}

export function componentLabel(key: ComponentKey): string {
  return COMPONENT_LABEL[key];
}

export function calculateNutrition(input: NutritionInput): NutritionResult {
  // Dispatch by species. Cat math lives in nutrition-cat.ts; this file
  // remains the dog implementation + shared types.
  if (input.species === 'cat') return calculateCatNutrition(input);
  return calculateDogNutrition(input);
}

function calculateDogNutrition(input: NutritionInput): NutritionResult {
  const { weightKg, age, mealsPerDay, macroProfile, bodyCondition, cookingMethod, customDiet } = input;

  const rer = calcRER(weightKg);
  const merMultiplier = getMerMultiplier(input);
  let der = rer * merMultiplier;
  if (bodyCondition === 'overweight') der = rer * 1.0; // weight-loss target
  if (bodyCondition === 'underweight') der *= 1.2;

  let spec: ProfileSpec;
  if (macroProfile === 'custom') {
    // Schema's superRefine guarantees customDiet is present when profile
    // is 'custom'; we still defend in case the engine is called via a path
    // that bypasses validation (tests, direct API).
    const effective = cookingMethod ?? 'fully_cooked';
    spec = customDiet
      ? buildCustomSpec(customDiet, effective)
      : DIET_PROFILES.balanced_cooked;
  } else {
    spec = DIET_PROFILES[macroProfile as PresetMacroProfile];
  }
  // Effective cooking method: schema-enforced lock wins, then user override,
  // then the spec's canonical default. Determines isRaw downstream.
  const effectiveCooking: CookingPreparation =
    spec.cookingLock ?? cookingMethod ?? spec.defaultCookingMethod;
  const isRaw = effectiveCooking === 'raw';

  // Adults: 2–3% of body weight, puppies: 3–5%. Raw diets sit at the lower band.
  const dailyPct = age === 'puppy'
    ? { min: 0.03, max: 0.05 }
    : isRaw
      ? { min: 0.02, max: 0.03 }
      : { min: 0.025, max: 0.035 };

  const dailyMin = Math.round(weightKg * dailyPct.min * 1000);
  const dailyMax = Math.round(weightKg * dailyPct.max * 1000);
  const dailyMid = (dailyMin + dailyMax) / 2;

  const components: DietComponent[] = spec.components.map(c => ({
    key: c.key,
    pct: c.pct,
    grams: Math.round(dailyMid * c.pct),
  }));

  // Compute calcium + phosphorus from component composition
  let calciumMg = 0;
  let phosphorusMg = 0;
  for (const c of components) {
    const { ca, p } = COMPONENT_CA_P[c.key];
    calciumMg += (c.grams * ca) / 100;
    phosphorusMg += (c.grams * p) / 100;
  }

  // Ca:P safe range per AAFCO/FEDIAF: 1:1–2:1
  const caPTarget = { min: 1.0, max: 2.0 };
  const targetRatio = 1.5;

  // Calcium supplement required to bring Ca:P up to 1.5:1 (cooked diets typically need this)
  let calciumSupplementMg = 0;
  if (calciumMg / phosphorusMg < caPTarget.min) {
    calciumSupplementMg = Math.max(0, Math.round(targetRatio * phosphorusMg - calciumMg));
    calciumMg += calciumSupplementMg;
  }

  const caPRatio = phosphorusMg > 0 ? calciumMg / phosphorusMg : 0;

  const warnings: NutritionWarning[] = [];
  let aafcoStatus: AafcoStatus = 'pass';

  const ratioStr = caPRatio.toFixed(2);
  if (caPRatio < caPTarget.min) {
    warnings.push({ id: 'caPLow', values: { ratio: ratioStr, calcium: calciumSupplementMg } });
    aafcoStatus = 'fail';
  } else if (caPRatio > caPTarget.max) {
    warnings.push({ id: 'caPHigh', values: { ratio: ratioStr } });
    aafcoStatus = 'fail';
  } else if (caPRatio < 1.2 || caPRatio > 1.8) {
    aafcoStatus = 'caution';
  }

  if (age === 'puppy' && caPRatio > 1.6) {
    warnings.push({ id: 'puppyCaP' });
    if (aafcoStatus === 'pass') aafcoStatus = 'caution';
  }

  if (calciumSupplementMg > 0 && !isRaw) {
    warnings.push({ id: 'cookedCaDeficient', values: { calcium: calciumSupplementMg } });
  }

  const notes: NutritionNote[] = [
    { id: 'rer', values: { kcal: Math.round(rer) } },
    { id: 'der', values: { kcal: Math.round(der), multiplier: merMultiplier.toFixed(1) } },
  ];
  if (isRaw) {
    notes.push({ id: 'rawDiet' });
  }
  if (macroProfile === 'real_ancestral') {
    notes.push({ id: 'realAncestralOmega' });
  }

  // Legacy macros structure for backward-compatible UI cards (cooked profiles only)
  const proteinG = components.find(c => c.key === 'protein' || c.key === 'muscle')?.grams ?? 0;
  const vegG = components.find(c => c.key === 'veg')?.grams ?? 0;
  const starchG = components.find(c => c.key === 'starch')?.grams ?? 0;

  return {
    rerKcal: Math.round(rer),
    derKcal: Math.round(der),
    merKcal: Math.round(der), // legacy alias
    dailyFoodGrams: { min: dailyMin, max: dailyMax },
    perMealGrams: {
      min: Math.round(dailyMin / mealsPerDay),
      max: Math.round(dailyMax / mealsPerDay),
    },
    components,
    macros: { proteinG, vegG, starchG },
    calciumMg: Math.round(calciumMg),
    phosphorusMg: Math.round(phosphorusMg),
    caPRatio: Math.round(caPRatio * 100) / 100,
    caPTarget,
    calciumSupplementMg,
    omega3Mg: Math.round((weightKg / 11) * 300),
    notes,
    warnings,
    aafcoStatus,
    dietProfile: macroProfile,
    isRawDiet: isRaw,
  };
}
