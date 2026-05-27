import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Plus, ClipboardList, Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { PageHeader } from '../../components/ui/page-header';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/empty-state';
import { AccentTile } from '../../components/ui/accent-tile';
import { Badge } from '../../components/ui/badge';
import { PageFallback } from '../../components/ui/page-fallback';
import { FadeIn } from '../../components/motion/fade-in';
import { useMealPlans } from '../../contexts/MealPlansContext';
import { usePets } from '../../contexts/PetProfilesContext';
import { PetTag } from '../../components/meal-plan/PetTag';

export default function PlanLanding() {
  const { t, i18n } = useTranslation();
  const { plans, ready: plansReady } = useMealPlans();
  const { pets, ready: petsReady } = usePets();

  if (!plansReady || !petsReady) return <PageFallback />;

  // No-pets-yet branch: the regular "Create plan" CTA leads to a dead end
  // (the wizard immediately shows another empty state). Route new users
  // through the starter picker instead — one click to a working household.
  const noPetsYet = pets.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('mealPlan.eyebrow')}
        title={t('mealPlan.landing.title')}
        description={t('mealPlan.landing.subtitle')}
        glow="primary"
        actions={
          <Button asChild variant="primary" size="md">
            <Link to="/meal-plan/new">
              <Plus className="h-4 w-4" aria-hidden />
              {t('mealPlan.landing.create')}
            </Link>
          </Button>
        }
      />

      {plans.length === 0 ? (
        <FadeIn>
          <EmptyState
            icon={<ClipboardList className="h-8 w-8" />}
            title={noPetsYet ? t('mealPlan.landing.emptyNoPetsTitle') : t('mealPlan.landing.emptyTitle')}
            description={noPetsYet ? t('mealPlan.landing.emptyNoPetsDescription') : t('mealPlan.landing.emptyDescription')}
            action={
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-center">
                <Button asChild variant="primary" size="md">
                  <Link to="/meal-plan/start">
                    <Sparkles className="h-4 w-4" aria-hidden />
                    {t('onboarding.cta.useTemplate')}
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="md">
                  <Link to={noPetsYet ? '/pets/new' : '/meal-plan/new'}>
                    <Plus className="h-4 w-4" aria-hidden />
                    {noPetsYet ? t('pets.list.addPet') : t('mealPlan.landing.create')}
                  </Link>
                </Button>
              </div>
            }
          />
        </FadeIn>
      ) : (
        <FadeIn className="space-y-3">
          {plans.map((plan, i) => {
            const planPets = pets.filter((p) => plan.petIds.includes(p.id));
            const startDate = new Date(plan.startDate).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' });
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              >
                <Link to={`/meal-plan/${plan.id}`} className="block group">
                  <Card padding="md" className="flex items-center gap-4 hover:bg-surface-2 transition-colors">
                    <AccentTile Icon={Calendar} accent="primary" size="lg" />
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
                    <ChevronRight className="h-4 w-4 text-muted-fg shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </FadeIn>
      )}
    </div>
  );
}
