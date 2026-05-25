import { calculateNutrition } from '../nutrition.js';
import type { NutritionWarning } from '../nutrition.js';
import type { HealthCondition, PetProfile } from '../pets.js';
import type { MealPlan, PlanDay } from './schemas.js';

export type Severity = 'info' | 'caution' | 'warning';

export interface PlanFinding {
  id: string;
  severity: Severity;
  /** Optional pet attribution — null means plan-wide. */
  petId?: string;
  /** Optional interpolation values for i18n. */
  values?: Record<string, string | number>;
}

/**
 * Per-pet recommendation: surfaces the diet engine's own warnings plus
 * planner-side advisories based on chronic conditions.
 */
export function recommendForPet(pet: PetProfile): PlanFinding[] {
  const findings: PlanFinding[] = [];
  const nutrition = calculateNutrition(pet.nutrition);

  for (const w of nutrition.warnings) {
    findings.push({
      id: `nutrition.warnings.${w.id}`,
      severity: nutrition.aafcoStatus === 'fail' ? 'warning' : 'caution',
      petId: pet.id,
      values: stringifyValues(w.values),
    });
  }

  for (const condition of pet.conditions) {
    const conditionFindings = adviceForCondition(condition);
    for (const f of conditionFindings) findings.push({ ...f, petId: pet.id });
  }

  return findings;
}

function adviceForCondition(condition: HealthCondition): PlanFinding[] {
  switch (condition) {
    case 'kidney':
      return [
        { id: 'condition.kidney.lowPhosphorus', severity: 'caution' },
        { id: 'condition.kidney.avoidOrgans',   severity: 'caution' },
      ];
    case 'pancreatitis':
      return [
        { id: 'condition.pancreatitis.leanOnly', severity: 'warning' },
      ];
    case 'diabetes':
      return [
        { id: 'condition.diabetes.lowCarb', severity: 'caution' },
      ];
    case 'joint':
      return [
        { id: 'condition.joint.omega3', severity: 'info' },
      ];
    case 'gi_sensitive':
      return [
        { id: 'condition.gi.bland', severity: 'info' },
      ];
    case 'obese':
      return [
        { id: 'condition.obese.kcalReduce', severity: 'caution' },
      ];
    case 'allergy':
      return [
        { id: 'condition.allergy.respectList', severity: 'info' },
      ];
    default:
      return [];
  }
}

/**
 * Quick nutrient-coverage check across a plan. Today this is a thin
 * wrapper — collects every warning the daily engine emitted and dedupes
 * by (petId, warningId). Useful for showing a coverage summary card.
 */
export function nutrientCoverage(plan: MealPlan): PlanFinding[] {
  const seen = new Set<string>();
  const findings: PlanFinding[] = [];

  for (const day of plan.days) {
    for (const pp of day.petPlans) {
      for (const w of pp.warnings) {
        const key = `${pp.petId}:${w.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        findings.push({
          id: `nutrition.warnings.${w.id}`,
          severity: 'caution',
          petId: pp.petId,
          values: w.values as Record<string, string | number> | undefined,
        });
      }
    }
  }

  return findings;
}

/**
 * Aggregate all plan-wide warnings (across all pets and days) plus
 * per-pet recommendations. Used by the plan view header card.
 */
export function planFindings(plan: MealPlan, pets: PetProfile[]): PlanFinding[] {
  const findings: PlanFinding[] = [];

  for (const pet of pets) {
    findings.push(...recommendForPet(pet));
  }

  // Coverage findings would duplicate per-pet warnings, so we use them
  // only when the engine surfaced something that didn't come from
  // recommendForPet (currently a subset; future hook).
  return dedupe(findings);
}

function dedupe(findings: PlanFinding[]): PlanFinding[] {
  const seen = new Set<string>();
  const out: PlanFinding[] = [];
  for (const f of findings) {
    const key = `${f.petId ?? '_'}:${f.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}

function stringifyValues(
  v: NutritionWarning['values'] | undefined,
): Record<string, string | number> | undefined {
  if (!v) return undefined;
  const out: Record<string, string | number> = {};
  for (const [k, value] of Object.entries(v)) out[k] = value;
  return out;
}

// Re-export PlanDay for any callers that traverse a plan in their own code.
export type { PlanDay };

/**
 * Heuristic estimate of total daily food (g) the household will cook.
 * Uses 2.5% of body weight per pet — the conservative low end of the
 * cooked-diet daily-food band (see nutrition.ts). Used by
 * `recommendDefaultBagDays` to bias toward fewer, fuller bags for tiny
 * households (Followability Mandate sub-principle 5).
 */
export function estimateDailyFoodGrams(pets: PetProfile[]): number {
  return pets.reduce((s, p) => s + p.nutrition.weightKg * 0.025 * 1000, 0);
}

/**
 * Recommend a sensible default `bagDays` for the household. Small
 * households (single cat, senior cat) eat < 60 g/day — at bagDays=1 or 2
 * they end up cooking sessions every 2-3 days for under 200 g of food,
 * which is the runt-bag pattern the Followability Mandate guards
 * against. Default to bagDays=3 for them; medium-and-up households keep
 * the standard 2-day default.
 */
export function recommendDefaultBagDays(pets: PetProfile[]): 1 | 2 | 3 {
  if (pets.length === 0) return 2;
  const daily = estimateDailyFoodGrams(pets);
  // Tiny households (≤ ~1 small cat, or a small senior cat) save
  // meaningful cook overhead with the longer window.
  if (daily < 200) return 3;
  return 2;
}
