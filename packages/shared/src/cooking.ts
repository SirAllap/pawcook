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

const METHOD_CONFIG = {
  sous_vide: { tempC: 74, timeMultiplier: 1.0, instructions: 'Seal bags, preheat water bath to 74 °C, submerge and cook for the full calculated time. Verify with a probe thermometer.' },
  oven: { tempC: 120, timeMultiplier: 0.6, instructions: 'Preheat oven to 120 °C. Place bags in a covered dish with a little water. Check internal temp with a probe thermometer.' },
  stovetop_low: { tempC: 74, timeMultiplier: 0.4, instructions: 'Cook on medium-low heat, stirring frequently. Minced meat: 3–5 min until no pink remains. Verify internal temperature.' },
  slow_cooker: { tempC: 74, timeMultiplier: 2.5, instructions: 'Set to low. Minced meat: 2.5–4 hours. Very gentle cooking preserves moisture.' },
} as const;

const FAT_FACTOR: Record<string, number> = { lean: 0, medium: 5, fatty: 10 };

export function calculateCookingTime(input: CookingInput): CookingResult {
  const { thicknessCm, weightKg, fatContent, cookingMethod, numberOfBags } = input;

  const baseTime = 30;
  const thicknessFactor = Math.max(0, (thicknessCm - 2.5)) * 8;
  const volumeEstimate = weightKg * 1.05;
  const densityFactor = (weightKg / volumeEstimate) * 5;
  const fatFactor = FAT_FACTOR[fatContent] ?? 5;

  const sousVideTime = baseTime + thicknessFactor + densityFactor + fatFactor;
  const method = METHOD_CONFIG[cookingMethod];
  const totalTime = Math.round(sousVideTime * method.timeMultiplier);
  const bagFactor = Math.max(1, Math.log2(numberOfBags) * 5);

  const timeMin = Math.round(totalTime + bagFactor);
  const timeMax = Math.round(totalTime * 1.2 + bagFactor);

  const warnings: string[] = [
    'Never include cooked bones in any recipe — they splinter and can cause choking or GI perforation.',
    'Always verify internal temperature with a meat thermometer.',
  ];

  if (input.meatType === 'pork') {
    warnings.push('Pork must always be fully cooked — raw pork carries Trichinella risk.');
  }
  if (input.meatType === 'salmon') {
    warnings.push('Salmon should only be fed raw if frozen for ≥7 days first (Neorickettsia risk).');
  }

  return {
    safeInternalTempC: 74,
    safeInternalTempF: 165,
    cookingTimeMinutes: { min: timeMin, max: timeMax },
    methodInstructions: method.instructions,
    storageInstructions: [
      'Cooked, refrigerated: 3–4 days.',
      'Cooked, frozen: up to 3 months in airtight bags.',
      'Cool from 60 °C → 21 °C within 2 hours, then to ≤4 °C within 4 more hours.',
    ],
    warnings,
    nutrientNotes: [
      'Sous-vide preserves the most water-soluble vitamins (B-complex, Vit C).',
      'Do not microwave — cooks unevenly, leaves cold spots where bacteria multiply.',
    ],
  };
}
