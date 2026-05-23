import { useTranslation } from 'react-i18next';
import type { PlannedMeal } from '@pawcook/shared';
import { Card } from '../ui/card';
import { useTranslateIngredient } from '../../lib/translate-ingredient';

export function MealCard({ meal }: { meal: PlannedMeal }) {
  const { t, i18n } = useTranslation();
  const translateIngredient = useTranslateIngredient();

  return (
    <Card variant="muted" padding="md" className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-muted-fg">
          {t(`mealPlan.slot.${meal.slot}`, { defaultValue: meal.slot })}
        </p>
        <span className="text-[10px] font-mono font-bold text-muted-fg tabular-nums">
          {meal.kcal.toLocaleString(i18n.language)} kcal
        </span>
      </div>
      <ul className="space-y-1">
        {meal.components.map((c, i) => (
          <li key={i} className="flex items-baseline justify-between gap-2 text-sm">
            <span className="text-foreground truncate">
              {translateIngredient(c.ingredientId)}
            </span>
            <span className="text-xs font-mono font-bold text-muted-fg tabular-nums shrink-0">
              {c.grams.toLocaleString(i18n.language)} g
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
