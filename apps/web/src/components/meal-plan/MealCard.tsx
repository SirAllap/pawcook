import { useTranslation } from 'react-i18next';
import { getIngredient, type PlannedMeal } from '@pawcook/shared';
import { Card } from '../ui/card';

export function MealCard({ meal }: { meal: PlannedMeal }) {
  const { t } = useTranslation();

  return (
    <Card variant="muted" padding="md" className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-muted-fg">
          {t(`mealPlan.slot.${meal.slot}`, { defaultValue: meal.slot })}
        </p>
        <span className="text-[10px] font-mono font-bold text-muted-fg tabular-nums">{meal.kcal} kcal</span>
      </div>
      <ul className="space-y-1">
        {meal.components.map((c, i) => {
          const ingredient = getIngredient(c.ingredientId);
          return (
            <li key={i} className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-foreground truncate">
                {ingredient?.label ?? c.ingredientId}
              </span>
              <span className="text-xs font-mono font-bold text-muted-fg tabular-nums shrink-0">
                {c.grams} g
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
