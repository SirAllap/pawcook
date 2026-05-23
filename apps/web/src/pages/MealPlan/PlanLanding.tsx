import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, ClipboardList, Calendar, ChevronRight } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/empty-state';
import { Badge } from '../../components/ui/badge';
import { useMealPlans } from '../../contexts/MealPlansContext';
import { usePets } from '../../contexts/PetProfilesContext';
import { PetTag } from '../../components/meal-plan/PetTag';

export default function PlanLanding() {
  const { t, i18n } = useTranslation();
  const { plans, ready: plansReady } = useMealPlans();
  const { pets, ready: petsReady } = usePets();

  if (!plansReady || !petsReady) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('mealPlan.eyebrow')}
        title={t('mealPlan.landing.title')}
        description={t('mealPlan.landing.subtitle')}
        actions={
          <Link to="/meal-plan/new">
            <Button variant="primary" size="md">
              <Plus className="h-4 w-4" />
              {t('mealPlan.landing.create')}
            </Button>
          </Link>
        }
      />

      {plans.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title={t('mealPlan.landing.emptyTitle')}
          description={t('mealPlan.landing.emptyDescription')}
        />
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const planPets = pets.filter((p) => plan.petIds.includes(p.id));
            const startDate = new Date(plan.startDate).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' });
            return (
              <Link key={plan.id} to={`/meal-plan/${plan.id}`} className="block group">
                <Card padding="md" className="flex items-center gap-4 hover:bg-surface-2 transition-colors">
                  <div className="h-12 w-12 shrink-0 rounded-2xl bg-primary/10 text-primary border border-primary/30 flex items-center justify-center">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black truncate">{plan.name}</h3>
                      <Badge variant="primary" className="text-[10px]">
                        {plan.durationDays} {t('mealPlan.wizard.days')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-fg mt-0.5">{startDate}</p>
                    {planPets.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {planPets.map((p) => <PetTag key={p.id} pet={p} />)}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-fg shrink-0 transition-transform group-hover:translate-x-0.5" />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
