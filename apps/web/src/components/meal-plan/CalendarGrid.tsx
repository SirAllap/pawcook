import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { MealPlan, PetProfile } from '@pawcook/shared';
import { Card } from '../ui/card';
import { MealCard } from './MealCard';
import { PetTag } from './PetTag';

export function CalendarGrid({ plan, pets }: { plan: MealPlan; pets: PetProfile[] }) {
  const { t, i18n } = useTranslation();
  const petById = new Map(pets.map((p) => [p.id, p]));

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayIdx = plan.days.findIndex((d) => d.date.slice(0, 10) === todayStr);
  const todayRef = useRef<HTMLDivElement>(null);

  // Drop the reader at today's card when opening a plan already in progress.
  // Guarded to todayIdx > 0 so the wizard preview (which starts today = day 1)
  // doesn't yank the page while the wizard is also scrolling to the preview.
  useEffect(() => {
    if (todayIdx > 0) {
      todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [todayIdx, plan.id]);

  return (
    <div className="space-y-3">
      {plan.days.map((day, dayIdx) => {
        const date = new Date(day.date);
        const weekday = date.toLocaleDateString(i18n.language, { weekday: 'short' });
        const dateShort = date.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });
        const isToday = dayIdx === todayIdx;
        // Highlight today when the plan is in progress; otherwise fall back to
        // highlighting day 1 (covers freshly generated / future-dated plans).
        const highlighted = todayIdx >= 0 ? isToday : dayIdx === 0;

        return (
          <Card
            key={day.date}
            ref={isToday ? todayRef : undefined}
            padding="md"
            variant={highlighted ? 'glow' : 'surface'}
            className="space-y-3 scroll-mt-20"
          >
            <div className="flex items-baseline gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">
                {t('mealPlan.day')} {dayIdx + 1}
              </span>
              <span className="text-xs font-bold text-foreground capitalize">{weekday}</span>
              <span className="text-xs text-muted-fg">{dateShort}</span>
              {isToday && (
                <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary-fg">
                  {t('mealPlan.today', { defaultValue: 'Today' })}
                </span>
              )}
            </div>

            <div className="space-y-4">
              {day.petPlans.map((pp) => {
                const pet = petById.get(pp.petId);
                if (!pet) return null;
                return (
                  <div key={pp.petId} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <PetTag pet={pet} />
                      <span className="text-xs text-muted-fg font-bold tabular-nums">
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
