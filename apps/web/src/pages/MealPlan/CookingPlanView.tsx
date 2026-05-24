import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChefHat, Printer, Snowflake, CalendarPlus, Info, Sparkles } from 'lucide-react';
import {
  buildThawCalendar,
  type CookingBatch,
  type MealPlan,
  type PetProfile,
} from '@pawcook/shared';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/ui/empty-state';
import { PetTag } from '../../components/meal-plan/PetTag';
import { BagLabelSheet } from '../../components/meal-plan/BagLabelSheet';
import { useTranslateIngredient } from '../../lib/translate-ingredient';

export function CookingPlanView({ plan, pets }: { plan: MealPlan; pets: PetProfile[] }) {
  const { t, i18n } = useTranslation();
  const translateIngredient = useTranslateIngredient();
  const [labelTarget, setLabelTarget] = useState<CookingBatch[] | null>(null);

  // Group batches by ingredient — keeps cook sessions together since the
  // user does one protein at a time at the sous-vide bath.
  const groups = useMemo(() => {
    if (!plan.cookingPlan) return [];
    const map = new Map<string, CookingBatch[]>();
    for (const batch of plan.cookingPlan.batches) {
      const list = map.get(batch.ingredientId) ?? [];
      list.push(batch);
      map.set(batch.ingredientId, list);
    }
    return Array.from(map.entries()).map(([ingredientId, batches]) => ({
      ingredientId,
      batches: batches.sort((a, b) => a.sequence - b.sequence),
      totalGrams: batches.reduce((s, b) => s + b.totalGrams, 0),
      hasGap: batches.some((b) => b.rotationGap),
    }));
  }, [plan]);

  if (!plan.cookingPlan) {
    return (
      <EmptyState
        icon={<ChefHat className="h-8 w-8" />}
        title={t('mealPlan.cookingPlan.emptyTitle', {
          defaultValue: 'Cooking plan only for sous-vide',
        })}
        description={t('mealPlan.cookingPlan.emptyHelp', {
          defaultValue:
            'Bags are generated when the plan uses sous-vide. Regenerate with sous-vide as the cooking method to see the bag schedule.',
        })}
      />
    );
  }

  if (groups.length === 0 && plan.cookingPlan.cookFresh.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="h-8 w-8" />}
        title={t('mealPlan.cookingPlan.noBagsTitle', { defaultValue: 'Nothing to bag' })}
        description={t('mealPlan.cookingPlan.noBagsHelp', {
          defaultValue:
            'This plan has no batchable ingredients — everything will be cooked fresh.',
        })}
      />
    );
  }

  function fmtDate(iso: string): string {
    return new Date(iso + 'T00:00:00Z').toLocaleDateString(i18n.language, {
      day: 'numeric',
      month: 'short',
    });
  }

  // Comma-list discrete dates; collapse 3+ consecutive to "X – Y".
  function fmtDates(dates: string[]): string {
    if (dates.length === 0) return '';
    if (dates.length === 1) return fmtDate(dates[0]!);
    const sorted = [...dates].sort();
    const first = sorted[0]!;
    const last = sorted[sorted.length - 1]!;
    const span = (new Date(last + 'T00:00:00Z').getTime() - new Date(first + 'T00:00:00Z').getTime()) / 86_400_000;
    const consecutive = span === sorted.length - 1;
    if (consecutive && sorted.length >= 3) return `${fmtDate(first)} – ${fmtDate(last)}`;
    return sorted.map(fmtDate).join(', ');
  }

  function downloadIcs() {
    const ics = buildThawCalendar(plan);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.name.replace(/[^A-Za-z0-9-]+/g, '-')}-thaw.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (labelTarget) {
    return (
      <BagLabelSheet
        plan={plan}
        pets={pets}
        batches={labelTarget}
        onClose={() => setLabelTarget(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card padding="md" className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-fg">
            {t('mealPlan.cookingPlan.summaryLabel', { defaultValue: 'Cooking plan' })}
          </p>
          <p className="text-sm font-bold text-foreground mt-0.5">
            {t('mealPlan.cookingPlan.summary', {
              defaultValue:
                '{{bags}} bags · {{days}} days per bag · one protein per bag',
              bags: plan.cookingPlan.batches.length,
              days: plan.cookingPlan.bagDays,
            })}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={downloadIcs}>
          <CalendarPlus className="h-4 w-4" aria-hidden />
          {t('mealPlan.cookingPlan.thawIcs', { defaultValue: 'Thaw schedule (.ics)' })}
        </Button>
      </Card>

      {groups.map((group) => {
        const label = translateIngredient(group.ingredientId);
        return (
          <Card key={group.ingredientId} padding="none" className="overflow-hidden">
            <header className="flex items-center justify-between gap-3 p-4 border-b border-border bg-surface-2">
              <div className="min-w-0">
                <p className="text-sm font-black text-foreground truncate">{label}</p>
                <p className="text-[11px] text-muted-fg mt-0.5">
                  {t('mealPlan.cookingPlan.groupSummary', {
                    defaultValue: '{{bags}} bags · {{grams}} g total',
                    bags: group.batches.length,
                    grams: group.totalGrams,
                  })}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLabelTarget(group.batches)}
              >
                <Printer className="h-4 w-4" aria-hidden />
                {t('mealPlan.cookingPlan.printLabels', { defaultValue: 'Print labels' })}
              </Button>
            </header>
            {group.hasGap && (
              <p className="px-4 py-2 text-[11px] text-muted-fg bg-info/5 border-b border-border/50 flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 shrink-0 text-info" aria-hidden />
                {t('mealPlan.cookingPlan.rotationNote', {
                  defaultValue: 'Protein rotates — bag dates may be non-consecutive.',
                })}
              </p>
            )}
            <ul className="divide-y divide-border/50">
              {group.batches.map((batch) => {
                const itemPets = pets.filter((p) => batch.forPetIds.includes(p.id));
                return (
                  <li key={batch.id} className="p-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-foreground">
                        {t('mealPlan.cookingPlan.bagN', {
                          defaultValue: 'Bag {{n}} of {{total}}',
                          n: batch.sequence,
                          total: batch.totalInSequence,
                        })}
                      </p>
                      <span className="text-sm font-mono font-bold tabular-nums text-foreground">
                        {batch.totalGrams} g
                      </span>
                    </div>
                    <p className="text-xs text-muted-fg">
                      {fmtDates(batch.dates)}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <Badge variant="neutral" className="gap-1">
                        <Snowflake className="h-3 w-3" aria-hidden />
                        {t('mealPlan.cookingPlan.thaw', {
                          defaultValue: 'Thaw {{date}}',
                          date: fmtDate(batch.thawDate),
                        })}
                      </Badge>
                      <Badge variant="neutral">
                        {t('mealPlan.cookingPlan.useBy', {
                          defaultValue: 'Use by {{date}}',
                          date: fmtDate(batch.useByDate),
                        })}
                      </Badge>
                      {itemPets.map((p) => <PetTag key={p.id} pet={p} />)}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}

      {plan.cookingPlan.cookFresh.length > 0 && (
        <Card padding="none" className="overflow-hidden">
          <header className="p-4 border-b border-border bg-surface-2">
            <p className="text-sm font-black text-foreground">
              {t('mealPlan.cookingPlan.freshLabel', { defaultValue: 'Cook fresh (not batched)' })}
            </p>
            <p className="text-[11px] text-muted-fg mt-0.5">
              {t('mealPlan.cookingPlan.freshHelp', {
                defaultValue:
                  'These don’t freeze well batched. Handle daily or per recipe.',
              })}
            </p>
          </header>
          <ul className="divide-y divide-border/50">
            {plan.cookingPlan.cookFresh.map((c) => (
              <li key={c.ingredientId} className="p-3 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-foreground">
                  {translateIngredient(c.ingredientId)}
                </p>
                <Badge variant="neutral" className="text-[10px]">
                  {t(`mealPlan.cookingPlan.freshReason.${c.reason}`, {
                    defaultValue: c.reason,
                  })}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
