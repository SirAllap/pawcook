import { z } from 'zod';
import { NutritionInputSchema } from './schemas.js';

// Chronic conditions that affect diet planning. Distinct from
// transient body condition (which lives on NutritionInputSchema).
export const HealthConditionSchema = z.enum([
  'allergy',
  'kidney',
  'pancreatitis',
  'diabetes',
  'joint',
  'gi_sensitive',
  'obese',
]);
export type HealthCondition = z.infer<typeof HealthConditionSchema>;

const ISO_DATE = z.string().regex(
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/,
  'Expected ISO date',
);

export const PetProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(32),
  photo: z.string().max(500_000).optional(),
  birthDate: ISO_DATE.optional(),
  allergies: z.array(z.string()).default([]),
  conditions: z.array(HealthConditionSchema).default([]),
  notes: z.string().max(280).optional(),
  nutrition: NutritionInputSchema,
  createdAt: ISO_DATE,
  updatedAt: ISO_DATE,
});
export type PetProfile = z.infer<typeof PetProfileSchema>;

export function newPetId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `pet_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
