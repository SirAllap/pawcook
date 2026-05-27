import {
  newPetId,
  type PetProfile,
  type PlanDuration,
  type SourcingPrefs,
} from '@pawcook/shared';

// Starter templates collapse the wizard's 12+ decisions into a one-click
// pick. Each template knows what pets to seed (with placeholder weights
// the user will tune later), what sourcing defaults to apply, and how
// long the first plan should run. See /CLAUDE.md (Defaults favour the
// median home; Rigor lives behind a switch).
export type StarterTemplateId =
  | 'single_adult_dog'
  | 'multi_pet_dog_cat'
  | 'single_indoor_cat'
  | 'senior_dog_low_activity';

export type StarterTemplateIcon = 'Dog' | 'Cat' | 'Users' | 'Heart';

interface PetSeed {
  // i18n key root for the placeholder name (e.g. 'onboarding.template.petName.dog').
  // The user can rename via the pet edit screen — these are never permanent.
  nameKey: string;
  nutrition: PetProfile['nutrition'];
  conditions?: PetProfile['conditions'];
}

export interface StarterTemplate {
  id: StarterTemplateId;
  // i18n key root: expects .title, .description, .tag children.
  i18nKey: string;
  icon: StarterTemplateIcon;
  duration: PlanDuration;
  petSeeds: PetSeed[];
  sourcing: Partial<SourcingPrefs>;
}

export const STARTER_TEMPLATES: ReadonlyArray<StarterTemplate> = [
  {
    id: 'single_adult_dog',
    i18nKey: 'onboarding.template.single_adult_dog',
    icon: 'Dog',
    duration: 7,
    petSeeds: [
      {
        nameKey: 'onboarding.template.petName.dog',
        nutrition: {
          species: 'dog',
          weightKg: 20,
          age: 'adult',
          activityLevel: 'moderate',
          bodyCondition: 'ideal',
          reproductiveStatus: 'neutered',
          mealsPerDay: 2,
          macroProfile: 'balanced_cooked',
          cookingMethod: 'fully_cooked',
        },
      },
    ],
    sourcing: {
      variety: 'standard',
      accessibility: 'easy',
      preferredCookingMethod: 'sous_vide',
      simpleMeals: true,
      bagDays: 2,
    },
  },
  {
    id: 'multi_pet_dog_cat',
    i18nKey: 'onboarding.template.multi_pet_dog_cat',
    icon: 'Users',
    duration: 7,
    petSeeds: [
      {
        nameKey: 'onboarding.template.petName.dog',
        nutrition: {
          species: 'dog',
          weightKg: 22,
          age: 'adult',
          activityLevel: 'moderate',
          bodyCondition: 'ideal',
          reproductiveStatus: 'neutered',
          mealsPerDay: 2,
          macroProfile: 'balanced_cooked',
          cookingMethod: 'fully_cooked',
        },
      },
      {
        nameKey: 'onboarding.template.petName.cat',
        nutrition: {
          species: 'cat',
          weightKg: 4,
          age: 'adult',
          activityLevel: 'moderate',
          bodyCondition: 'ideal',
          reproductiveStatus: 'neutered',
          mealsPerDay: 2,
          macroProfile: 'cat_cooked_carnivore',
          cookingMethod: 'fully_cooked',
        },
      },
    ],
    sourcing: {
      // simpleMeals on so the cat eats the same protein the dog cooks and
      // gets a daily taurine + cod liver oil supplement card — CLAUDE.md
      // principle 2 (household is the unit) + principle 3 (sub-threshold
      // add-ins are pills).
      variety: 'standard',
      accessibility: 'easy',
      preferredCookingMethod: 'oven',
      simpleMeals: true,
      bagDays: 2,
    },
  },
  {
    id: 'single_indoor_cat',
    i18nKey: 'onboarding.template.single_indoor_cat',
    icon: 'Cat',
    duration: 7,
    petSeeds: [
      {
        nameKey: 'onboarding.template.petName.cat',
        nutrition: {
          species: 'cat',
          weightKg: 4,
          age: 'adult',
          activityLevel: 'sedentary',
          bodyCondition: 'ideal',
          reproductiveStatus: 'neutered',
          mealsPerDay: 2,
          macroProfile: 'cat_cooked_carnivore',
          cookingMethod: 'fully_cooked',
        },
      },
    ],
    sourcing: {
      variety: 'standard',
      accessibility: 'easy',
      preferredCookingMethod: 'stovetop_low',
      simpleMeals: true,
      bagDays: 2,
    },
  },
  {
    id: 'senior_dog_low_activity',
    i18nKey: 'onboarding.template.senior_dog_low_activity',
    icon: 'Heart',
    duration: 14,
    petSeeds: [
      {
        nameKey: 'onboarding.template.petName.dog',
        nutrition: {
          species: 'dog',
          weightKg: 18,
          age: 'senior',
          activityLevel: 'sedentary',
          bodyCondition: 'ideal',
          reproductiveStatus: 'neutered',
          mealsPerDay: 2,
          macroProfile: 'balanced_cooked',
          cookingMethod: 'fully_cooked',
        },
        conditions: ['joint'],
      },
    ],
    sourcing: {
      variety: 'standard',
      accessibility: 'easy',
      preferredCookingMethod: 'slow_cooker',
      simpleMeals: true,
      bagDays: 2,
    },
  },
];

export function getTemplate(id: string | null | undefined): StarterTemplate | undefined {
  if (!id) return undefined;
  return STARTER_TEMPLATES.find((t) => t.id === id);
}

// Build PetProfiles from a template. Names are resolved by the caller
// (which has access to i18n's `t`) so the registry stays string-free.
export function instantiatePetsFromTemplate(
  template: StarterTemplate,
  resolveName: (key: string) => string,
): PetProfile[] {
  const now = new Date().toISOString();
  return template.petSeeds.map((seed) => ({
    id: newPetId(),
    name: resolveName(seed.nameKey),
    allergies: [],
    conditions: seed.conditions ?? [],
    nutrition: seed.nutrition,
    createdAt: now,
    updatedAt: now,
  }));
}
