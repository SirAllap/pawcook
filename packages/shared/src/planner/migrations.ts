// Plan schema migrations. Each step takes the raw plan JSON, mutates
// it in place to the next schema version, and returns it. The loader
// runs migrations before Zod parse so we never reject a plan just
// because its shape predates a new field.
//
// Hard rules:
//   • Never throw — return the input unchanged if a step can't apply.
//   • Never widen behavior silently. If a v1 plan would render
//     differently under v2 rules (e.g. raw→cooked yield correction),
//     set an opt-out flag (`appliesCookYield: false`) so the user
//     does not get surprised by inflated shopping lists.
//   • Migrations operate on `unknown`/Record<string, unknown>` since
//     the input has not yet been Zod-validated.

import { CURRENT_PLAN_SCHEMA_VERSION } from './schemas.js';

type RawPlan = Record<string, unknown>;

function isRecord(v: unknown): v is RawPlan {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function detectVersion(plan: RawPlan): number {
  const v = plan.schemaVersion;
  if (v === 2) return 2;
  if (v === 1) return 1;
  return 1;
}

function migrateV1toV2(plan: RawPlan): RawPlan {
  plan.schemaVersion = 2;

  // Default the new shopping behavior to off for migrated plans —
  // a v1 plan was authored under "raw weight == cooked weight"
  // assumptions; flipping the yield correction on would silently
  // change the user's spinach buy from 100 g to 670 g.
  if (plan.appliesCookYield === undefined) {
    plan.appliesCookYield = false;
  }

  if (!Array.isArray(plan.pantry)) {
    plan.pantry = [];
  }

  // Seed new sourcing fields with the median-home defaults. Sourcing
  // is required, so it must already be an object — guard anyway.
  if (isRecord(plan.sourcing)) {
    const sourcing = plan.sourcing;
    if (sourcing.veggieDetail === undefined) sourcing.veggieDetail = false;
    if (sourcing.packagingDefault === undefined) sourcing.packagingDefault = 'freezer_bag';
    if (!Array.isArray(sourcing.cutRotation)) sourcing.cutRotation = [];
  }

  // CookingPlan gains optional supplementCards / veggieSessions.
  // Leaving them undefined is valid; populating with empty arrays
  // makes downstream consumers simpler (length check vs nullish).
  if (isRecord(plan.cookingPlan)) {
    const cooking = plan.cookingPlan;
    if (!Array.isArray(cooking.supplementCards)) cooking.supplementCards = [];
    if (!Array.isArray(cooking.veggieSessions)) cooking.veggieSessions = [];
  }

  return plan;
}

/**
 * Apply all migrations needed to bring `raw` up to the current schema
 * version. Returns the same object (mutated) for v1→v2; returns input
 * unchanged for v2. Returns null when input isn't even shaped like a
 * plan (caller falls through to Zod which will reject it cleanly).
 */
export function migratePlan(raw: unknown): RawPlan | null {
  if (!isRecord(raw)) return null;
  const plan = raw;
  let version = detectVersion(plan);

  if (version === 1) {
    migrateV1toV2(plan);
    version = 2;
  }

  // Guard rail — if a future bump shipped the wrong version literal,
  // pin it back to the constant so Zod will not refuse.
  if (plan.schemaVersion !== CURRENT_PLAN_SCHEMA_VERSION) {
    plan.schemaVersion = CURRENT_PLAN_SCHEMA_VERSION;
  }

  return plan;
}
