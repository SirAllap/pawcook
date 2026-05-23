import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft, ShoppingBag, CalendarDays, Info, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { CalendarGrid } from '../../components/meal-plan/CalendarGrid';
import { NutrientCoverageCard } from '../../components/meal-plan/NutrientCoverageCard';
import { PetTag } from '../../components/meal-plan/PetTag';
import { ShoppingListView } from './ShoppingListView';
import { useMealPlans } from '../../contexts/MealPlansContext';
import { usePets } from '../../contexts/PetProfilesContext';

export default function PlanView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getPlan, removePlan, ready: plansReady } = useMealPlans();
  const { pets, ready: petsReady } = usePets();
  const [tab, setTab] = useState('meals');

  if (!plansReady || !petsReady) return null;
  const plan = id ? getPlan(id) : undefined;
  if (!plan) return <Navigate to="/meal-plan" replace />;

  const planPets = pets.filter((p) => plan.petIds.includes(p.id));

  function onDelete() {
    if (!plan) return;
    if (!confirm(t('mealPlan.confirmDelete', { name: plan.name }))) return;
    removePlan(plan.id);
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
        className="inline-flex items-center gap-1 text-xs font-bold text-muted-fg hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        {t('mealPlan.view.back')}
      </button>

      <PageHeader
        eyebrow={t('mealPlan.eyebrow')}
        title={plan.name}
        description={t('mealPlan.view.subtitle', { days: plan.durationDays, startDate })}
        actions={
          <Button type="button" variant="ghost" onClick={onDelete} className="text-danger">
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('mealPlan.view.delete')}</span>
          </Button>
        }
      />

      {planPets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {planPets.map((p) => (
            <Link key={p.id} to={`/pets/${p.id}`}>
              <PetTag pet={p} className="hover:bg-primary/20 cursor-pointer" />
            </Link>
          ))}
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="meals">
            <CalendarDays className="h-4 w-4" />
            {t('mealPlan.view.tabMeals')}
          </TabsTrigger>
          <TabsTrigger value="shopping">
            <ShoppingBag className="h-4 w-4" />
            {t('mealPlan.view.tabShopping')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meals" className="space-y-4">
          <NutrientCoverageCard plan={plan} pets={planPets} />
          <CalendarGrid plan={plan} pets={planPets} />
        </TabsContent>

        <TabsContent value="shopping" className="space-y-4">
          <ShoppingListView plan={plan} pets={planPets} />
        </TabsContent>
      </Tabs>

      <Card padding="md" className="bg-info/5 border-info/30">
        <p className="text-[10px] font-black uppercase tracking-wider text-info mb-1 flex items-center gap-1.5">
          <Info className="h-3 w-3" />
          {t('common.disclaimer')}
        </p>
      </Card>
    </div>
  );
}
