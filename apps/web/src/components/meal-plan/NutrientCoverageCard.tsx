import { useTranslation } from 'react-i18next';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import type { MealPlan, PetProfile } from '@pawcook/shared';
import { nutrientCoverage } from '@pawcook/shared';
import { Card } from '../ui/card';
import { PetTag } from './PetTag';
import { dismissedSupplementCoveredWarnings } from './SupplementCard';

export function NutrientCoverageCard({
  plan, pets,
}: {
  plan: MealPlan;
  pets: PetProfile[];
}) {
  const { t } = useTranslation();
  const rawFindings = nutrientCoverage(plan);
  const petById = new Map(pets.map((p) => [p.id, p]));

  // Hide warnings that the SupplementCard has explicitly covered. Stops
  // the user from seeing "low taurine" forever after they've already
  // committed to the supplement workflow. The bare id matches both the
  // raw warning id and the i18n-key form.
  const dismissed = dismissedSupplementCoveredWarnings(plan.id);
  const findings = dismissed.size === 0
    ? rawFindings
    : rawFindings.filter((f) => {
        const bare = f.id.replace(/^nutrition\.warnings\./, '');
        return !dismissed.has(f.id) && !dismissed.has(bare);
      });

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
              <span className="text-warning font-black shrink-0" aria-hidden="true">!</span>
              <span className="flex-1">
                {pet && <PetTag pet={pet} className="mr-1 mb-0.5" />}
                {/* Never print a raw key: fall back to a humanized version of
                    the finding id if a locale is missing the string. */}
                {t(f.id, { defaultValue: humanizeFindingId(f.id), ...(f.values ?? {}) })}
              </span>
            </li>
          );
        })}
      </ul>
      {findings.length > 8 && (
        <p className="mt-2 text-xs text-muted-fg">
          {t('mealPlan.coverage.more', {
            defaultValue: '+{{n}} more — edit the plan to resolve.',
            n: findings.length - 8,
          })}
        </p>
      )}
    </Card>
  );
}

// Last-resort label when a warning id has no translation in the active
// locale — turns "nutrition.warnings.lowTaurine" into "Low taurine".
function humanizeFindingId(id: string): string {
  const base = id.replace(/^nutrition\.warnings\./, '');
  const words = base.replace(/([A-Z])/g, ' $1').replace(/[._]+/g, ' ').trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
