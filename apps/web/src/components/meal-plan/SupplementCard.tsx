import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pill, Check } from 'lucide-react';
import { calculateNutrition, type MealPlan, type PetProfile } from '@pawcook/shared';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { PetTag } from './PetTag';

const DISMISS_KEY = (planId: string) => `pawcook_supplement_card_dismissed_${planId}`;

type SupplementRow = {
  id: string;
  petId: string;
  petName: string;
  label: string;
  dose: string;
  rationale: string;
};

/**
 * Daily supplement card. Companion to the Followability Mandate
 * (see /CLAUDE.md sub-principle 4): when the planner collapses a
 * cat's diet to a simple-meals shape, the dropped nutrients are
 * surfaced here as a *named* daily supplement with specific dosing
 * — not silently omitted, not buried in muted warning text.
 *
 * Only renders when the plan uses simpleMeals AND contains at least
 * one cat. Dismiss state is per-plan in localStorage so the card
 * doesn't reappear on every visit once the user has set up their
 * supplement workflow.
 */
export function SupplementCard({ plan, pets }: { plan: MealPlan; pets: PetProfile[] }) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof localStorage === 'undefined') return false;
    try { return localStorage.getItem(DISMISS_KEY(plan.id)) === '1'; }
    catch { return false; }
  });

  // Refresh dismiss state when the plan id changes (navigate between plans).
  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    try { setDismissed(localStorage.getItem(DISMISS_KEY(plan.id)) === '1'); }
    catch { /* ignore */ }
  }, [plan.id]);

  const planPets = useMemo(
    () => pets.filter((p) => plan.petIds.includes(p.id)),
    [pets, plan.petIds],
  );

  const rows = useMemo<SupplementRow[]>(() => {
    if (!plan.sourcing.simpleMeals) return [];
    const out: SupplementRow[] = [];
    for (const pet of planPets) {
      const isCat = pet.nutrition.species === 'cat';
      const isCooked = pet.nutrition.macroProfile.includes('cooked')
        || pet.nutrition.macroProfile === 'balanced_cooked'
        || pet.nutrition.macroProfile === 'high_protein'
        || pet.nutrition.macroProfile === 'cat_cooked_carnivore';

      // Per-pet calcium ladder: every cooked-diet pet needs this.
      // Compute via the engine so the dose tracks pet weight & profile.
      const nutrition = calculateNutrition(pet.nutrition);
      if (isCooked && nutrition.calciumSupplementMg > 0) {
        out.push({
          id: `${pet.id}:calcium`,
          petId: pet.id,
          petName: pet.name,
          label: t('mealPlan.supplements.calcium.label', { defaultValue: 'Calcium citrate (or ground eggshell)' }),
          dose: t('mealPlan.supplements.calcium.dose', {
            defaultValue: '{{mg}} mg per day (~½ tsp ground eggshell per ~454 g meat)',
            mg: nutrition.calciumSupplementMg,
          }),
          rationale: t('mealPlan.supplements.calcium.rationale', {
            defaultValue: 'Cooked meals are calcium-deficient without bone — this closes the gap.',
          }),
        });
      }

      if (!isCat) continue;

      // Cats on simple meals lose taurine + pre-formed vit A + omega-3.
      // Dosing is conservative, per veterinary nutrition guidance for
      // home-cooked feline diets.
      const taurineMg = Math.max(125, Math.round((pet.nutrition.weightKg * 60) / 25) * 25);
      out.push({
        id: `${pet.id}:taurine`,
        petId: pet.id,
        petName: pet.name,
        label: t('mealPlan.supplements.taurine.label', { defaultValue: 'Taurine powder' }),
        dose: t('mealPlan.supplements.taurine.dose', {
          defaultValue: '{{mg}} mg per day (about ¼ tsp)',
          mg: taurineMg,
        }),
        rationale: t('mealPlan.supplements.taurine.rationale', {
          defaultValue: 'Cooking destroys ~20% of taurine. Deficit causes irreversible blindness + dilated cardiomyopathy.',
        }),
      });

      const codLiverMl = Math.max(1, Math.round(pet.nutrition.weightKg / 4));
      out.push({
        id: `${pet.id}:codliveroil`,
        petId: pet.id,
        petName: pet.name,
        label: t('mealPlan.supplements.codLiver.label', { defaultValue: 'Cod liver oil' }),
        dose: t('mealPlan.supplements.codLiver.dose', {
          defaultValue: '~{{ml}} mL, 3× per week',
          ml: codLiverMl,
        }),
        rationale: t('mealPlan.supplements.codLiver.rationale', {
          defaultValue: 'Covers pre-formed vitamin A and omega-3 (EPA/DHA) in one dose — what the dropped organ + seafood slots no longer provide.',
        }),
      });
    }
    return out;
  }, [plan, planPets, t]);

  const onDismiss = useCallback(() => {
    setDismissed(true);
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(DISMISS_KEY(plan.id), '1');
    } catch { /* ignore */ }
  }, [plan.id]);

  const onUndo = useCallback(() => {
    setDismissed(false);
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(DISMISS_KEY(plan.id));
    } catch { /* ignore */ }
  }, [plan.id]);

  if (rows.length === 0) return null;

  if (dismissed) {
    // Stay visible as an active reminder (not muted "resolved" chrome) and
    // name the supplements, so a daily taurine/calcium routine isn't reduced
    // to a forgettable grey line.
    const names = Array.from(new Set(rows.map((r) => r.label))).join(' · ');
    return (
      <Card padding="md" className="bg-primary/5 border-primary/30 flex items-start justify-between gap-3">
        <span className="flex min-w-0 items-start gap-2">
          <Pill className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 text-xs leading-snug text-foreground/80">
            <span className="font-bold">
              {t('mealPlan.supplements.dismissedLabel', { defaultValue: 'Daily supplements' })}
            </span>
            {' — '}
            {names}
          </span>
        </span>
        <button
          type="button"
          onClick={onUndo}
          className="shrink-0 text-[11px] font-bold text-primary underline-offset-2 hover:underline min-h-[28px] px-2"
        >
          {t('mealPlan.supplements.undo', { defaultValue: 'Show again' })}
        </button>
      </Card>
    );
  }

  // Group rows by pet so the user reads "for Blacky: take X + Y" instead
  // of a flat list of pills.
  const rowsByPet = new Map<string, SupplementRow[]>();
  for (const r of rows) {
    const list = rowsByPet.get(r.petId) ?? [];
    list.push(r);
    rowsByPet.set(r.petId, list);
  }

  return (
    <Card padding="md" data-tour="supplement-card" className="bg-primary/5 border-primary/30 space-y-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Pill className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wider text-primary">
            {t('mealPlan.supplements.title', { defaultValue: 'Daily supplements' })}
          </p>
          <p className="text-[11px] text-muted-fg mt-0.5 leading-snug">
            {t('mealPlan.supplements.help', {
              defaultValue: "What the simple-meals plan doesn't cover. Set these up once and dose with breakfast.",
            })}
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {Array.from(rowsByPet.entries()).map(([petId, petRows]) => {
          const pet = planPets.find((p) => p.id === petId);
          return (
            <li key={petId} className="space-y-1.5">
              {pet && (
                <div>
                  <PetTag pet={pet} />
                </div>
              )}
              <ul className="space-y-2 pl-1">
                {petRows.map((r) => (
                  <li key={r.id} className="text-sm leading-snug">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <span className="font-bold text-foreground">{r.label}</span>
                      <span className="font-mono text-[11px] tabular-nums text-primary">{r.dose}</span>
                    </div>
                    <p className="text-xs text-foreground/70 leading-snug mt-0.5">{r.rationale}</p>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>

      <div className="flex justify-end pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onDismiss}>
          <Check className="h-3.5 w-3.5" aria-hidden />
          {t('mealPlan.supplements.dismiss', { defaultValue: 'Got it' })}
        </Button>
      </div>
    </Card>
  );
}

/**
 * Helper for surrounding code (e.g. NutrientCoverageCard) to know
 * whether to hide warnings that the supplement card has already
 * acknowledged. Returns the set of nutrition.warning ids that are
 * covered by an acknowledged supplement.
 */
export function dismissedSupplementCoveredWarnings(planId: string): Set<string> {
  if (typeof localStorage === 'undefined') return new Set();
  try {
    if (localStorage.getItem(DISMISS_KEY(planId)) === '1') {
      // Warning ids that the supplement card covers — keep in sync with
      // the rows above. Source: nutrition*.ts where the warnings are
      // pushed (lowTaurine, cookedCaDeficient, etc.).
      return new Set([
        'lowTaurine',
        'nutrition.warnings.lowTaurine',
        'cookedCaDeficient',
        'nutrition.warnings.cookedCaDeficient',
      ]);
    }
  } catch { /* ignore */ }
  return new Set();
}
