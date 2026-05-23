import type { NutritionInput, MacroRatioProfile } from './schemas.js';

export type ComponentKey =
  | 'protein' | 'muscle' | 'bone' | 'liver' | 'organ'
  | 'seafood' | 'fiber' | 'veg' | 'seeds' | 'fruit' | 'starch';

export interface DietComponent {
  key: ComponentKey;
  pct: number;
  grams: number;
}

export type AafcoStatus = 'pass' | 'caution' | 'fail';

export interface NutritionResult {
  rerKcal: number;
  derKcal: number;
  merKcal: number;
  dailyFoodGrams: { min: number; max: number };
  perMealGrams: { min: number; max: number };
  components: DietComponent[];
  // Retained for compatibility with legacy summary cards
  macros: { proteinG: number; vegG: number; starchG: number };
  calciumMg: number;
  phosphorusMg: number;
  caPRatio: number;
  caPTarget: { min: number; max: number };
  calciumSupplementMg: number;
  omega3Mg: number;
  notes: string[];
  warnings: string[];
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
  components: { key: ComponentKey; pct: number }[];
}

// Ratios sourced from the PawCook nutritional engineering blueprint.
const DIET_PROFILES: Record<MacroRatioProfile, ProfileSpec> = {
  balanced_cooked: {
    isRaw: false,
    components: [
      { key: 'protein', pct: 0.40 },
      { key: 'veg',     pct: 0.50 },
      { key: 'starch',  pct: 0.10 },
    ],
  },
  high_protein: {
    isRaw: false,
    components: [
      { key: 'protein', pct: 0.55 },
      { key: 'veg',     pct: 0.30 },
      { key: 'starch',  pct: 0.15 },
    ],
  },
  pmr: {
    isRaw: true,
    components: [
      { key: 'muscle', pct: 0.80 },
      { key: 'bone',   pct: 0.10 },
      { key: 'liver',  pct: 0.05 },
      { key: 'organ',  pct: 0.05 },
    ],
  },
  barf: {
    isRaw: true,
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

export function getDietProfile(profile: MacroRatioProfile): ProfileSpec {
  return DIET_PROFILES[profile];
}

export function componentLabel(key: ComponentKey): string {
  return COMPONENT_LABEL[key];
}

export function calculateNutrition(input: NutritionInput): NutritionResult {
  const { weightKg, age, mealsPerDay, macroProfile, bodyCondition } = input;

  const rer = calcRER(weightKg);
  const merMultiplier = getMerMultiplier(input);
  let der = rer * merMultiplier;
  if (bodyCondition === 'overweight') der = rer * 1.0; // weight-loss target
  if (bodyCondition === 'underweight') der *= 1.2;

  const spec = DIET_PROFILES[macroProfile];

  // Adults: 2–3% of body weight, puppies: 3–5%. Raw diets sit at the lower band.
  const dailyPct = age === 'puppy'
    ? { min: 0.03, max: 0.05 }
    : spec.isRaw
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

  const warnings: string[] = [];
  let aafcoStatus: AafcoStatus = 'pass';

  if (caPRatio < caPTarget.min) {
    warnings.push(`Ca:P ratio is ${caPRatio.toFixed(2)}:1 — below the AAFCO safe minimum of 1:1. Add ~${calciumSupplementMg} mg supplemental calcium daily.`);
    aafcoStatus = 'fail';
  } else if (caPRatio > caPTarget.max) {
    warnings.push(`Ca:P ratio is ${caPRatio.toFixed(2)}:1 — above the AAFCO safe maximum of 2:1. Reduce bone content or balance with low-calcium protein.`);
    aafcoStatus = 'fail';
  } else if (caPRatio < 1.2 || caPRatio > 1.8) {
    aafcoStatus = 'caution';
  }

  if (age === 'puppy' && caPRatio > 1.6) {
    warnings.push('Growing puppies are sensitive to high Ca:P — keep under 1.6:1 to avoid skeletal disease.');
    if (aafcoStatus === 'pass') aafcoStatus = 'caution';
  }

  if (calciumSupplementMg > 0 && !spec.isRaw) {
    warnings.push(`Cooked diets are calcium-deficient by default. Add ~${calciumSupplementMg} mg Ca (≈½ tsp ground eggshell per ~454 g meat, or use a balancer).`);
  }

  const notes: string[] = [
    `RER (resting): ${Math.round(rer)} kcal/day`,
    `DER (daily energy): ${Math.round(der)} kcal/day (×${merMultiplier.toFixed(1)} multiplier)`,
  ];
  if (macroProfile === 'pmr' || macroProfile === 'barf' || macroProfile === 'real_ancestral') {
    notes.push('Advanced raw diet — bone content provides natural calcium; never substitute cooked bones.');
  }
  if (macroProfile === 'real_ancestral') {
    notes.push('Whole seafood (sardines, mackerel) balances omega-3:6. Use small wild-caught fish to limit mercury.');
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
    isRawDiet: spec.isRaw,
  };
}
