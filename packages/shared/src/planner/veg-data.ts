// Typed access into vegetable-cooking.json and cooked-yield.json.
// Validates both JSON files at module load — a malformed entry fails
// fast in dev/CI rather than rendering broken cards at runtime.

import vegCookingJson from '@pawcook/data/vegetable-cooking';
import cookedYieldJson from '@pawcook/data/cooked-yield';
import { z } from 'zod';
import {
  VegCutSchema,
  CookingMethodSchema,
  type VegCut,
  type CookingMethod,
} from '../schemas.js';

const MinMaxSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
});

const MethodSpecSchema = z.object({
  tempC: z.number(),
  minutes: MinMaxSchema,
  notes: z.string().optional(),
  warning: z.string().optional(),
  // Extra minutes when cooking from frozen (vacuum-seal + sous-vide
  // workflow). Optional — absent means "we don't know, owner judges".
  fromFrozenAddMin: z.number().nonnegative().optional(),
});
export type VegMethodSpec = z.infer<typeof MethodSpecSchema>;

// recommendedMethod is a looser string than CookingMethodSchema —
// it can be 'steam' | 'bake' | 'blanch' | 'raw' | 'boil', which the
// existing VegCookingGuide UI maps onto the strict cooking methods.
const VegCookingEntrySchema = z.object({
  id: z.string(),
  recommendedMethod: z.string(),
  recommendedTempC: z.number(),
  recommendedMinutes: MinMaxSchema,
  recommendedNotes: z.string(),
  recommendedReason: z.string(),
  speciesNotes: z.record(z.string()).optional(),
  rawBlocked: z.boolean().optional(),
  rawBlockedReason: z.string().optional(),
  cookingBlocked: z.boolean().optional(),
  cookingBlockedReason: z.string().optional(),
  applicableCuts: z.array(VegCutSchema).min(1),
  defaultCut: VegCutSchema,
  methods: z.record(MethodSpecSchema.nullable()),
  specsByCut: z.record(z.record(MethodSpecSchema)),
}).superRefine((entry, ctx) => {
  if (!entry.applicableCuts.includes(entry.defaultCut)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['defaultCut'],
      message: `defaultCut '${entry.defaultCut}' is not listed in applicableCuts for '${entry.id}'.`,
    });
  }
  for (const cut of Object.keys(entry.specsByCut)) {
    if (!entry.applicableCuts.includes(cut as VegCut)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['specsByCut', cut],
        message: `specsByCut entry '${cut}' is not in applicableCuts for '${entry.id}'.`,
      });
    }
  }
});
export type VegCookingEntry = z.infer<typeof VegCookingEntrySchema>;

const VEG_COOKING_DATA: readonly VegCookingEntry[] = z
  .array(VegCookingEntrySchema)
  .parse(vegCookingJson);

const YieldFileSchema = z.object({
  $comment: z.string().optional(),
  // 0 < yield ≤ 1.2 — some veggies (boiled sweet potato) gain a hair
  // of water, but anything above ~1.2 is data-entry error.
  yields: z.record(z.record(z.number().positive().max(1.2))),
});

const YIELDS: Record<string, Record<string, number>> =
  YieldFileSchema.parse(cookedYieldJson).yields;

export function listVegCookingIds(): readonly string[] {
  return VEG_COOKING_DATA.map((e) => e.id);
}

export function getVegCookingEntry(id: string): VegCookingEntry | undefined {
  return VEG_COOKING_DATA.find((e) => e.id === id);
}

export function applicableCutsFor(id: string): readonly VegCut[] {
  return getVegCookingEntry(id)?.applicableCuts ?? [];
}

export function defaultCutFor(id: string): VegCut | undefined {
  return getVegCookingEntry(id)?.defaultCut;
}

/**
 * Look up the cooking spec for an (ingredient, cut, method) triple.
 *
 * Resolution order:
 *   1. specsByCut[cut][method] — explicit per-cut override.
 *   2. methods[method] when cut === defaultCut.
 *   3. methods[method] when cut is in applicableCuts (fallback —
 *      better to show the default-cut time than no time at all).
 *   4. null — the method is not supported for this veggie at all
 *      (e.g., spinach + sous_vide).
 */
export function selectCutMethodSpec(
  id: string,
  cut: VegCut,
  method: CookingMethod,
): VegMethodSpec | null {
  const entry = getVegCookingEntry(id);
  if (!entry) return null;

  const cutOverride = entry.specsByCut[cut]?.[method];
  if (cutOverride) return cutOverride;

  const def = entry.methods[method];
  if (cut === entry.defaultCut) return def ?? null;
  if (entry.applicableCuts.includes(cut)) return def ?? null;
  return null;
}

/**
 * Cooked-yield for an (ingredient, cut). Returns 1.0 when missing —
 * the safe default that preserves current (yield-unaware) behavior.
 */
export function yieldForCut(id: string, cut: VegCut): number {
  const perCut = YIELDS[id];
  if (!perCut) return 1.0;
  const v = perCut[cut];
  return typeof v === 'number' ? v : 1.0;
}

/**
 * Re-export the strict CookingMethod enum for callers that want to
 * iterate methods without re-importing from '../schemas'.
 */
export { CookingMethodSchema };
