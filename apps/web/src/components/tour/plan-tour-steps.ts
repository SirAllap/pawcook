import type { MealPlan, PetProfile } from '@pawcook/shared';
import type { TourStep } from './TourOverlay';

interface BuildContext {
  plan: MealPlan;
  pets: PetProfile[];
  t: (key: string, vals?: Record<string, unknown>) => string;
}

// The plan-view tour. Steps anchor on `[data-tour="..."]` attributes
// added to PlanView and its children. Steps whose anchor element isn't
// present (e.g., supplement card on a non-cat household, cooking tab on
// a non-sous-vide plan) are dropped at build time so the user never
// sees a popover pointing at nothing.
export function buildPlanTourSteps({ plan, pets, t }: BuildContext): TourStep[] {
  const hasCat = pets.some((p) => p.nutrition.species === 'cat');
  const showsSupplement = plan.sourcing.simpleMeals && hasCat;
  const hasCookingPlan = Boolean(plan.cookingPlan);

  const steps: TourStep[] = [
    {
      id: 'welcome',
      anchor: '[data-tour="plan-title"]',
      title: t('onboarding.tour.welcome.title', { defaultValue: 'Welcome to your plan' }),
      body: t('onboarding.tour.welcome.body', {
        defaultValue: "Here's a 30-second tour of what's here. Skip any time.",
      }),
      side: 'bottom',
    },
    {
      id: 'meals',
      anchor: '[data-tour="meals-tab"]',
      title: t('onboarding.tour.meals.title', { defaultValue: 'Meals' }),
      body: t('onboarding.tour.meals.body', {
        defaultValue: 'Day-by-day portions per pet — grams, kcal, and the protein for each meal.',
      }),
      side: 'bottom',
    },
  ];

  if (showsSupplement) {
    steps.push({
      id: 'supplement',
      anchor: '[data-tour="supplement-card"]',
      title: t('onboarding.tour.supplement.title', { defaultValue: 'Daily supplement' }),
      body: t('onboarding.tour.supplement.body', {
        defaultValue:
          'When the plan simplifies meals, dropped nutrients show up here as a named daily dose — not silently omitted.',
      }),
      side: 'top',
    });
  }

  steps.push({
    id: 'shopping',
    anchor: '[data-tour="shopping-tab"]',
    title: t('onboarding.tour.shopping.title', { defaultValue: 'Shopping list' }),
    body: t('onboarding.tour.shopping.body', {
      defaultValue: 'Grouped by store section. Tap an item to check it off as you shop.',
    }),
    side: 'bottom',
  });

  if (hasCookingPlan) {
    steps.push({
      id: 'cooking',
      anchor: '[data-tour="cooking-tab"]',
      title: t('onboarding.tour.cooking.title', { defaultValue: 'Cooking plan' }),
      body: t('onboarding.tour.cooking.body', {
        defaultValue: 'Date-stamped bag schedule for sous-vide. Cook once, feed for days.',
      }),
      side: 'bottom',
    });
  }

  return steps;
}
