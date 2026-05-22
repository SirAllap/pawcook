import type { NutritionInput } from './schemas.js';

export interface NutritionResult {
  rerKcal: number;
  merKcal: number;
  dailyFoodGrams: { min: number; max: number };
  perMealGrams: { min: number; max: number };
  macros: { proteinG: number; vegG: number; starchG: number };
  calciumMg: number;
  omega3Mg: number;
  notes: string[];
}

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

const MACRO_PROFILES = {
  balanced_cooked: { protein: 0.40, veg: 0.50, starch: 0.10 },
  high_protein:    { protein: 0.50, veg: 0.30, starch: 0.15 },
  pmr:             { protein: 0.80, veg: 0.10, starch: 0.10 },
};

export function calculateNutrition(input: NutritionInput): NutritionResult {
  const { weightKg, age, mealsPerDay, macroProfile, bodyCondition } = input;

  const rer = 70 * Math.pow(weightKg, 0.75);
  const merMultiplier = getMerMultiplier(input);
  let mer = rer * merMultiplier;

  if (bodyCondition === 'overweight') mer = rer * 1.0;
  if (bodyCondition === 'underweight') mer *= 1.2;

  const dailyPct = age === 'puppy' ? { min: 0.03, max: 0.05 } : { min: 0.02, max: 0.03 };
  const profile = MACRO_PROFILES[macroProfile];

  const dailyMin = Math.round(weightKg * dailyPct.min * 1000);
  const dailyMax = Math.round(weightKg * dailyPct.max * 1000);
  const dailyMid = (dailyMin + dailyMax) / 2;

  const notes: string[] = [
    `RER (resting): ${Math.round(rer)} kcal/day`,
    `MER (maintenance): ${Math.round(mer)} kcal/day (×${merMultiplier} multiplier)`,
  ];
  if (macroProfile === 'pmr') {
    notes.push('PMR (80-10-10): Advanced users only. Raw bone inclusion is never safe cooked — only include raw meaty bones.');
  }

  return {
    rerKcal: Math.round(rer),
    merKcal: Math.round(mer),
    dailyFoodGrams: { min: dailyMin, max: dailyMax },
    perMealGrams: {
      min: Math.round(dailyMin / mealsPerDay),
      max: Math.round(dailyMax / mealsPerDay),
    },
    macros: {
      proteinG: Math.round(dailyMid * profile.protein),
      vegG: Math.round(dailyMid * profile.veg),
      starchG: Math.round(dailyMid * profile.starch),
    },
    calciumMg: Math.round((dailyMid / 454) * 500),
    omega3Mg: Math.round((weightKg / 11) * 300),
    notes,
  };
}
