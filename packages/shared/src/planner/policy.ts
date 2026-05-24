import type { Ingredient } from './catalog.js';

// How the user buys this ingredient at the market. Drives the unit shown
// on the shopping list and the rounding step. Eggs and discrete produce
// are sold per unit; whole fish per fish; bottles for oils.
export type PurchaseUnit = 'g' | 'piece' | 'pack' | 'bunch' | 'punnet' | 'fish' | 'bottle';

export type SurplusBehavior = 'freeze' | 'do-not-feed' | 'discard' | 'none';

// Per-ingredient shopping + batching policy. Resolved from a small set of
// catalog signals (componentRoles, storeSection, tags) so most ingredients
// inherit safe defaults; per-item overrides live alongside the data.
export interface IngredientPolicy {
  // Display unit on the shopping list. 'g' = round grams to nearest step.
  purchaseUnit: PurchaseUnit;
  // Average grams per unit when purchaseUnit !== 'g'. Used to convert the
  // gram-aggregated need into a buy count (e.g. 350g spinach -> 1 bunch).
  gramsPerUnit: number;
  // Step for gram-based rounding. 0 disables rounding entirely.
  roundingStepGrams: number;
  roundDirection: 'up' | 'nearest' | 'none';
  // Edible yield (cooked weight / raw bone-in weight). 1.0 for boneless,
  // ~0.7 for bone-in chicken thigh. Multiplies the need before rounding so
  // the user actually buys enough.
  edibleYield: number;
  // 0 = never batch (cook fresh or non-cookable). Otherwise the max number
  // of usage-days a single bag may cover for this ingredient.
  maxBagDays: number;
  // Cap on cooked weight per bag in grams. Sous-vide bags fail above ~2kg.
  maxBagWeightG: number;
  // After thawing, how long the bag is safe in the fridge. Caps the
  // calendar span of a bag separately from the usage-day count.
  maxFridgeHoursPostThaw: number;
  // What to do with surplus from rounding. 'do-not-feed' applies to
  // organs where over-feeding causes toxicity (vitamin A from liver).
  surplusBehavior: SurplusBehavior;
  // Suppress surplus display below this fraction-of-need OR 100g, whichever
  // is larger. Avoids "+8 g extra" noise on muscle meat that nobody cares
  // about at the butcher counter.
  surplusDisplayThresholdPct: number;
  // If true the planner attempts cross-pet batching; flipped to false at
  // batch time when any pet excludes this ingredient via allergy.
  allowCrossPetBatching: boolean;
}

// Optional per-ingredient override carried in the JSON metadata. Anything
// not set falls back to the class-based default below.
export type PolicyOverride = Partial<IngredientPolicy>;

const SUPPLEMENT_POLICY: IngredientPolicy = {
  purchaseUnit: 'g',
  gramsPerUnit: 1,
  roundingStepGrams: 0,
  roundDirection: 'none',
  edibleYield: 1,
  maxBagDays: 0,
  maxBagWeightG: 0,
  maxFridgeHoursPostThaw: 0,
  surplusBehavior: 'none',
  surplusDisplayThresholdPct: 1,
  allowCrossPetBatching: false,
};

// Veggies that hold up to cook-then-freeze-then-thaw without turning to
// mush. Anything else gets maxBagDays = 0 ("cook fresh").
const FREEZER_SAFE_VEG = new Set([
  'carrots', 'pumpkin', 'sweet_potato', 'green_beans', 'peas',
]);

function isOrgan(ing: Ingredient): boolean {
  if (ing.componentRoles.some((r) => r === 'liver' || r === 'organ')) return true;
  return ing.tags.includes('organ');
}

function isWholeBone(ing: Ingredient): boolean {
  // raw_meaty_bones is sold by the piece; we distinguish from ground RMB.
  return ing.componentRoles.includes('bone') && !ing.tags.includes('ground');
}

function isFatty(ing: Ingredient): boolean {
  return ing.tags.includes('fatty');
}

function isWholeFish(ing: Ingredient): boolean {
  return ing.tags.includes('whole-fish');
}

function isPantry(ing: Ingredient): boolean {
  return ing.storeSection === 'pantry';
}

function isLeafyOrCruciferous(ing: Ingredient): boolean {
  return ing.tags.includes('cruciferous') || ing.id === 'spinach';
}

// Derive a policy from the ingredient's existing class signals, then apply
// any per-item override. Centralising this keeps the JSON terse — only the
// ~10% of ingredients that diverge from their class need an override.
export function resolvePolicy(ing: Ingredient, override?: PolicyOverride): IngredientPolicy {
  const base = baseFor(ing);
  return { ...base, ...override };
}

function baseFor(ing: Ingredient): IngredientPolicy {
  // Supplements & supplement-equivalents — never round, never batch.
  if (ing.storeSection === 'supplements') return SUPPLEMENT_POLICY;

  // Organs: small portions, dangerous to over-feed (vit A, copper). Tight
  // step, surplus is freezer-bound and labelled "do not feed."
  if (isOrgan(ing)) {
    return {
      purchaseUnit: 'g',
      gramsPerUnit: 1,
      roundingStepGrams: 100,
      roundDirection: 'up',
      edibleYield: 1,
      maxBagDays: 0,
      maxBagWeightG: 500,
      maxFridgeHoursPostThaw: 48,
      surplusBehavior: 'do-not-feed',
      surplusDisplayThresholdPct: 0,
      allowCrossPetBatching: false,
    };
  }

  // Whole bones sold by piece; never gram-rounded, never batched.
  if (isWholeBone(ing)) {
    return {
      purchaseUnit: 'piece',
      gramsPerUnit: 120,
      roundingStepGrams: 0,
      roundDirection: 'none',
      edibleYield: 1,
      maxBagDays: 0,
      maxBagWeightG: 0,
      maxFridgeHoursPostThaw: 0,
      surplusBehavior: 'none',
      surplusDisplayThresholdPct: 1,
      allowCrossPetBatching: false,
    };
  }

  // Whole fish: sold per fish (sardines, mackerel). Don't batch (oily fish
  // oxidises fast; salmonids carry parasite risk if not cooked through).
  if (isWholeFish(ing)) {
    return {
      purchaseUnit: 'fish',
      gramsPerUnit: 90,
      roundingStepGrams: 0,
      roundDirection: 'none',
      edibleYield: 0.7,
      maxBagDays: 0,
      maxBagWeightG: 0,
      maxFridgeHoursPostThaw: 0,
      surplusBehavior: 'none',
      surplusDisplayThresholdPct: 1,
      allowCrossPetBatching: false,
    };
  }

  // Fish fillet (salmon, mackerel fillet, whitefish). Perishable — don't
  // round up, don't batch beyond same-day cooking.
  if (ing.componentRoles.includes('seafood')) {
    return {
      purchaseUnit: 'g',
      gramsPerUnit: 1,
      roundingStepGrams: 50,
      roundDirection: 'nearest',
      edibleYield: 1,
      maxBagDays: 0,
      maxBagWeightG: 0,
      maxFridgeHoursPostThaw: 0,
      surplusBehavior: 'none',
      surplusDisplayThresholdPct: 1,
      allowCrossPetBatching: false,
    };
  }

  // Muscle meat — the bulk shopping case. Fatty proteins (lamb, duck)
  // cap at 2 batch-days; leaner ones go to 3.
  if (ing.componentRoles.some((r) => r === 'muscle' || r === 'protein')) {
    const fatty = isFatty(ing);
    return {
      purchaseUnit: 'g',
      gramsPerUnit: 1,
      roundingStepGrams: 250,
      roundDirection: 'up',
      edibleYield: 1,
      maxBagDays: fatty ? 2 : 3,
      maxBagWeightG: 2000,
      maxFridgeHoursPostThaw: fatty ? 48 : 72,
      surplusBehavior: 'freeze',
      surplusDisplayThresholdPct: 0.1,
      allowCrossPetBatching: true,
    };
  }

  // Pantry items (sardines tinned, rice, oats). Treat as pack-bought, no
  // rounding noise — user already has a tin/box on hand.
  if (isPantry(ing)) {
    return {
      purchaseUnit: 'pack',
      gramsPerUnit: 120,
      roundingStepGrams: 0,
      roundDirection: 'none',
      edibleYield: 1,
      maxBagDays: 0,
      maxBagWeightG: 0,
      maxFridgeHoursPostThaw: 0,
      surplusBehavior: 'none',
      surplusDisplayThresholdPct: 1,
      allowCrossPetBatching: false,
    };
  }

  // Starch (sweet_potato) — discrete produce.
  if (ing.componentRoles.includes('starch')) {
    return {
      purchaseUnit: 'piece',
      gramsPerUnit: 200,
      roundingStepGrams: 0,
      roundDirection: 'up',
      edibleYield: 1,
      maxBagDays: 3,
      maxBagWeightG: 1500,
      maxFridgeHoursPostThaw: 72,
      surplusBehavior: 'freeze',
      surplusDisplayThresholdPct: 0.15,
      allowCrossPetBatching: true,
    };
  }

  // Fruit (berries are punnet; apple is per-piece).
  if (ing.componentRoles.includes('fruit')) {
    if (ing.id === 'blueberries') {
      return {
        purchaseUnit: 'punnet',
        gramsPerUnit: 125,
        roundingStepGrams: 0,
        roundDirection: 'up',
        edibleYield: 1,
        maxBagDays: 0,
        maxBagWeightG: 0,
        maxFridgeHoursPostThaw: 0,
        surplusBehavior: 'none',
        surplusDisplayThresholdPct: 1,
        allowCrossPetBatching: false,
      };
    }
    return {
      purchaseUnit: 'piece',
      gramsPerUnit: 180,
      roundingStepGrams: 0,
      roundDirection: 'up',
      edibleYield: 1,
      maxBagDays: 0,
      maxBagWeightG: 0,
      maxFridgeHoursPostThaw: 0,
      surplusBehavior: 'none',
      surplusDisplayThresholdPct: 1,
      allowCrossPetBatching: false,
    };
  }

  // Veggies — split by freezer-safety. Cruciferous + leafy get a smaller
  // rounding step (100g, sold by bunch) and no batching (texture loss).
  if (ing.componentRoles.includes('veg') || ing.componentRoles.includes('fiber')) {
    if (FREEZER_SAFE_VEG.has(ing.id)) {
      return {
        purchaseUnit: 'piece',
        gramsPerUnit: pieceWeightForVeg(ing.id),
        roundingStepGrams: 0,
        roundDirection: 'up',
        edibleYield: 1,
        maxBagDays: 3,
        maxBagWeightG: 1500,
        maxFridgeHoursPostThaw: 72,
        surplusBehavior: 'freeze',
        surplusDisplayThresholdPct: 0.15,
        allowCrossPetBatching: true,
      };
    }
    if (isLeafyOrCruciferous(ing)) {
      return {
        purchaseUnit: 'g',
        gramsPerUnit: 1,
        roundingStepGrams: 100,
        roundDirection: 'up',
        edibleYield: 1,
        maxBagDays: 0,
        maxBagWeightG: 0,
        maxFridgeHoursPostThaw: 0,
        surplusBehavior: 'none',
        surplusDisplayThresholdPct: 0.2,
        allowCrossPetBatching: false,
      };
    }
    // Default veg (zucchini etc.) — cook fresh, round to nearest 100g.
    return {
      purchaseUnit: 'g',
      gramsPerUnit: 1,
      roundingStepGrams: 100,
      roundDirection: 'up',
      edibleYield: 1,
      maxBagDays: 0,
      maxBagWeightG: 0,
      maxFridgeHoursPostThaw: 0,
      surplusBehavior: 'none',
      surplusDisplayThresholdPct: 0.2,
      allowCrossPetBatching: false,
    };
  }

  // Catch-all — treat unknown as muscle-meat-like to avoid hiding things.
  return {
    purchaseUnit: 'g',
    gramsPerUnit: 1,
    roundingStepGrams: 250,
    roundDirection: 'up',
    edibleYield: 1,
    maxBagDays: 0,
    maxBagWeightG: 2000,
    maxFridgeHoursPostThaw: 72,
    surplusBehavior: 'freeze',
    surplusDisplayThresholdPct: 0.1,
    allowCrossPetBatching: true,
  };
}

function pieceWeightForVeg(id: string): number {
  switch (id) {
    case 'carrots': return 80;
    case 'pumpkin': return 600;
    case 'sweet_potato': return 200;
    case 'green_beans': return 120;
    case 'peas': return 100;
    default: return 150;
  }
}
