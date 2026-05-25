import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Printer, Snowflake, CalendarPlus, Info, Sparkles, Sprout, Pill, ChefHat as CookHat } from 'lucide-react';
import {
  buildThawCalendar,
  type CookingBatch,
  type MealPlan,
  type PetProfile,
  type VeggieSession,
} from '@pawcook/shared';
import { setPendingCookingPrefill, buildPrefillHash } from '../../lib/cooking-prefill-bridge';
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
  const navigate = useNavigate();
  const [labelTarget, setLabelTarget] = useState<CookingBatch[] | null>(null);

  // Group batches by ingredient — keeps cook sessions together since the
  // user does one protein at a time at the sous-vide bath. Veg batches
  // get a separate dedicated section (veggieSessions) since they have
  // their own cook-time/temp story; we filter them out of the protein
  // groups here so they only appear once.
  const groups = useMemo(() => {
    if (!plan.cookingPlan) return [];
    const map = new Map<string, CookingBatch[]>();
    for (const batch of plan.cookingPlan.batches) {
      if (batch.kind === 'veg') continue;
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

  const veggieSessions = plan.cookingPlan?.veggieSessions ?? [];
  const supplementCards = plan.cookingPlan?.supplementCards ?? [];

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

  function daysBetweenIso(a: string, b: string): number {
    const da = new Date(a + 'T00:00:00Z').getTime();
    const db = new Date(b + 'T00:00:00Z').getTime();
    return Math.round((db - da) / 86_400_000);
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
                '{{bags}} bags · {{sessions}} cook session(s) · one protein per bag',
              bags: plan.cookingPlan.batches.length,
              sessions: new Set(plan.cookingPlan.batches.map((b) => b.cookDate)).size,
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
                // Frozen quality starts to fade after ~30 days for cooked
                // sous-vide. Surface a hint when a bag would sit longer.
                const frozenDays = Math.max(0, daysBetweenIso(batch.cookDate, batch.dates[0]!));
                const showFrozenHint = frozenDays >= 30;
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
                    {showFrozenHint && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-snug">
                        {t('mealPlan.cookingPlan.frozenQuality', {
                          defaultValue:
                            'Frozen ~{{days}} days — safe, but flavour starts fading. Consider a shorter cook-ahead next plan.',
                          days: frozenDays,
                        })}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}

      {veggieSessions.length > 0 && (
        <Card padding="none" className="overflow-hidden border-primary/30">
          <header className="p-4 border-b border-border bg-primary/5">
            <p className="text-sm font-black text-foreground flex items-center gap-2">
              <Sprout className="h-4 w-4 text-primary" aria-hidden />
              {t('mealPlan.cookingPlan.veggieSessionsLabel', { defaultValue: 'Veggie cook sessions' })}
            </p>
            <p className="text-[11px] text-muted-fg mt-0.5">
              {t('mealPlan.cookingPlan.veggieSessionsHelp', {
                defaultValue: 'Each card groups what to cook together on one day. Tap Plan bags for an exact bag-by-bag workflow.',
              })}
            </p>
          </header>
          <ul className="divide-y divide-border/50">
            {veggieSessions.map((session) => (
              <li key={session.id} className="p-3 space-y-2">
                <VeggieSessionRow
                  session={session}
                  fmtDate={fmtDate}
                  translateIngredient={translateIngredient}
                  onPlanBags={() => {
                    // Pre-fill the cooking calculator with the longest
                    // veg's protein-side fields (so the meat form is in
                    // a sensible state) and navigate. The full veg
                    // workflow lives in the calculator's VegBagPlanner.
                    const firstStep = session.steps[0];
                    setPendingCookingPrefill({
                      planId: plan.id,
                      planName: plan.name,
                      ingredientId: firstStep?.ingredientId,
                      cookingMethod: session.method,
                    });
                    navigate({
                      pathname: '/cooking',
                      hash: buildPrefillHash({
                        planId: plan.id,
                        planName: plan.name,
                        ingredientId: firstStep?.ingredientId,
                        cookingMethod: session.method,
                      }),
                    });
                  }}
                />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {supplementCards.length > 0 && (
        <Card padding="none" className="overflow-hidden border-info/30">
          <header className="p-4 border-b border-border bg-info/5">
            <p className="text-sm font-black text-foreground flex items-center gap-2">
              <Pill className="h-4 w-4 text-info" aria-hidden />
              {t('mealPlan.cookingPlan.supplementCardsLabel', { defaultValue: 'Daily top-ups' })}
            </p>
            <p className="text-[11px] text-muted-fg mt-0.5">
              {t('mealPlan.cookingPlan.supplementCardsHelp', {
                defaultValue: 'Too small to bag — pinch into the bowl daily instead. Cooking these would mean opening 20 bags for 6 g of carrot.',
              })}
            </p>
          </header>
          <ul className="divide-y divide-border/50">
            {supplementCards.map((s) => {
              const itemPets = pets.filter((p) => s.forPetIds.includes(p.id));
              return (
                <li key={s.ingredientId} className="p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">
                      {translateIngredient(s.ingredientId)}
                    </p>
                    {typeof s.dailyDoseG === 'number' && s.dailyDoseG > 0 && (
                      <p className="text-[11px] text-muted-fg font-mono">
                        ~{s.dailyDoseG} g · {t('mealPlan.cookingPlan.perDay', { defaultValue: 'per day, household' })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {itemPets.map((p) => <PetTag key={p.id} pet={p} />)}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {plan.cookingPlan.cookFresh.length > 0 && (
        <Card padding="none" className="overflow-hidden mt-4">
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

function VeggieSessionRow({
  session,
  fmtDate,
  translateIngredient,
  onPlanBags,
}: {
  session: VeggieSession;
  fmtDate: (iso: string) => string;
  translateIngredient: (id: string) => string;
  onPlanBags: () => void;
}) {
  const { t } = useTranslation();
  const orderedSteps = [...session.steps].sort((a, b) => a.addAtMinute - b.addAtMinute);
  const totalRaw = session.steps.reduce((s, x) => s + x.rawGrams, 0);
  const totalCooked = session.steps.reduce((s, x) => s + x.cookedGrams, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">
            {t('mealPlan.cookingPlan.veggieSessionHeader', {
              defaultValue: '{{date}} · {{method}} {{temp}} °C · {{m}} min',
              date: fmtDate(session.cookDate),
              method: t(`cooking.method.${session.method}`, { defaultValue: session.method }),
              temp: session.tempC,
              m: session.totalMinutes,
            })}
          </p>
          <p className="text-[11px] text-muted-fg">
            {t('mealPlan.cookingPlan.veggieSessionTotals', {
              defaultValue: '{{r}} g raw → {{c}} g cooked',
              r: totalRaw, c: totalCooked,
            })}
            {session.fromFrozen && (
              <>
                {' · '}
                <span className="inline-flex items-center gap-1">
                  <Snowflake className="h-3 w-3 text-info" aria-hidden />
                  {t('mealPlan.cookingPlan.fromFrozen', { defaultValue: 'from frozen' })}
                </span>
              </>
            )}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onPlanBags}>
          <CookHat className="h-4 w-4" aria-hidden />
          {t('mealPlan.cookingPlan.planBags', { defaultValue: 'Plan bags' })}
        </Button>
      </div>
      <ol className="text-xs text-muted-fg space-y-1 list-decimal list-inside">
        {orderedSteps.map((step, idx) => (
          <li key={`${session.id}-${idx}`}>
            <span className="capitalize text-foreground">
              {translateIngredient(step.ingredientId)}
            </span>
            {' · '}
            {t(`cooking.veg.cut.${step.cut}`, { defaultValue: step.cut })}
            {' · '}
            {step.addAtMinute === 0
              ? t('mealPlan.cookingPlan.startAt0', { defaultValue: 'start, {{m}} min', m: step.cookMinutes })
              : t('mealPlan.cookingPlan.startAtN', {
                  defaultValue: 'add at +{{at}} min, cooks {{m}} min',
                  at: step.addAtMinute, m: step.cookMinutes,
                })}
          </li>
        ))}
      </ol>
    </div>
  );
}
