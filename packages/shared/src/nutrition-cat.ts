// Feline-specific nutrition calculations.
// References: AAFCO 2014+ Cat Food Nutrient Profiles, Merck Vet Manual,
// AAHA/AAFP 2021 Feline Life Stage Guidelines, Zoran 2002.
import type { NutritionInput, CatMacroProfile } from './schemas.js';
import type {
  ComponentKey, DietComponent, AafcoStatus,
  NutritionResult, NutritionNote, NutritionWarning,
} from './nutrition.js';

// Locally inlined to keep this module free of a runtime cycle with nutrition.ts
// (which dispatches into here). Same formula: RER = 70 · BW(kg)^0.75.
function calcRER(weightKg: number): number {
  return 70 * Math.pow(weightKg, 0.75);
}

// Component Ca / P (mg per 100 g, as-fed) — same source as dog table.
const COMPONENT_CA_P: Record<ComponentKey, { ca: number; p: number }> = {
  protein: { ca: 12,    p: 200  },
  muscle:  { ca: 10,    p: 175  },
  bone:    { ca: 36000, p: 17000 },
  liver:   { ca: 7,     p: 350  },
  organ:   { ca: 8,     p: 230  },
  seafood: { ca: 380,   p: 490  },
  fiber:   { ca: 30,    p: 30   },
  veg:     { ca: 40,    p: 45   },
  seeds:   { ca: 80,    p: 380  },
  fruit:   { ca: 9,     p: 12   },
  starch:  { ca: 10,    p: 75   },
};

interface CatProfileSpec {
  isRaw: boolean;
  components: { key: ComponentKey; pct: number }[];
  // Diet has natural taurine source (hearts/whole-prey) vs. needs supplement
  hasNaturalTaurine: boolean;
}

// Cat diet profiles. Whole-prey assumed to be informational with the same
// nutrient assumptions as PMR; the engine still computes targets.
const CAT_DIET_PROFILES: Record<CatMacroProfile, CatProfileSpec> = {
  // Cooked carnivore: 70% cooked muscle, 25% organ/liver mix, 5% veg.
  // Cooking destroys taurine → supplement mandatory.
  cat_cooked_carnivore: {
    isRaw: false,
    hasNaturalTaurine: false,
    components: [
      { key: 'protein', pct: 0.70 },
      { key: 'organ',   pct: 0.15 },
      { key: 'liver',   pct: 0.05 },
      { key: 'veg',     pct: 0.05 },
      { key: 'seafood', pct: 0.05 },
    ],
  },
  // PMR 84/6/10 — closer to feline natural diet than dog PMR (80/10/10).
  // Lower bone (cats have lower calcium need), higher muscle.
  cat_pmr: {
    isRaw: true,
    hasNaturalTaurine: true,  // hearts assumed in muscle component
    components: [
      { key: 'muscle', pct: 0.84 },
      { key: 'bone',   pct: 0.06 },
      { key: 'liver',  pct: 0.05 },
      { key: 'organ',  pct: 0.05 },
    ],
  },
  // Frankenprey — same nutrient ratios, assembled from supermarket cuts.
  cat_frankenprey: {
    isRaw: true,
    hasNaturalTaurine: true,
    components: [
      { key: 'muscle', pct: 0.84 },
      { key: 'bone',   pct: 0.06 },
      { key: 'liver',  pct: 0.05 },
      { key: 'organ',  pct: 0.05 },
    ],
  },
  // Whole prey — informational. Engine still computes targets.
  cat_whole_prey: {
    isRaw: true,
    hasNaturalTaurine: true,
    components: [
      { key: 'muscle', pct: 0.80 },
      { key: 'bone',   pct: 0.08 },
      { key: 'liver',  pct: 0.04 },
      { key: 'organ',  pct: 0.04 },
      { key: 'fiber',  pct: 0.04 },
    ],
  },
  // BARF-lite for cats — small veg + seafood, taurine still required.
  cat_barf_lite: {
    isRaw: true,
    hasNaturalTaurine: true,
    components: [
      { key: 'muscle',  pct: 0.75 },
      { key: 'bone',    pct: 0.05 },
      { key: 'liver',   pct: 0.05 },
      { key: 'organ',   pct: 0.05 },
      { key: 'seafood', pct: 0.05 },
      { key: 'veg',     pct: 0.05 },
    ],
  },
};

// Cat MER multipliers (× RER). Materially lower than dog multipliers —
// reflecting cats' lower thermogenic capacity and high obesity prevalence
// in indoor neutered cats.
function getCatMerMultiplier(input: NutritionInput): number {
  const { age, activityLevel, reproductiveStatus, bodyCondition } = input;

  if (reproductiveStatus === 'pregnant') return 1.6;
  if (reproductiveStatus === 'lactating') return 3.0; // average; can be 2-6× by litter
  if (age === 'kitten') return activityLevel === 'active' ? 2.5 : 2.0;
  if (age === 'senior') return 1.1;
  if (bodyCondition === 'overweight') return 1.0; // weight-loss target
  if (reproductiveStatus === 'neutered') {
    if (activityLevel === 'working') return 1.6;
    if (activityLevel === 'active')   return 1.4;
    if (activityLevel === 'moderate') return 1.2;
    return 1.0;
  }
  // intact
  if (activityLevel === 'working') return 1.8;
  if (activityLevel === 'active')  return 1.6;
  if (activityLevel === 'moderate')return 1.4;
  return 1.2;
}

export function getCatDietProfile(profile: CatMacroProfile): CatProfileSpec {
  return CAT_DIET_PROFILES[profile];
}

export function calculateCatNutrition(input: NutritionInput): NutritionResult {
  const { weightKg, idealWeightKg, age, mealsPerDay, macroProfile, bodyCondition } = input;

  // Weight used for RER: ideal weight if cat is overweight and ideal is provided.
  const targetWeight = bodyCondition === 'overweight' && idealWeightKg ? idealWeightKg : weightKg;
  const rer = calcRER(targetWeight);
  const merMultiplier = getCatMerMultiplier(input);
  let der = rer * merMultiplier;
  if (bodyCondition === 'underweight') der *= 1.2;

  const spec = CAT_DIET_PROFILES[macroProfile as CatMacroProfile];

  // Cats: 2.5–3.5% of BW for adults, 5–6% for kittens (smaller, more nutrient-dense than dogs).
  const dailyPct = age === 'kitten'
    ? { min: 0.05, max: 0.06 }
    : spec.isRaw
      ? { min: 0.025, max: 0.035 }
      : { min: 0.025, max: 0.030 };

  const dailyMin = Math.round(weightKg * dailyPct.min * 1000);
  const dailyMax = Math.round(weightKg * dailyPct.max * 1000);
  const dailyMid = (dailyMin + dailyMax) / 2;

  const components: DietComponent[] = spec.components.map((c) => ({
    key: c.key,
    pct: c.pct,
    grams: Math.round(dailyMid * c.pct),
  }));

  let calciumMg = 0;
  let phosphorusMg = 0;
  for (const c of components) {
    const { ca, p } = COMPONENT_CA_P[c.key];
    calciumMg     += (c.grams * ca) / 100;
    phosphorusMg  += (c.grams * p)  / 100;
  }

  // Cat Ca:P band per AAFCO 2014+: 1.0–2.0 (same as dog), with 1.0–1.5
  // considered the conservative "ideal" zone. PMR 84/6/10 naturally lands
  // around 1.8 due to bone calcium density, which is AAFCO-compliant.
  const caPTarget = { min: 1.0, max: 2.0 };
  const idealTarget = 1.2;

  let calciumSupplementMg = 0;
  if (calciumMg / phosphorusMg < caPTarget.min) {
    calciumSupplementMg = Math.max(0, Math.round(idealTarget * phosphorusMg - calciumMg));
    calciumMg += calciumSupplementMg;
  }

  const caPRatio = phosphorusMg > 0 ? calciumMg / phosphorusMg : 0;

  const warnings: NutritionWarning[] = [];
  const notes: NutritionNote[] = [];
  let aafcoStatus: AafcoStatus = 'pass';

  // Ca:P guardrails (cat AAFCO band 1.0–2.0; conservative ideal 1.0–1.5)
  const ratioStr = caPRatio.toFixed(2);
  if (caPRatio < caPTarget.min) {
    warnings.push({ id: 'caPLow', values: { ratio: ratioStr, calcium: calciumSupplementMg } });
    aafcoStatus = 'fail';
  } else if (caPRatio > caPTarget.max) {
    warnings.push({ id: 'caPHigh', values: { ratio: ratioStr } });
    aafcoStatus = 'fail';
  } else if (caPRatio > 1.7) {
    // Above conservative ideal but still AAFCO-compliant — caution-grade.
    aafcoStatus = 'caution';
  }

  // Taurine — CRITICAL for cats. Cooked diets always need supplement;
  // raw diets need it unless hearts are intentionally included.
  if (!spec.isRaw) {
    warnings.push({ id: 'lowTaurine' });
    aafcoStatus = 'fail';
  } else if (!spec.hasNaturalTaurine) {
    warnings.push({ id: 'lowTaurine' });
    if (aafcoStatus === 'pass') aafcoStatus = 'caution';
  } else {
    // raw with hearts assumed — only a note, not a warning
    notes.push({ id: 'taurineHeartsNote' });
  }

  // Arachidonic acid — must come from animal fat. All cat profiles include
  // animal sources, so this is a note rather than a warning, but if the
  // profile is unusually lean we'd flag it. For now, only flag for the
  // very lean cooked carnivore profile if veg/seafood substitute too high.
  if (macroProfile === 'cat_cooked_carnivore') {
    notes.push({ id: 'arachidonicCookedNote' });
  }

  // Vitamin A — cap liver share to avoid hypervitaminosis A.
  const liverComponent = components.find((c) => c.key === 'liver');
  const liverPct = liverComponent ? liverComponent.pct : 0;
  if (liverPct > 0.10) {
    warnings.push({ id: 'vitAToxicity', values: { liverPct: Math.round(liverPct * 100) } });
    aafcoStatus = 'fail';
  }

  // Cooked diet → B-complex + taurine + AA post-cook reminder
  if (!spec.isRaw) {
    notes.push({ id: 'cookedCatSupplementsNote' });
  }

  // Hydration reminder — cats have weak thirst drive
  notes.push({ id: 'hydrationCatNote' });

  // RER + DER notes (same shape as dog engine)
  notes.unshift({ id: 'rer', values: { kcal: Math.round(rer) } });
  notes.splice(1, 0, { id: 'der', values: { kcal: Math.round(der), multiplier: merMultiplier.toFixed(1) } });

  // Calcium-deficient note for cooked profile
  if (calciumSupplementMg > 0 && !spec.isRaw) {
    warnings.push({ id: 'cookedCaDeficient', values: { calcium: calciumSupplementMg } });
  }

  // Legacy macro structure
  const proteinG = components.find((c) => c.key === 'protein' || c.key === 'muscle')?.grams ?? 0;
  const vegG     = components.find((c) => c.key === 'veg')?.grams ?? 0;
  const starchG  = components.find((c) => c.key === 'starch')?.grams ?? 0;

  return {
    rerKcal: Math.round(rer),
    derKcal: Math.round(der),
    merKcal: Math.round(der),
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
    omega3Mg: Math.round((weightKg / 4) * 100), // ~100 mg per 4 kg cat
    notes,
    warnings,
    aafcoStatus,
    dietProfile: macroProfile,
    isRawDiet: spec.isRaw,
  };
}
