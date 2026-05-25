import { Link, useNavigate, useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { Pencil, ArrowLeft, AlertTriangle, Info, ClipboardList, ChevronRight, Plus } from 'lucide-react';
import { AccentTile } from '../../components/ui/accent-tile';
import { calculateNutrition, recommendForPet } from '@pawcook/shared';
import { PageHeader } from '../../components/ui/page-header';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { PageFallback } from '../../components/ui/page-fallback';
import { StatTile } from '../../components/calculators/stat-tile';
import { PetAvatar } from '../../components/pets/PetAvatar';
import { usePets } from '../../contexts/PetProfilesContext';
import { useMealPlans } from '../../contexts/MealPlansContext';

export default function PetDetail() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getPet, ready } = usePets();

  const pet = id ? getPet(id) : undefined;
  const nutrition = useMemo(() => (pet ? calculateNutrition(pet.nutrition) : null), [pet]);
  const findings = useMemo(() => (pet ? recommendForPet(pet) : []), [pet]);
  const { plans, ready: plansReady } = useMealPlans();
  const petPlans = useMemo(
    () => (pet ? plans.filter((p) => p.petIds.includes(pet.id)) : []),
    [plans, pet],
  );

  if (!ready || !plansReady) return <PageFallback />;
  if (!pet || !nutrition) return <Navigate to="/pets" replace />;

  const speciesLabel = pet.nutrition.species === 'cat' ? t('pets.species.cat') : t('pets.species.dog');
  const aafcoVariant = nutrition.aafcoStatus === 'pass' ? 'success' : nutrition.aafcoStatus === 'caution' ? 'warning' : 'danger';
  const lang = i18n.language;
  const fmtRange = (r: { min: number; max: number }) =>
    `${r.min.toLocaleString(lang)}–${r.max.toLocaleString(lang)}`;

  return (
    <div className="space-y-6">
      {/* Breadcrumb pill — see PlanView for the design rationale. */}
      <button
        type="button"
        onClick={() => navigate('/pets')}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 backdrop-blur-sm px-3 py-1.5 text-[11px] font-bold text-muted-fg hover:text-foreground hover:bg-surface-2 transition-colors min-h-[36px]"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        {t('pets.detail.back')}
      </button>

      <PageHeader
        eyebrow={speciesLabel}
        title={pet.name}
        description={t('pets.detail.subtitle', {
          age: t(`pets.age.${pet.nutrition.age}`),
          weight: pet.nutrition.weightKg,
        })}
        actions={
          <Button asChild variant="secondary" size="md">
            <Link to={`/pets/${pet.id}/edit`}>
              <Pencil className="h-4 w-4" aria-hidden />
              {t('pets.detail.edit')}
            </Link>
          </Button>
        }
      />

      <Card padding="md" className="flex items-center gap-4">
        <PetAvatar photo={pet.photo} name={pet.name} species={pet.nutrition.species} size="lg" />
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-black tracking-tight">{pet.name}</h2>
          <p className="text-xs text-muted-fg mt-1">
            {t(`nutrition.dietShort.${pet.nutrition.macroProfile}`)}
            {' · '}
            {t(`pets.activity.${pet.nutrition.activityLevel}`)}
            {' · '}
            {t(`pets.bodyCondition.${pet.nutrition.bodyCondition}`)}
          </p>
          {pet.allergies.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {pet.allergies.slice(0, 4).map((a) => (
                <Badge key={a} variant="danger" className="text-[10px]">{a}</Badge>
              ))}
              {pet.allergies.length > 4 && (
                <Badge variant="neutral" className="text-[10px]">+{pet.allergies.length - 4}</Badge>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card padding="none" variant="elevated" className="overflow-hidden">
        <header className="flex items-start justify-between gap-3 p-5 border-b border-border">
          <div>
            <h3 className="font-black text-base tracking-tight">{t('pets.detail.dailyPlan')}</h3>
            <p className="text-xs text-muted-fg mt-1">
              {t(`nutrition.dietShort.${nutrition.dietProfile}`)}
            </p>
          </div>
          <Badge variant={aafcoVariant} className="text-[10px]">
            {t(`nutrition.aafco.${nutrition.aafcoStatus}`)}
          </Badge>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5">
          <StatTile label={t('nutrition.dailyFood')} value={fmtRange(nutrition.dailyFoodGrams)} unit="g" tone="primary" delay={0.0} />
          <StatTile label={t('nutrition.perMeal')}   value={fmtRange(nutrition.perMealGrams)}   unit="g" tone="primary" delay={0.05} />
          <StatTile label={t('nutrition.result.derEnergy')} value={nutrition.derKcal.toLocaleString(lang)} unit="kcal" tone="warning" delay={0.10} />
          <StatTile label={t('nutrition.calciumNeeded')} value={nutrition.calciumMg.toLocaleString(lang)} unit="mg" tone="info" delay={0.15} />
        </div>
      </Card>

      {findings.length > 0 && (
        <Card padding="md" className="bg-warning/5 border-warning/30">
          <p className="text-[10px] font-black uppercase tracking-wider text-warning mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" aria-hidden />
            {t('pets.detail.findings')}
          </p>
          <ul className="space-y-1.5">
            {findings.slice(0, 6).map((f, i) => (
              <li key={i} className="text-sm text-foreground/90 flex gap-2 items-start leading-relaxed">
                <span className="text-warning font-black shrink-0" aria-hidden>!</span>
                {t(f.id, { defaultValue: f.id, ...(f.values ?? {}) })}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card padding="none" className="overflow-hidden">
        <header className="flex items-center justify-between gap-3 p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" aria-hidden />
            <h3 className="font-black text-sm tracking-tight">{t('pets.detail.plansTitle')}</h3>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/meal-plan/new">
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {t('pets.detail.newPlan')}
            </Link>
          </Button>
        </header>
        {petPlans.length === 0 ? (
          <p className="p-5 text-sm text-muted-fg">
            {t('pets.detail.noPlans')}
          </p>
        ) : (
          <ul className="divide-y divide-border/50">
            {petPlans.map((plan) => (
              <li key={plan.id}>
                <Link
                  to={`/meal-plan/${plan.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-surface-2 transition-colors group"
                >
                  <AccentTile Icon={ClipboardList} accent="primary" size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{plan.name}</p>
                    <p className="text-[11px] text-muted-fg mt-0.5">
                      {plan.durationDays} {t('mealPlan.wizard.days')}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-fg shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card padding="md" className="bg-info/5 border-info/30">
        <p className="text-[10px] font-black uppercase tracking-wider text-info mb-2 flex items-center gap-1.5">
          <Info className="h-3 w-3" aria-hidden />
          {t('common.disclaimerLabel', { defaultValue: 'Note' })}
        </p>
        <p className="text-sm text-foreground/90 leading-relaxed">
          {t('common.disclaimer')}
        </p>
      </Card>
    </div>
  );
}
