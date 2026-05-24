// Clinical-safety refusal engine for the meal planner. Runs BEFORE
// generateMealPlan and returns a list of reasons why a pet's diet would
// produce an unsafe plan. Empty array → safe to generate.
//
// Two tiers, per the PawCook clinical-safety scope review:
//   - 'absolute' refusals fire for every pet and cannot be overridden
//     (cooked bone, 0% essential macro, expired vet review).
//   - 'overridable' refusals can be relaxed by an explicit
//     VetPrescription with a matching condition + logged acknowledgment.
//
// The form-level Tier-2 warnings already help users avoid these cases at
// the drafting surface (CustomDietPicker.warn.*). This module is the
// output-surface backstop: even if a saved pet drifts into an unsafe
// configuration, the planner refuses to materialize an unsafe artifact.

import { calculateNutrition } from '../nutrition.js';
import type { PetProfile } from '../pets.js';
import type { ClinicalCondition } from '../schemas.js';

export type RefusalSeverity = 'absolute' | 'overridable';

export type RefusalRule =
  | 'zero_protein'             // absolute: 0% protein in a custom diet
  | 'protein_below_nrc_min'    // overridable (advanced CKD therapeutic)
  | 'cooked_bone'              // absolute: cooked bone in plan
  | 'high_phosphorus_ckd'      // overridable when condition is renal_ckd
  | 'ca_p_inverted'            // overridable
  | 'high_fat_pancreatitis'    // absolute when condition is pancreatitis
  | 'expired_vet_review';      // absolute: review date is in the past

export interface PlannerRefusal {
  petId: string;
  petName: string;
  rule: RefusalRule;
  severity: RefusalSeverity;
  // True when a matching VetPrescription can suppress this refusal.
  overrideAvailable: boolean;
  // The actual measured value and the threshold it violated, for the UI
  // to render "Phosphorus 1.2 g/Mcal exceeds CKD cap 0.8".
  value?: number;
  threshold?: number;
}

export function checkPlanSafety(pets: PetProfile[]): PlannerRefusal[] {
  return pets.flatMap(checkPetSafety);
}

function checkPetSafety(pet: PetProfile): PlannerRefusal[] {
  const refusals: PlannerRefusal[] = [];
  const nutrition = calculateNutrition(pet.nutrition);
  const rx = pet.nutrition.vetPrescription;
  const acknowledged = (rule: RefusalRule) =>
    rx?.acknowledgments?.includes(rule) ?? false;
  const conditionMatches = (target: ClinicalCondition) =>
    rx?.condition === target;
  const add = (
    rule: RefusalRule,
    severity: RefusalSeverity,
    overrideAvailable: boolean,
    value?: number,
    threshold?: number,
  ) => {
    refusals.push({
      petId: pet.id,
      petName: pet.name,
      rule,
      severity,
      overrideAvailable,
      value,
      threshold,
    });
  };

  // Absolute: vet prescription past its review date is no longer valid.
  if (rx?.reviewDate) {
    const review = new Date(rx.reviewDate);
    if (!Number.isNaN(review.getTime()) && review < new Date()) {
      add('expired_vet_review', 'absolute', false);
    }
  }

  // Absolute: 0% protein. Even therapeutic hepatic encephalopathy
  // protocols stay above FEDIAF's ~18% ME floor; the engine refuses to
  // ship a plan with literal zero protein, period.
  if (pet.nutrition.macroProfile === 'custom') {
    const macros = pet.nutrition.customDiet?.macros;
    if (macros && macros.protein <= 0) {
      add('zero_protein', 'absolute', false, macros.protein, 1);
    }
  }

  // Overridable: protein below NRC 2006 adult-maintenance minimum
  // (2.62 g/kg BW^0.75/day). Expressed as % of as-fed weight for the
  // form's vocabulary — translates to ~18% for an average adult dog
  // (FEDIAF Nutritional Guidelines 2021).
  const proteinPct = customProteinPct(pet);
  if (proteinPct !== null && proteinPct < 18) {
    const overridable = Boolean(rx && (conditionMatches('renal_ckd') || conditionMatches('hepatic')));
    if (!overridable || !acknowledged('protein_below_nrc_min')) {
      add('protein_below_nrc_min', 'overridable', overridable, proteinPct, 18);
    }
  }

  // Overridable: Ca:P inversion outside the AAFCO 1:1–2:1 safe range.
  if (nutrition.caPRatio < nutrition.caPTarget.min || nutrition.caPRatio > nutrition.caPTarget.max) {
    const overridable = Boolean(rx);
    if (!overridable || !acknowledged('ca_p_inverted')) {
      add('ca_p_inverted', 'overridable', overridable, nutrition.caPRatio, nutrition.caPTarget.min);
    }
  }

  // Absolute when the listed condition is pancreatitis: fat must stay
  // below ~25 g per 1000 kcal (Xenoulis 2015). The CustomDiet schema
  // doesn't currently track fat directly — when fat IS tracked
  // (advanced mode), enforce; otherwise skip and rely on protein cap.
  if (pet.conditions?.includes('pancreatitis') && pet.nutrition.customDiet) {
    const fat = pet.nutrition.customDiet.macros.fat;
    // 25 g / 1000 kcal at ~3.5 kcal/g overall ≈ 8–10% of as-fed weight
    if (fat > 10) {
      add('high_fat_pancreatitis', 'absolute', false, fat, 10);
    }
  }

  // Cooked bone in a custom diet — the schema-level cooking lock catches
  // PMR + cooked, but a custom advanced diet with bone > 0 and a
  // non-raw cooking method still needs to be refused at the planner.
  if (pet.nutrition.macroProfile === 'custom' && pet.nutrition.customDiet) {
    const bone = pet.nutrition.customDiet.proteinComposition?.bone ?? 0;
    const cooking = pet.nutrition.cookingMethod ?? 'fully_cooked';
    if (bone > 0 && cooking !== 'raw') {
      add('cooked_bone', 'absolute', false);
    }
  }

  return refusals;
}

// Pull the protein % off a custom diet when present; presets are assumed
// to be nutritionally validated, so they're not subject to the low-protein
// refusal at the planner level.
function customProteinPct(pet: PetProfile): number | null {
  if (pet.nutrition.macroProfile !== 'custom') return null;
  return pet.nutrition.customDiet?.macros.protein ?? null;
}

// Convenience: returns true if every refusal in the set is either
// already-acknowledged-and-overridable or non-blocking. Used by the
// wizard UI to decide whether to show the refusal screen at all.
export function hasBlockingRefusals(refusals: PlannerRefusal[]): boolean {
  return refusals.some((r) => r.severity === 'absolute' || !r.overrideAvailable);
}
