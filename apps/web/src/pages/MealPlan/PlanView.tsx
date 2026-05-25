import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft, ShoppingBag, CalendarDays, ChefHat, Trash2, Pencil, AlertTriangle, Check, X } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { FadeIn } from '../../components/motion/fade-in';
import { Callout } from '../../components/ui/callout';
import { Sheet } from '../../components/ui/sheet';
import { PageFallback } from '../../components/ui/page-fallback';
import { CalendarGrid } from '../../components/meal-plan/CalendarGrid';
import { NutrientCoverageCard } from '../../components/meal-plan/NutrientCoverageCard';
import { SupplementCard } from '../../components/meal-plan/SupplementCard';
import { PetTag } from '../../components/meal-plan/PetTag';
import { ShoppingListView } from './ShoppingListView';
import { CookingPlanView } from './CookingPlanView';
import { useMealPlans } from '../../contexts/MealPlansContext';
import { usePets } from '../../contexts/PetProfilesContext';

export default function PlanView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getPlan, removePlan, ready: plansReady } = useMealPlans();
  const { pets, ready: petsReady } = usePets();
  const [tab, setTab] = useState('meals');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!plansReady || !petsReady) return <PageFallback />;
  const plan = id ? getPlan(id) : undefined;
  if (!plan) return <Navigate to="/meal-plan" replace />;

  const planPets = pets.filter((p) => plan.petIds.includes(p.id));

  function doDelete() {
    if (!plan) return;
    removePlan(plan.id);
    setConfirmDelete(false);
    toast.success(t('mealPlan.toast.deleted', { name: plan.name }));
    navigate('/meal-plan');
  }

  const startDate = new Date(plan.startDate).toLocaleDateString(i18n.language, {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb pill — matches the landing's species-chip styling
         (rounded-full + border + tinted bg) so the back-button reads as
         a deliberate wayfinding element rather than 2022 admin-panel
         minimalism. */}
      <button
        type="button"
        onClick={() => navigate('/meal-plan')}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 backdrop-blur-sm px-3 py-1.5 text-[11px] font-bold text-muted-fg hover:text-foreground hover:bg-surface-2 transition-colors min-h-[36px]"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        {t('mealPlan.view.back')}
      </button>

      <PageHeader
        eyebrow={t('mealPlan.eyebrow')}
        title={<RenamablePlanTitle plan={plan} />}
        description={t('mealPlan.view.subtitle', { days: plan.durationDays, startDate })}
        actions={
          <div className="flex flex-wrap gap-2 self-start">
            <Button
              asChild
              type="button"
              variant="outline"
              size="sm"
            >
              <Link to={`/meal-plan/${plan.id}/edit`}>
                <Pencil className="h-4 w-4" aria-hidden />
                {t('mealPlan.view.edit', { defaultValue: 'Edit' })}
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="text-danger border-danger/30 hover:bg-danger/5"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {t('mealPlan.view.delete')}
            </Button>
          </div>
        }
      />

      {planPets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {planPets.map((p) => (
            <Link
              key={p.id}
              to={`/pets/${p.id}`}
              className="inline-flex rounded-full focus-visible:outline-none"
            >
              <PetTag pet={p} className="hover:bg-primary/20 cursor-pointer" />
            </Link>
          ))}
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="space-y-5">
        <TabsList>
          <TabsTrigger
            value="meals"
            aria-label={t('mealPlan.view.tabMeals')}
          >
            <CalendarDays className="h-4 w-4" aria-hidden />
            {t('mealPlan.view.tabMeals')}
          </TabsTrigger>
          <TabsTrigger
            value="shopping"
            aria-label={t('mealPlan.view.tabShopping')}
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            {t('mealPlan.view.tabShopping')}
          </TabsTrigger>
          {plan.cookingPlan && (
            <TabsTrigger
              value="cooking"
              aria-label={t('mealPlan.view.tabCooking', { defaultValue: 'Cooking plan' })}
            >
              <ChefHat className="h-4 w-4" aria-hidden />
              {t('mealPlan.view.tabCooking', { defaultValue: 'Cooking plan' })}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="meals" className="space-y-4">
          <FadeIn className="space-y-4">
            <SupplementCard plan={plan} pets={planPets} />
            <NutrientCoverageCard plan={plan} pets={planPets} />
            <CalendarGrid plan={plan} pets={planPets} />
          </FadeIn>
        </TabsContent>

        {/* forceMount keeps the shopping list mounted so its checkmarks don't
            reset when the user toggles tabs. */}
        <TabsContent value="shopping" forceMount className="space-y-4 data-[state=inactive]:hidden">
          <FadeIn className="space-y-4">
            <ShoppingListView plan={plan} pets={planPets} />
          </FadeIn>
        </TabsContent>

        {plan.cookingPlan && (
          <TabsContent value="cooking" className="space-y-4">
            <FadeIn className="space-y-4">
              <CookingPlanView plan={plan} pets={planPets} />
            </FadeIn>
          </TabsContent>
        )}
      </Tabs>

      <Callout
        tone="info"
        eyebrow={t('common.disclaimerLabel', { defaultValue: 'Note' })}
        className="mt-8 sm:mt-10"
      >
        {t('common.disclaimer')}
      </Callout>

      <Sheet
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={
          <span className="inline-flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-danger" aria-hidden />
            {t('mealPlan.confirmDelete', { name: plan.name })}
          </span>
        }
        description={t('mealPlan.confirmDeleteHelp', {
          defaultValue:
            "Deleting a plan can't be undone. Your saved pet profiles will not be affected.",
        })}
      >
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={() => setConfirmDelete(false)} block>
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button type="button" variant="destructive" onClick={doDelete} block>
            <Trash2 className="h-4 w-4" aria-hidden />
            {t('mealPlan.view.delete')}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

/**
 * Click-to-edit plan title. Reads from + writes to MealPlansContext via
 * updatePlan({ name }). No regeneration — just renames. Enter saves,
 * Escape cancels, blur saves. Empty-string saves are rejected (revert
 * to the current name).
 */
function RenamablePlanTitle({ plan }: { plan: import('@pawcook/shared').MealPlan }) {
  const { t } = useTranslation();
  const { updatePlan } = useMealPlans();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(plan.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(plan.name); }, [plan.name]);
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === plan.name) {
      setDraft(plan.name);
      return;
    }
    updatePlan(plan.id, { name: next });
    toast.success(t('mealPlan.toast.updated', { defaultValue: '{{name}} updated.', name: next }));
  }

  function cancel() {
    setDraft(plan.name);
    setEditing(false);
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1.5 w-full">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            if (e.key === 'Escape') { e.preventDefault(); cancel(); }
          }}
          maxLength={64}
          aria-label={t('mealPlan.view.renameAria', { defaultValue: 'Rename plan' })}
          className="flex-1 min-w-0 bg-transparent border-b border-primary outline-none text-2xl sm:text-3xl font-black tracking-tight text-balance"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={commit}
          aria-label={t('common.confirm', { defaultValue: 'Confirm' })}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary hover:bg-primary/10"
        >
          <Check className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={cancel}
          aria-label={t('common.cancel', { defaultValue: 'Cancel' })}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-fg hover:bg-surface-2"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title={t('mealPlan.view.renameAria', { defaultValue: 'Rename plan' })}
      className="group inline-flex items-baseline gap-2 max-w-full text-left hover:opacity-90 transition-opacity"
    >
      <span className="truncate">{plan.name}</span>
      <Pencil
        className="h-4 w-4 shrink-0 text-muted-fg opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
        aria-hidden
      />
    </button>
  );
}
