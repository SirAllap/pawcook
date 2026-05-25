import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Check, Calendar, Sparkles, RotateCcw, Save, ShieldAlert } from 'lucide-react';
import {
  generateMealPlan, SourcingPrefsSchema, checkPlanSafety, hasBlockingRefusals,
  recommendDefaultBagDays, estimateDailyFoodGrams,
  type MealPlan, type PetProfile, type PlanDuration, type SourcingPrefs,
  type PlannerRefusal,
} from '@pawcook/shared';
import { PageHeader } from '../../components/ui/page-header';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { SectionLabel } from '../../components/ui/section-label';
import { EmptyState } from '../../components/ui/empty-state';
import { PageFallback } from '../../components/ui/page-fallback';
import { PetAvatar } from '../../components/pets/PetAvatar';
import { SourcingPicker } from '../../components/meal-plan/SourcingPicker';
import { CalendarGrid } from '../../components/meal-plan/CalendarGrid';
import { NutrientCoverageCard } from '../../components/meal-plan/NutrientCoverageCard';
import { usePets } from '../../contexts/PetProfilesContext';
import { useMealPlans } from '../../contexts/MealPlansContext';
import { cn } from '../../lib/cn';

const DURATIONS: PlanDuration[] = [7, 14, 30];

export default function PlanWizard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id?: string }>();
  const { pets, ready: petsReady } = usePets();
  const { addPlan, updatePlan, getPlan, ready: plansReady } = useMealPlans();

  // Edit-mode prefill: when the route is /meal-plan/:id/edit, load the
  // saved plan and pre-populate the wizard state with its sourcing,
  // pets, duration, and name. Edits are committed back to the same
  // plan id via updatePlan, preserving shopping-check history and the
  // original createdAt timestamp.
  const editingPlan = editId && plansReady ? getPlan(editId) : undefined;
  const isEditMode = Boolean(editId);

  const [selectedPetIds, setSelectedPetIds] = useState<string[]>(
    () => (editingPlan ? editingPlan.petIds : []),
  );
  const [duration, setDuration] = useState<PlanDuration>(
    () => (editingPlan ? editingPlan.durationDays : 7),
  );
  const [sourcing, setSourcing] = useState<SourcingPrefs>(
    () => (editingPlan
      ? SourcingPrefsSchema.parse(editingPlan.sourcing)
      : SourcingPrefsSchema.parse({})),
  );
  const [name, setName] = useState<string>(() => (editingPlan ? editingPlan.name : ''));
  const [preview, setPreview] = useState<MealPlan | null>(null);
  const [refusals, setRefusals] = useState<PlannerRefusal[]>([]);
  // In edit mode the user already picked a Cook-ahead value, so the
  // tiny-household auto-adjust shouldn't fire. Mark as touched up front.
  const userTouchedBagDaysRef = useRef(isEditMode);

  // If a saved plan referenced pets that have since been deleted, drop
  // them from the prefill and tell the user once. Avoids a confusing
  // empty-selection state when the user navigates Pets → delete → back
  // → edit plan.
  useEffect(() => {
    if (!editingPlan) return;
    if (!petsReady) return;
    const stillExist = new Set(pets.map((p) => p.id));
    const dropped = editingPlan.petIds.filter((id) => !stillExist.has(id));
    if (dropped.length === 0) return;
    setSelectedPetIds((prev) => prev.filter((id) => stillExist.has(id)));
    toast.info(
      t('mealPlan.wizard.petRemoved', {
        defaultValue: '{{count}} pet(s) were removed from this plan because their profile no longer exists.',
        count: dropped.length,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingPlan?.id, petsReady]);

  const selectedPets = useMemo(
    () => pets.filter((p) => selectedPetIds.includes(p.id)),
    [pets, selectedPetIds],
  );

  // Recompute the recommended default whenever the pet set changes.
  // Only applies when the user hasn't manually picked a different value.
  useEffect(() => {
    if (userTouchedBagDaysRef.current) return;
    if (selectedPets.length === 0) return;
    const rec = recommendDefaultBagDays(selectedPets);
    setSourcing((s) => (s.bagDays === rec ? s : { ...s, bagDays: rec }));
  }, [selectedPets]);

  // Household hints for the wizard's Cook ahead step (drives the
  // "tiny-household consider 3 days" copy).
  const householdHints = useMemo(() => {
    if (selectedPets.length === 0) return null;
    return {
      recommendedBagDays: recommendDefaultBagDays(selectedPets),
      estimatedDailyGrams: Math.round(estimateDailyFoodGrams(selectedPets)),
    };
  }, [selectedPets]);

  function handleSourcingChange(next: SourcingPrefs) {
    if (next.bagDays !== sourcing.bagDays) userTouchedBagDaysRef.current = true;
    setSourcing(next);
  }

  // Scope the ingredient picker to whatever species is selected. If only cats
  // are picked, only show cat-safe meats/veggies; otherwise default to dog
  // (which has the broader ingredient catalog).
  const sourcingSpecies = useMemo(() => {
    if (selectedPets.length > 0 && selectedPets.every((p) => p.nutrition.species === 'cat')) {
      return 'cat' as const;
    }
    return 'dog' as const;
  }, [selectedPets]);

  // Live cook-ahead stats: dry-run the planner under the chosen bagDays
  // and again under daily rotation, then compare the resulting cook-
  // session counts so the wizard can show what the user actually saves
  // by picking a longer cook-ahead window. Runs only when sous-vide is
  // selected and at least one pet is picked; the planner is fast enough
  // (<1ms for 7-day plans) that we don't bother debouncing.
  const cookAheadStats = useMemo(() => {
    if (selectedPets.length === 0) return null;
    if (sourcing.preferredCookingMethod !== 'sous_vide') return null;
    const startDate = new Date().toISOString().slice(0, 10);
    try {
      const chosen = generateMealPlan({
        name: 'preview',
        pets: selectedPets,
        durationDays: duration,
        startDate,
        sourcing,
      });
      const daily = generateMealPlan({
        name: 'preview-daily',
        pets: selectedPets,
        durationDays: duration,
        startDate,
        sourcing: { ...sourcing, bagDays: 1 },
      });
      const chosenSessions = new Set((chosen.cookingPlan?.batches ?? []).map((b) => b.cookDate)).size;
      const dailySessions = new Set((daily.cookingPlan?.batches ?? []).map((b) => b.cookDate)).size;
      return {
        bags: chosen.cookingPlan?.batches.length ?? 0,
        sessions: chosenSessions,
        sessionsSaved: Math.max(0, dailySessions - chosenSessions),
      };
    } catch {
      return null;
    }
  }, [selectedPets, duration, sourcing]);

  function togglePet(id: string) {
    setSelectedPetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function regenerate() {
    if (selectedPets.length === 0) return;
    // Clinical-safety backstop: refuse to materialize a plan if any pet's
    // diet violates the absolute or unmet-overridable rules. Form-level
    // warnings (CustomDietPicker) already help users avoid this at the
    // drafting surface, but the planner is the output surface so it
    // enforces independently. See packages/shared/src/planner/safety.ts.
    const safetyIssues = checkPlanSafety(selectedPets);
    if (hasBlockingRefusals(safetyIssues)) {
      setRefusals(safetyIssues);
      setPreview(null);
      return;
    }
    setRefusals([]);
    try {
      // Clamp bagDays in case the user dropped duration after picking a
      // bigger bag. The wizard control disables out-of-range options
      // visually but the underlying state can still carry a stale 4.
      const maxBag = Math.min(4, Math.max(1, Math.floor(duration / 2))) as 1 | 2 | 3 | 4;
      const safeSourcing = { ...sourcing, bagDays: Math.min(sourcing.bagDays, maxBag) as 1 | 2 | 3 | 4 };
      const plan = generateMealPlan({
        name: name || defaultName(selectedPets, duration, t),
        pets: selectedPets,
        durationDays: duration,
        startDate: new Date().toISOString().slice(0, 10),
        sourcing: safeSourcing,
      });
      setPreview(plan);
    } catch (err) {
      console.error(err);
      toast.error(
        t('mealPlan.toast.generateFailed', {
          defaultValue: 'Could not generate the plan — try different settings.',
        }),
      );
    }
  }

  function save() {
    if (!preview) return;
    const finalName = name || preview.name;
    if (isEditMode && editingPlan) {
      // Edit mode: overwrite the existing plan. Preserve the original
      // id + createdAt so shopping-check history (keyed by plan id) and
      // any external bookmarks survive. updatePlan refreshes updatedAt.
      const next: MealPlan = {
        ...preview,
        id: editingPlan.id,
        createdAt: editingPlan.createdAt,
        name: finalName,
      };
      updatePlan(editingPlan.id, next);
      toast.success(
        t('mealPlan.toast.updated', {
          defaultValue: '{{name}} updated.',
          name: finalName,
        }),
      );
      navigate(`/meal-plan/${editingPlan.id}`);
      return;
    }
    const toSave: MealPlan = { ...preview, name: finalName };
    addPlan(toSave);
    toast.success(t('mealPlan.toast.saved', { name: finalName }));
    navigate(`/meal-plan/${toSave.id}`);
  }

  if (!petsReady || (isEditMode && !plansReady)) return <PageFallback />;

  // If the user navigated to /meal-plan/:id/edit with a stale id (plan
  // deleted from another tab, bookmarked link to a missing plan), send
  // them back to the plans landing rather than render an empty wizard.
  if (isEditMode && plansReady && !editingPlan) {
    navigate('/meal-plan', { replace: true });
    return <PageFallback />;
  }

  if (pets.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={t('mealPlan.eyebrow')}
          title={t('mealPlan.new.title')}
          description={t('mealPlan.new.subtitle')}
        />
        <EmptyState
          icon={<Sparkles className="h-8 w-8" />}
          title={t('mealPlan.needPet.title')}
          description={t('mealPlan.needPet.description')}
          action={
            <Button asChild variant="primary">
              <Link to="/pets/new">{t('mealPlan.needPet.cta')}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  // Enter key triggers "Generate" when nothing is previewed yet, otherwise "Save".
  function onFormSubmit(e: FormEvent) {
    e.preventDefault();
    if (preview) save();
    else regenerate();
  }

  return (
    <form onSubmit={onFormSubmit} className="space-y-7">
      <PageHeader
        eyebrow={t('mealPlan.eyebrow')}
        title={isEditMode
          ? t('mealPlan.wizard.editTitle', { defaultValue: 'Edit plan' })
          : t('mealPlan.new.title')}
        description={isEditMode
          ? t('mealPlan.wizard.editSubtitle', {
              defaultValue: 'Tweak anything and save to overwrite — your shopping check marks stay.',
            })
          : t('mealPlan.new.subtitle')}
      />

      {/* Step 1 — Pets */}
      <Card padding="md" className="space-y-3">
        <SectionLabel>{t('mealPlan.wizard.pets')}</SectionLabel>
        <p className="text-xs text-muted-fg">{t('mealPlan.wizard.petsHelp')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {pets.map((pet) => {
            const active = selectedPetIds.includes(pet.id);
            return (
              <button
                key={pet.id}
                type="button"
                onClick={() => togglePet(pet.id)}
                aria-pressed={active}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-2xl border text-left transition-colors',
                  'min-h-[44px]',
                  active
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-surface-2 hover:bg-surface-3',
                )}
              >
                <PetAvatar photo={pet.photo} name={pet.name} species={pet.nutrition.species} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate">{pet.name}</p>
                  <p className="text-[11px] text-muted-fg">
                    {t(`pets.species.${pet.nutrition.species}`)} · {pet.nutrition.weightKg} kg
                  </p>
                </div>
                <span
                  className={cn(
                    'h-5 w-5 shrink-0 rounded-full border flex items-center justify-center',
                    active ? 'border-primary bg-primary text-primary-fg' : 'border-border',
                  )}
                  aria-hidden
                >
                  {active && <Check className="h-3 w-3" />}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Step 2 — Duration */}
      <Card padding="md" className="space-y-3">
        <SectionLabel>{t('mealPlan.wizard.duration')}</SectionLabel>
        <div role="radiogroup" aria-label={t('mealPlan.wizard.duration')} className="grid grid-cols-3 gap-2">
          {DURATIONS.map((d) => {
            const active = duration === d;
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setDuration(d)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-2xl border p-3 sm:p-4 transition-colors',
                  'min-h-[44px]',
                  active
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-surface-2 text-muted-fg hover:text-foreground',
                )}
              >
                <Calendar className="h-5 w-5" aria-hidden />
                <span className="text-sm font-black">{d} {t('mealPlan.wizard.days')}</span>
                <span className="text-[10px] text-muted-fg">{t(`mealPlan.wizard.duration_${d}`)}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Step 3 — Sourcing */}
      <Card padding="md">
        <SourcingPicker
          value={sourcing}
          onChange={handleSourcingChange}
          species={sourcingSpecies}
          durationDays={duration}
          cookAheadStats={cookAheadStats}
          householdHints={householdHints}
        />
      </Card>

      {/* Step 4 — Name */}
      <Card padding="md">
        <Input
          label={t('mealPlan.wizard.nameLabel')}
          placeholder={defaultName(selectedPets, duration, t)}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
      </Card>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={regenerate}
          disabled={selectedPets.length === 0}
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          {preview ? t('mealPlan.wizard.regenerate') : t('mealPlan.wizard.generate')}
        </Button>
        <Button
          type="submit"
          variant="glow"
          size="lg"
          block
          disabled={!preview}
          title={!preview ? t('mealPlan.wizard.generateFirst', { defaultValue: 'Generate a plan first' }) : undefined}
          className="sm:ml-auto sm:w-auto"
        >
          <Save className="h-4 w-4" aria-hidden />
          {t('mealPlan.wizard.save')}
        </Button>
      </div>

      {/* Refusal state — replaces the preview when safety checks block the plan. */}
      {refusals.length > 0 && (
        <Card padding="md" className="space-y-4 border-danger/40 bg-danger/5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-6 w-6 shrink-0 text-danger mt-0.5" aria-hidden />
            <div className="space-y-1">
              <h2 className="text-base font-black text-foreground">
                {t('mealPlan.refusal.title')}
              </h2>
              <p className="text-xs text-muted-fg leading-relaxed">
                {t('mealPlan.refusal.subtitle')}
              </p>
            </div>
          </div>
          <ul className="space-y-2">
            {refusals.map((r, i) => (
              <li
                key={`${r.petId}-${r.rule}-${i}`}
                className="rounded-xl border border-danger/30 bg-surface p-3 space-y-1.5"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-black">{r.petName}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-danger">
                    {t(`mealPlan.refusal.severity.${r.severity}`)}
                  </span>
                </div>
                <p className="text-xs text-foreground leading-snug">
                  {t(`mealPlan.refusal.rule.${r.rule}`, {
                    value: r.value !== undefined ? Math.round(r.value * 100) / 100 : '',
                    threshold: r.threshold !== undefined ? Math.round(r.threshold * 100) / 100 : '',
                  })}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button asChild variant="secondary" size="sm">
                    <Link to={`/pets/${r.petId}/edit`}>{t('mealPlan.refusal.editPet')}</Link>
                  </Button>
                  {r.overrideAvailable && (
                    <span className="text-[10px] text-muted-fg self-center">
                      {t('mealPlan.refusal.vetOverrideHint')}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-4 pt-4 border-t border-border">
          <PageHeader
            eyebrow={t('mealPlan.wizard.previewEyebrow')}
            title={preview.name}
            description={t('mealPlan.wizard.previewSubtitle', { days: preview.durationDays })}
          />
          <NutrientCoverageCard plan={preview} pets={selectedPets} />
          <CalendarGrid plan={preview} pets={selectedPets} />
        </div>
      )}
    </form>
  );
}

function defaultName(
  pets: PetProfile[],
  duration: PlanDuration,
  t: (k: string, vals?: Record<string, unknown>) => string,
): string {
  if (pets.length === 0) return t('mealPlan.wizard.defaultNameEmpty');
  const names = pets.map((p) => p.name).join(' & ');
  return t('mealPlan.wizard.defaultName', { names, days: duration });
}
