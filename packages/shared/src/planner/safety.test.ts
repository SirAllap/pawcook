import { describe, expect, it } from 'vitest';
import { checkPlanSafety, hasBlockingRefusals } from './safety.js';
import type { PetProfile } from '../pets.js';

const basePet: PetProfile = {
  id: 'pet-1',
  name: 'Rex',
  allergies: [],
  conditions: [],
  nutrition: {
    species: 'dog',
    weightKg: 20,
    age: 'adult',
    activityLevel: 'moderate',
    bodyCondition: 'ideal',
    reproductiveStatus: 'neutered',
    mealsPerDay: 2,
    macroProfile: 'balanced_cooked',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('checkPlanSafety', () => {
  it('returns no refusals for the default Lean Cooked preset', () => {
    const refusals = checkPlanSafety([basePet]);
    expect(refusals).toEqual([]);
  });

  it('refuses absolute when a custom diet has 0% protein', () => {
    const refusals = checkPlanSafety([
      {
        ...basePet,
        nutrition: {
          ...basePet.nutrition,
          macroProfile: 'custom',
          customDiet: {
            mode: 'easy',
            macros: { protein: 0, fat: 0, veg: 100, carb: 0 },
            calciumSource: 'eggshell',
            supplements: { omega3: false, vitaminE: false, taurine: false, multivitamin: false },
          },
        },
      },
    ]);
    const zero = refusals.find((r) => r.rule === 'zero_protein');
    expect(zero?.severity).toBe('absolute');
    expect(zero?.overrideAvailable).toBe(false);
    expect(hasBlockingRefusals(refusals)).toBe(true);
  });

  it('refuses overridable when protein below 18% without matching vet prescription', () => {
    const refusals = checkPlanSafety([
      {
        ...basePet,
        nutrition: {
          ...basePet.nutrition,
          macroProfile: 'custom',
          customDiet: {
            mode: 'easy',
            macros: { protein: 15, fat: 0, veg: 85, carb: 0 },
            calciumSource: 'eggshell',
            supplements: { omega3: false, vitaminE: false, taurine: false, multivitamin: false },
          },
        },
      },
    ]);
    const low = refusals.find((r) => r.rule === 'protein_below_nrc_min');
    expect(low?.severity).toBe('overridable');
    expect(low?.overrideAvailable).toBe(false);
  });

  it('relaxes the low-protein refusal when a vet prescription is present, matched, AND acknowledged', () => {
    const refusals = checkPlanSafety([
      {
        ...basePet,
        nutrition: {
          ...basePet.nutrition,
          macroProfile: 'custom',
          customDiet: {
            mode: 'easy',
            macros: { protein: 15, fat: 0, veg: 85, carb: 0 },
            calciumSource: 'eggshell',
            supplements: { omega3: false, vitaminE: false, taurine: false, multivitamin: false },
          },
          vetPrescription: {
            condition: 'renal_ckd',
            restrictedIngredients: [],
            acknowledgments: ['protein_below_nrc_min'],
          },
        },
      },
    ]);
    expect(refusals.find((r) => r.rule === 'protein_below_nrc_min')).toBeUndefined();
  });

  it('flags overridable refusal as overrideAvailable=true when vet matches but not acknowledged', () => {
    const refusals = checkPlanSafety([
      {
        ...basePet,
        nutrition: {
          ...basePet.nutrition,
          macroProfile: 'custom',
          customDiet: {
            mode: 'easy',
            macros: { protein: 15, fat: 0, veg: 85, carb: 0 },
            calciumSource: 'eggshell',
            supplements: { omega3: false, vitaminE: false, taurine: false, multivitamin: false },
          },
          vetPrescription: {
            condition: 'renal_ckd',
            restrictedIngredients: [],
            acknowledgments: [],
          },
        },
      },
    ]);
    const low = refusals.find((r) => r.rule === 'protein_below_nrc_min');
    expect(low?.overrideAvailable).toBe(true);
  });

  it('refuses absolute when custom diet has cooked bone (bone > 0 in fully-cooked mode)', () => {
    const refusals = checkPlanSafety([
      {
        ...basePet,
        nutrition: {
          ...basePet.nutrition,
          macroProfile: 'custom',
          cookingMethod: 'fully_cooked',
          customDiet: {
            mode: 'advanced',
            macros: { protein: 80, fat: 0, veg: 20, carb: 0 },
            proteinComposition: { muscle: 85, organ: 10, bone: 5 },
            calciumSource: 'bone_in',
            supplements: { omega3: false, vitaminE: false, taurine: false, multivitamin: false },
          },
        },
      },
    ]);
    const bone = refusals.find((r) => r.rule === 'cooked_bone');
    expect(bone?.severity).toBe('absolute');
    expect(bone?.overrideAvailable).toBe(false);
  });

  it('refuses absolute when vet prescription is past its review date', () => {
    const refusals = checkPlanSafety([
      {
        ...basePet,
        nutrition: {
          ...basePet.nutrition,
          vetPrescription: {
            condition: 'renal_ckd',
            restrictedIngredients: [],
            acknowledgments: [],
            reviewDate: '2020-01-01',
          },
        },
      },
    ]);
    const expired = refusals.find((r) => r.rule === 'expired_vet_review');
    expect(expired?.severity).toBe('absolute');
  });
});
