import { useTranslation } from 'react-i18next';
import type { MealPlan, PetProfile } from '@pawcook/shared';
import { Card } from '../ui/card';
import { MealCard } from './MealCard';
import { PetTag } from './PetTag';

export function CalendarGrid({ plan, pets }: { plan: MealPlan; pets: PetProfile[] }) {
  const { t, i18n } = useTranslation();
  const petById = new Map(pets.map((p) => [p.id, p]));

  return (
    <div className="space-y-3">
      {plan.days.map((day, dayIdx) => {
        const date = new Date(day.date);
        const weekday = date.toLocaleDateString(i18n.language, { weekday: 'short' });
        const dateShort = date.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });

        return (
          <Card key={day.date} padding="md" variant={dayIdx === 0 ? 'glow' : 'surface'} className="space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">
                {t('mealPlan.day')} {dayIdx + 1}
              </span>
              <span className="text-xs font-bold text-foreground capitalize">{weekday}</span>
              <span className="text-xs text-muted-fg">{dateShort}</span>
            </div>

            <div className="space-y-4">
              {day.petPlans.map((pp) => {
                const pet = petById.get(pp.petId);
                if (!pet) return null;
                return (
                  <div key={pp.petId} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <PetTag pet={pet} />
                      <span className="text-[10px] text-muted-fg font-bold tabular-nums">
                        {pp.totalGrams} g · {pp.totalKcal} kcal
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {pp.meals.map((meal, mi) => (
                        <MealCard key={mi} meal={meal} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
