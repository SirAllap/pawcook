import { useTranslation } from 'react-i18next';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import type { MealPlan, PetProfile } from '@pawcook/shared';
import { nutrientCoverage } from '@pawcook/shared';
import { Card } from '../ui/card';
import { PetTag } from './PetTag';

export function NutrientCoverageCard({
  plan, pets,
}: {
  plan: MealPlan;
  pets: PetProfile[];
}) {
  const { t } = useTranslation();
  const findings = nutrientCoverage(plan);
  const petById = new Map(pets.map((p) => [p.id, p]));

  if (findings.length === 0) {
    return (
      <Card padding="md" className="bg-success/5 border-success/30">
        <p className="text-[10px] font-black uppercase tracking-wider text-success mb-1 flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3" />
          {t('mealPlan.coverage.passed')}
        </p>
        <p className="text-sm text-foreground/90 leading-relaxed">
          {t('mealPlan.coverage.passedHelp')}
        </p>
      </Card>
    );
  }

  return (
    <Card padding="md" className="bg-warning/5 border-warning/30">
      <p className="text-[10px] font-black uppercase tracking-wider text-warning mb-2 flex items-center gap-1.5">
        <AlertTriangle className="h-3 w-3" />
        {t('mealPlan.coverage.flagged')}
      </p>
      <ul className="space-y-2">
        {findings.slice(0, 8).map((f, i) => {
          const pet = f.petId ? petById.get(f.petId) : undefined;
          return (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground/90 leading-relaxed">
              <span className="text-warning font-black shrink-0">!</span>
              <span className="flex-1">
                {pet && <PetTag pet={pet} className="mr-1 mb-0.5" />}
                {t(f.id, { defaultValue: f.id, ...(f.values ?? {}) })}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
