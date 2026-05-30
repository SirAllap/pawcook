import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import type { MealPlan } from '@pawcook/shared';
import { Card } from '../ui/card';

/**
 * Loud-but-non-blocking notice shown on single-class plans (planFocus
 * !== 'complete'). Per /CLAUDE.md sub-principle #4, we surface the
 * deficit plainly — a meat / fish / veg-only plan is intentionally a
 * partial diet — without ever blocking the owner from cooking one class
 * at a time. Renders nothing for 'complete' plans so existing plans are
 * visually unchanged.
 */
export function PlanFocusNotice({ plan }: { plan: MealPlan }) {
  const { t } = useTranslation();
  const focus = plan.sourcing.planFocus ?? 'complete';
  if (focus === 'complete') return null;

  const className = t(`mealPlan.focusNotice.class.${focus}`, {
    defaultValue: focus === 'meat' ? 'meat' : focus === 'fish' ? 'fish' : 'veggies',
  });

  return (
    <Card padding="md" className="bg-warning/5 border-warning/30">
      <p className="text-[10px] font-black uppercase tracking-wider text-warning mb-1 flex items-center gap-1.5">
        <Info className="h-3 w-3" aria-hidden />
        {t('mealPlan.focusNotice.eyebrow', { defaultValue: 'Single-class plan' })}
      </p>
      <p className="text-sm text-foreground/90 leading-relaxed">
        {t('mealPlan.focusNotice.body', {
          defaultValue:
            'This plan only includes {{class}} — it isn’t a complete diet on its own. Pair it with your other plans and the daily supplement card to cover the gaps. We won’t stop you from cooking one class at a time.',
          class: className,
        })}
      </p>
    </Card>
  );
}
