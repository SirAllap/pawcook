import { z } from 'zod';
import {
  PetProfileSchema, MealPlanSchema,
  type PetProfile, type MealPlan,
} from '@pawcook/shared';

const SCHEMA_VERSION = 1 as const;

export const BackupFileSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  exportedAt: z.string(),
  app: z.literal('pawcook'),
  pets: z.array(PetProfileSchema),
  mealPlans: z.array(MealPlanSchema),
});
export type BackupFile = z.infer<typeof BackupFileSchema>;

export type ImportSummary = {
  pets: number;
  mealPlans: number;
  skippedPets: number;
  skippedPlans: number;
};

/**
 * Bundle every persisted profile + plan into a single JSON download.
 * Triggers a download — does not return the blob to keep the caller
 * trivial. Uses a date-stamped filename.
 */
export function exportAllData(pets: PetProfile[], mealPlans: MealPlan[]): void {
  const backup: BackupFile = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'pawcook',
    pets,
    mealPlans,
  };
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pawcook-backup-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
}

export type ParsedImport = {
  ok: true;
  pets: PetProfile[];
  mealPlans: MealPlan[];
  skippedPets: number;
  skippedPlans: number;
} | {
  ok: false;
  reason: string;
};

/**
 * Parse a backup file. Strict on top-level shape (must be a PawCook
 * backup file), lenient inside: any single pet or plan that fails
 * schema validation is skipped rather than aborting the whole import.
 */
export async function parseBackupFile(file: File): Promise<ParsedImport> {
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, reason: 'fileTooLarge' };
  }
  let text: string;
  try {
    text = await file.text();
  } catch {
    return { ok: false, reason: 'readFailed' };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'notJson' };
  }

  // We validate the envelope strictly, then validate each pet/plan
  // individually so one bad entry doesn't sink the import.
  const envelope = z.object({
    schemaVersion: z.number(),
    app: z.string(),
    pets: z.array(z.unknown()).optional(),
    mealPlans: z.array(z.unknown()).optional(),
  }).safeParse(parsed);

  if (!envelope.success) return { ok: false, reason: 'notPawcookBackup' };
  if (envelope.data.app !== 'pawcook') return { ok: false, reason: 'notPawcookBackup' };
  if (envelope.data.schemaVersion !== SCHEMA_VERSION) {
    return { ok: false, reason: 'unsupportedVersion' };
  }

  const pets: PetProfile[] = [];
  let skippedPets = 0;
  for (const item of envelope.data.pets ?? []) {
    const result = PetProfileSchema.safeParse(item);
    if (result.success) pets.push(result.data);
    else skippedPets += 1;
  }

  const mealPlans: MealPlan[] = [];
  let skippedPlans = 0;
  for (const item of envelope.data.mealPlans ?? []) {
    const result = MealPlanSchema.safeParse(item);
    if (result.success) mealPlans.push(result.data);
    else skippedPlans += 1;
  }

  return { ok: true, pets, mealPlans, skippedPets, skippedPlans };
}
