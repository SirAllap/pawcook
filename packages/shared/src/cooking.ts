import type { CookingInput } from './schemas.js';

export interface CookingResult {
  safeInternalTempC: number;
  safeInternalTempF: number;
  cookingTimeMinutes: { min: number; max: number };
  methodInstructions: string;
  storageInstructions: string[];
  warnings: string[];
  nutrientNotes: string[];
}

const METHOD_INSTRUCTIONS = {
  sous_vide: 'Seal meat in vacuum bags. Preheat water bath to 74 °C (165 °F). Submerge bags and cook for the full calculated time. Verify internal temperature with a probe thermometer before serving.',
  oven: 'Preheat oven to 120 °C (248 °F). Place meat in a covered roasting dish; add a splash of water or broth to prevent drying. Check with a probe thermometer — target 74 °C (165 °F) internal temperature.',
  stovetop_low: 'Bring a pot of water to a gentle simmer (not a rolling boil). Add meat and stir regularly — every 2 min for minced, every 5 min for cubed or larger cuts. Remove from heat when internal temperature reaches 74 °C (165 °F). Include the cooking broth in the meal.',
  slow_cooker: 'Place meat in the slow cooker and add ½ cup water or broth. Set to LOW — do not use HIGH as rapid temperature swings increase bacterial risk. Verify 74 °C (165 °F) internal temperature before serving.',
  pressure_cooker: 'Place meat in the pressure cooker with ½ cup water or broth. Lock the lid and cook at high pressure for the calculated time. Use a natural release of at least 10 minutes before opening, then verify 74 °C (165 °F) internal temperature. Include the cooking liquid in the meal.',
} as const;

// Base cook times (minutes) at ~1 kg for each form × method
const FORM_BASE_TIMES: Record<string, Record<string, number>> = {
  minced:    { oven: 20,  stovetop_low: 8,  slow_cooker: 150, pressure_cooker: 10 },
  cubed:     { oven: 40,  stovetop_low: 18, slow_cooker: 240, pressure_cooker: 18 },
  whole_cut: { oven: 65,  stovetop_low: 35, slow_cooker: 330, pressure_cooker: 35 },
  fillet:    { oven: 30,  stovetop_low: 12, slow_cooker: 180, pressure_cooker: 8 },
};

const FAT_FACTOR: Record<string, number> = { lean: 0, medium: 5, fatty: 10 };

function calcSousVide(input: CookingInput): { min: number; max: number } {
  const { thicknessCm = 5, weightKg = 1, fatContent, numberOfBags = 1 } = input;
  const baseTime = 30;
  const thicknessFactor = Math.max(0, (thicknessCm - 2.5)) * 8;
  const volumeEstimate = weightKg * 1.05;
  const densityFactor = (weightKg / volumeEstimate) * 5;
  const fatFactor = FAT_FACTOR[fatContent] ?? 5;
  const sousVideTime = baseTime + thicknessFactor + densityFactor + fatFactor;
  const totalTime = Math.round(sousVideTime);
  const bagFactor = Math.max(1, Math.log2(numberOfBags) * 5);
  return {
    min: Math.round(totalTime + bagFactor),
    max: Math.round(totalTime * 1.2 + bagFactor),
  };
}

function calcBatch(
  method: 'oven' | 'stovetop_low' | 'slow_cooker' | 'pressure_cooker',
  input: CookingInput,
): { min: number; max: number } {
  const { form, fatContent, totalWeightKg, weightKg = 1, numberOfBags = 1 } = input;
  // Fallback for callers that spread a sous-vide input without totalWeightKg
  const effectiveWeight = totalWeightKg ?? weightKg * numberOfBags;

  const baseTime = FORM_BASE_TIMES[form]?.[method] ?? 30;

  let weightScale = 0;
  if (method === 'oven') {
    weightScale = Math.max(0, effectiveWeight - 1) * 12;
  } else if (method === 'stovetop_low') {
    weightScale = Math.max(0, effectiveWeight - 1) * 5;
  } else if (method === 'pressure_cooker') {
    // Pressure cooking scales gently with weight — the come-up-to-pressure
    // time dominates, and added mass mostly delays that come-up.
    weightScale = Math.max(0, effectiveWeight - 1) * 3;
  } else {
    weightScale = Math.max(0, effectiveWeight - 2) * 30;
  }

  // Fat content has minimal impact when fully submerged (slow cooker / pressure)
  const fatMod = (method === 'slow_cooker' || method === 'pressure_cooker')
    ? 0
    : (FAT_FACTOR[fatContent] ?? 5);
  const totalTime = Math.round(baseTime + weightScale + fatMod);

  return { min: totalTime, max: Math.round(totalTime * 1.2) };
}

export function calculateCookingTime(input: CookingInput): CookingResult {
  const { cookingMethod, meatType } = input;

  const cookingTimeMinutes = cookingMethod === 'sous_vide'
    ? calcSousVide(input)
    : calcBatch(cookingMethod, input);

  const warnings: string[] = [
    'Never include cooked bones in any recipe — they splinter and can cause choking or GI perforation.',
    'Always verify internal temperature with a meat thermometer.',
  ];

  if (meatType === 'pork') {
    warnings.push('Pork must always be fully cooked — raw pork carries Trichinella risk.');
  }
  if (meatType === 'salmon') {
    warnings.push('Salmon should only be fed raw if frozen for ≥7 days first (Neorickettsia risk).');
  }

  const nutrientNotesByMethod: Record<string, string[]> = {
    sous_vide: [
      'Sous-vide preserves the most water-soluble vitamins (B-complex, Vit C). Include all bag juices in the meal.',
    ],
    oven: [
      'Some B vitamins are lost to pan drippings — include all pan juices in the meal for full nutritional value.',
    ],
    stovetop_low: [
      'B vitamins leach into the cooking water — always include the broth in the meal.',
    ],
    slow_cooker: [
      'Long, gentle cooking retains most nutrients in the liquid — serve the broth alongside the meat.',
    ],
    pressure_cooker: [
      'Pressure cooking retains more water-soluble vitamins than open boiling and breaks down connective tissue. Always include the cooking liquid in the meal.',
    ],
  };

  return {
    safeInternalTempC: 74,
    safeInternalTempF: 165,
    cookingTimeMinutes,
    methodInstructions: METHOD_INSTRUCTIONS[cookingMethod],
    storageInstructions: [
      'Cooked, refrigerated: 3–4 days.',
      'Cooked, frozen: up to 3 months in airtight containers.',
      'Cool from 60 °C → 21 °C within 2 hours, then to ≤4 °C within 4 more hours.',
    ],
    warnings,
    nutrientNotes: nutrientNotesByMethod[cookingMethod] ?? [],
  };
}
