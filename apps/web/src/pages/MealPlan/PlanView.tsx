import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft, ShoppingBag, CalendarDays, ChefHat, Info, Trash2, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
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
      <button
        type="button"
        onClick={() => navigate('/meal-plan')}
        className="inline-flex items-center gap-1 text-xs font-bold text-muted-fg hover:text-foreground transition-colors min-h-[44px] pr-2"
      >
        <ArrowLeft className="h-3 w-3" aria-hidden />
        {t('mealPlan.view.back')}
      </button>

      <PageHeader
        eyebrow={t('mealPlan.eyebrow')}
        title={plan.name}
        description={t('mealPlan.view.subtitle', { days: plan.durationDays, startDate })}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            className="text-danger border-danger/30 hover:bg-danger/5 self-start"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {t('mealPlan.view.delete')}
          </Button>
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
          <SupplementCard plan={plan} pets={planPets} />
          <NutrientCoverageCard plan={plan} pets={planPets} />
          <CalendarGrid plan={plan} pets={planPets} />
        </TabsContent>

        {/* forceMount keeps the shopping list mounted so its checkmarks don't
            reset when the user toggles tabs. */}
        <TabsContent value="shopping" forceMount className="space-y-4 data-[state=inactive]:hidden">
          <ShoppingListView plan={plan} pets={planPets} />
        </TabsContent>

        {plan.cookingPlan && (
          <TabsContent value="cooking" className="space-y-4">
            <CookingPlanView plan={plan} pets={planPets} />
          </TabsContent>
        )}
      </Tabs>

      <Card padding="md" className="bg-info/5 border-info/30 mt-8 sm:mt-10">
        <p className="text-[10px] font-black uppercase tracking-wider text-info mb-2 flex items-center gap-1.5">
          <Info className="h-3 w-3" aria-hidden />
          {t('common.disclaimerLabel', { defaultValue: 'Note' })}
        </p>
        <p className="text-sm text-foreground/90 leading-relaxed">
          {t('common.disclaimer')}
        </p>
      </Card>

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
