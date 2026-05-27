// Standalone veg bag planner. The user describes their kitchen
// state — "I have 1.2 kg carrots, 1 kg sweet potato, 700 g peas" —
// and this component renders a follow-able workflow: how to portion
// them into bags, how to cook (mixed session vs separate), how long
// each bag covers their pets. Mirrors the meat side's bag strategy
// panel in shape.
//
// All math lives in @pawcook/shared/cooking-veg; this file is the
// React skin + form/persist layer.

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sprout, Snowflake, Package, Sparkles, Plus, X, Info, ChevronDown,
} from 'lucide-react';
import {
  planMixedSession,
  bagPlanAlternatives,
  canCoCook,
  type BagPlan,
  type BagRoundingPref,
  type MixedSessionResult,
} from '@pawcook/shared';
import {
  listVegCookingIds,
  getVegCookingEntry,
  applicableCutsFor,
  defaultCutFor,
  selectCutMethodSpec,
  yieldForCut,
} from '@pawcook/shared';
import type {
  VegCut, VegPackaging, CookingMethod,
} from '@pawcook/shared';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Badge } from '../ui/badge';
import { SectionLabel } from '../ui/section-label';
import { Switch } from '../ui/switch';
import { blockBadNumberKeys } from '../../lib/number-input';
import { cn } from '../../lib/cn';

// Per-input gram ceiling. The schema accepts any non-negative number, but
// a runaway value like 1e10 g would render "10000000.00 kg raw total" and
// drive `bagPlanAlternatives` into nonsense (~1056 day bags). Cap at a
// pragmatic 200 kg per ingredient — a whole sous-vide bin's worth.
const MAX_GRAMS_PER_ROW = 200_000;
const MAX_HOUSEHOLD_DAILY_G = 50_000;
const MAX_DAYS_PER_BAG = 14;

function clampGrams(raw: unknown, max: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(Math.max(0, n), max);
}

// ─── Persistence ─────────────────────────────────────────────────

const STORAGE_KEY = 'pawcook_veg_bag_planner_v1';

type SavedDefaults = {
  perVeg: Record<string, { cut: VegCut; packaging: VegPackaging }>;
  method: CookingMethod;
  packaging: VegPackaging;
  prefBagDays: number;
  rounding: BagRoundingPref;
  fromFrozen: boolean;
  dailyHouseholdG: number;
};

const DEFAULTS: SavedDefaults = {
  perVeg: {},
  method: 'sous_vide',
  packaging: 'freezer_bag',
  prefBagDays: 3,
  rounding: 'auto',
  fromFrozen: false,
  dailyHouseholdG: 300,
};

function loadDefaults(): SavedDefaults {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<SavedDefaults>;
    return { ...DEFAULTS, ...parsed, perVeg: { ...DEFAULTS.perVeg, ...parsed.perVeg } };
  } catch {
    return DEFAULTS;
  }
}

function saveDefaults(d: SavedDefaults) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch { /* ignore */ }
}

// ─── Component ───────────────────────────────────────────────────

type OnHand = {
  id: string;
  cut: VegCut;
  rawG: number;
};

export type VegBagPlannerProps = {
  /** Optional initial onhand list — used by plan-aware prefill. */
  initialOnHand?: OnHand[];
  /** Optional daily household veg target. Overrides saved default. */
  initialDailyHouseholdG?: number;
  /** Optional bag-days preference. Overrides saved default. */
  initialPrefBagDays?: number;
};

export function VegBagPlanner({
  initialOnHand,
  initialDailyHouseholdG,
  initialPrefBagDays,
}: VegBagPlannerProps) {
  const { t } = useTranslation();
  const saved = useMemo(() => loadDefaults(), []);

  const allVegIds = useMemo(() => listVegCookingIds().slice(), []);

  const [onHand, setOnHand] = useState<OnHand[]>(() => {
    if (initialOnHand && initialOnHand.length > 0) return initialOnHand;
    // Seed with the user's hero example so the empty state is useful.
    return [
      { id: 'carrots',      cut: saved.perVeg.carrots?.cut      ?? (defaultCutFor('carrots')      ?? 'coins'),   rawG: 0 },
    ];
  });

  const [method, setMethod] = useState<CookingMethod>(saved.method);
  const [packaging, setPackaging] = useState<VegPackaging>(saved.packaging);
  const [prefBagDays, setPrefBagDays] = useState<number>(initialPrefBagDays ?? saved.prefBagDays);
  const [rounding, setRounding] = useState<BagRoundingPref>(saved.rounding);
  const [fromFrozen, setFromFrozen] = useState<boolean>(
    saved.fromFrozen || (saved.packaging === 'vacuum_seal' && saved.method === 'sous_vide'),
  );
  const [dailyHouseholdG, setDailyHouseholdG] = useState<number>(
    initialDailyHouseholdG ?? saved.dailyHouseholdG,
  );
  const [mode, setMode] = useState<'mixed' | 'separate'>('mixed');

  // Persist on change (debounced via effect — simple set is fine here).
  useEffect(() => {
    const perVeg: SavedDefaults['perVeg'] = { ...saved.perVeg };
    for (const oh of onHand) {
      perVeg[oh.id] = { cut: oh.cut, packaging };
    }
    saveDefaults({
      perVeg, method, packaging, prefBagDays, rounding, fromFrozen, dailyHouseholdG,
    });
  }, [onHand, method, packaging, prefBagDays, rounding, fromFrozen, dailyHouseholdG, saved.perVeg]);

  // Auto-flip fromFrozen when the workflow combo turns into vacuum+sous_vide.
  useEffect(() => {
    if (packaging === 'vacuum_seal' && method === 'sous_vide') setFromFrozen(true);
  }, [packaging, method]);

  // ─── Derived ────────────────────────────────────────────────────

  const totalOnHandG = onHand.reduce((s, o) => s + (o.rawG || 0), 0);
  const anyHasGrams = onHand.some((o) => (o.rawG || 0) > 0);

  // Mixed session — feasible only when every veg supports the method
  // AND every cut is canCoCook AND all on-hand veggies have grams set.
  const mixedSession: MixedSessionResult | null = useMemo(() => {
    if (mode !== 'mixed' || !anyHasGrams) return null;
    if (onHand.some((o) => !canCoCook(o.cut))) return null;
    return planMixedSession({
      method,
      fromFrozen,
      veggies: onHand
        .filter((o) => (o.rawG || 0) > 0)
        .map((o) => ({ ingredientId: o.id, cut: o.cut, rawG: o.rawG })),
    });
  }, [mode, onHand, method, fromFrozen, anyHasGrams]);

  // Per-veg bag plans (always computed — used in both modes).
  const perVegPlans: Array<{ on: OnHand; alts: ReturnType<typeof bagPlanAlternatives> }> = useMemo(() => {
    return onHand
      .filter((o) => (o.rawG || 0) > 0)
      .map((o) => {
        // Bag splitting works on cooked weight; planVegBagsFromRaw
        // handles the yield conversion internally.
        const yieldRatio = yieldForCut(o.id, o.cut);
        const cookedG = Math.round(o.rawG * yieldRatio);
        return {
          on: o,
          alts: bagPlanAlternatives({
            cookedG,
            dailyHouseholdG: Math.max(1, dailyHouseholdG),
            prefBagDays,
            rounding,
          }),
        };
      });
  }, [onHand, dailyHouseholdG, prefBagDays, rounding]);

  // ─── Handlers ───────────────────────────────────────────────────

  function addVeg(id: string) {
    if (onHand.some((o) => o.id === id)) return;
    const cut = saved.perVeg[id]?.cut ?? defaultCutFor(id) ?? 'whole';
    setOnHand((prev) => [...prev, { id, cut, rawG: 0 }]);
  }

  function removeVeg(id: string) {
    setOnHand((prev) => prev.filter((o) => o.id !== id));
  }

  function updateVeg(id: string, patch: Partial<OnHand>) {
    setOnHand((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <Card padding="md" className="space-y-5 mt-6 border-primary/20">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/15 p-2.5">
            <Sprout className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {t('cooking.veg.bagPlanner.title', { defaultValue: 'Plan veggie bags' })}
            </h2>
            <p className="text-sm text-muted-fg leading-snug">
              {t('cooking.veg.bagPlanner.subtitle', {
                defaultValue: 'Type what you have on hand — pick a cut, get a bag-by-bag workflow you can actually follow.',
              })}
            </p>
          </div>
        </div>
      </header>

      {/* On-hand list */}
      <div className="space-y-3">
        <SectionLabel>
          {t('cooking.veg.bagPlanner.onHandLabel', { defaultValue: 'What you have on hand' })}
        </SectionLabel>
        <ul className="space-y-2">
          {onHand.map((oh) => (
            <OnHandRow
              key={oh.id}
              row={oh}
              onChange={(patch) => updateVeg(oh.id, patch)}
              onRemove={() => removeVeg(oh.id)}
            />
          ))}
        </ul>
        <AddVegPicker availableIds={allVegIds.filter((id) => !onHand.some((o) => o.id === id))} onAdd={addVeg} />
        {totalOnHandG > 0 && (
          <p className="text-xs text-muted-fg">
            {t('cooking.veg.bagPlanner.totalOnHand', {
              defaultValue: '{{kg}} kg raw total',
              kg: (totalOnHandG / 1000).toFixed(2),
            })}
          </p>
        )}
      </div>

      {/* Preferences */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Select
          label={t('cooking.veg.bagPlanner.methodLabel', { defaultValue: 'Cook method' })}
          value={method}
          onChange={(e) => setMethod(e.target.value as CookingMethod)}
        >
          <option value="sous_vide">{t('cooking.methods.sous_vide', { defaultValue: 'Sous-vide' })}</option>
          <option value="stovetop_low">{t('cooking.methods.stovetop_low', { defaultValue: 'Stovetop / steam' })}</option>
          <option value="oven">{t('cooking.methods.oven', { defaultValue: 'Oven' })}</option>
          <option value="pressure_cooker">{t('cooking.methods.pressure_cooker', { defaultValue: 'Pressure cooker' })}</option>
          <option value="slow_cooker">{t('cooking.methods.slow_cooker', { defaultValue: 'Slow cooker' })}</option>
        </Select>
        <Select
          label={t('cooking.veg.bagPlanner.packagingLabel', { defaultValue: 'Packaging' })}
          value={packaging}
          onChange={(e) => setPackaging(e.target.value as VegPackaging)}
        >
          <option value="freezer_bag">{t('cooking.veg.packaging.freezer_bag', { defaultValue: 'Freezer bag (flat-pack)' })}</option>
          <option value="vacuum_seal">{t('cooking.veg.packaging.vacuum_seal', { defaultValue: 'Vacuum-seal (cook from frozen)' })}</option>
          <option value="silicone_tray">{t('cooking.veg.packaging.silicone_tray', { defaultValue: 'Silicone tray (portion cubes)' })}</option>
          <option value="rigid_container">{t('cooking.veg.packaging.rigid_container', { defaultValue: 'Rigid container (fridge only)' })}</option>
        </Select>
        <Input
          label={t('cooking.veg.bagPlanner.householdLabel', { defaultValue: 'Household veg per day (g)' })}
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_HOUSEHOLD_DAILY_G}
          onKeyDown={blockBadNumberKeys}
          value={dailyHouseholdG || ''}
          onChange={(e) => setDailyHouseholdG(clampGrams(e.target.value, MAX_HOUSEHOLD_DAILY_G))}
          helper={t('cooking.veg.bagPlanner.householdHelper', {
            defaultValue: 'Total grams across all pets per day. Used to size bags.',
          })}
        />
        <Input
          label={t('cooking.veg.bagPlanner.daysLabel', { defaultValue: 'Days per bag (preferred)' })}
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_DAYS_PER_BAG}
          onKeyDown={blockBadNumberKeys}
          value={prefBagDays}
          onChange={(e) => setPrefBagDays(Math.max(1, Math.min(MAX_DAYS_PER_BAG, Number(e.target.value) || 1)))}
        />
        <Select
          label={t('cooking.veg.bagPlanner.roundingLabel', { defaultValue: 'Bag size rounding' })}
          value={rounding}
          onChange={(e) => setRounding(e.target.value as BagRoundingPref)}
        >
          <option value="auto">{t('cooking.veg.rounding.auto', { defaultValue: 'Auto (50/100/200/250/300…)' })}</option>
          <option value="step50">{t('cooking.veg.rounding.step50', { defaultValue: 'Round to 50 g' })}</option>
          <option value="step100">{t('cooking.veg.rounding.step100', { defaultValue: 'Round to 100 g' })}</option>
          <option value="halves">{t('cooking.veg.rounding.halves', { defaultValue: 'Even halves (2 / 4 / 8)' })}</option>
        </Select>
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="block text-[11px] font-bold text-muted-fg uppercase tracking-[0.1em]">
              {t('cooking.veg.bagPlanner.modeLabel', { defaultValue: 'Mode' })}
            </label>
            <div className="flex gap-2">
              <ModeChip active={mode === 'mixed'} onClick={() => setMode('mixed')}>
                {t('cooking.veg.mode.mixed', { defaultValue: 'Mixed cook' })}
              </ModeChip>
              <ModeChip active={mode === 'separate'} onClick={() => setMode('separate')}>
                {t('cooking.veg.mode.separate', { defaultValue: 'Separate' })}
              </ModeChip>
            </div>
          </div>
        </div>
      </div>

      {/* From-frozen toggle */}
      <label className="flex items-start gap-3 cursor-pointer">
        <Switch checked={fromFrozen} onCheckedChange={setFromFrozen} />
        <span>
          <span className="block text-sm font-medium text-foreground">
            <Snowflake className="inline h-3.5 w-3.5 mr-1 text-info" aria-hidden />
            {t('cooking.veg.bagPlanner.fromFrozenLabel', { defaultValue: 'Cook from frozen' })}
          </span>
          <span className="block text-xs text-muted-fg">
            {t('cooking.veg.bagPlanner.fromFrozenHelper', {
              defaultValue: 'Adds the from-frozen minutes per cut (when the spec defines them).',
            })}
          </span>
        </span>
      </label>

      {/* Output */}
      {!anyHasGrams ? (
        <Card padding="md" className="bg-surface-2 border-dashed">
          <p className="text-sm text-muted-fg flex items-center gap-2">
            <Info className="h-4 w-4" aria-hidden />
            {t('cooking.veg.bagPlanner.emptyHint', {
              defaultValue: 'Enter how many grams of each veggie you have to see your bag plan.',
            })}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {mode === 'mixed' && mixedSession && (
            <MixedSessionCard session={mixedSession} packaging={packaging} fromFrozen={fromFrozen} />
          )}
          {mode === 'mixed' && !mixedSession && (
            <Card padding="md" className="bg-warning/10 border-warning/30">
              <p className="text-sm text-warning-fg flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5" aria-hidden />
                {t('cooking.veg.bagPlanner.mixedNotPossible', {
                  defaultValue: 'These veggies cannot co-cook in one session — switch to Separate, or change cuts/method so they can share the pot.',
                })}
              </p>
            </Card>
          )}
          {perVegPlans.map(({ on, alts }) => (
            <PerVegCard
              key={on.id}
              row={on}
              method={method}
              packaging={packaging}
              fromFrozen={fromFrozen}
              alts={alts}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

function OnHandRow({
  row,
  onChange,
  onRemove,
}: {
  row: OnHand;
  onChange: (patch: Partial<OnHand>) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const entry = getVegCookingEntry(row.id);
  const cuts = applicableCutsFor(row.id);
  const label = entry?.id ?? row.id;

  return (
    <li className="grid grid-cols-12 gap-2 items-start">
      <div className="col-span-5 sm:col-span-4">
        <p className="text-sm font-semibold text-foreground capitalize">
          {t(`ingredient.${row.id}`, { defaultValue: label.replace(/_/g, ' ') })}
        </p>
        <p className="text-[11px] text-muted-fg">
          {t('cooking.veg.bagPlanner.yieldLabel', {
            defaultValue: 'Yield {{p}}%',
            p: Math.round(yieldForCut(row.id, row.cut) * 100),
          })}
        </p>
      </div>
      <div className="col-span-4 sm:col-span-4">
        <Select
          aria-label={t('cooking.veg.bagPlanner.cutLabel', { defaultValue: 'Cut form' })}
          value={row.cut}
          onChange={(e) => onChange({ cut: e.target.value as VegCut })}
        >
          {cuts.map((c) => (
            <option key={c} value={c}>{t(`cooking.veg.cut.${c}`, { defaultValue: humanCut(c) })}</option>
          ))}
        </Select>
      </div>
      <div className="col-span-2 sm:col-span-3">
        <Input
          aria-label={t('cooking.veg.bagPlanner.gramsLabel', { defaultValue: 'Grams (raw)' })}
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_GRAMS_PER_ROW}
          step={50}
          placeholder="g"
          onKeyDown={blockBadNumberKeys}
          value={row.rawG || ''}
          onChange={(e) => onChange({ rawG: clampGrams(e.target.value, MAX_GRAMS_PER_ROW) })}
        />
      </div>
      <div className="col-span-1 flex justify-end pt-2">
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded hover:bg-surface-2 text-muted-fg hover:text-danger"
          aria-label={t('common.remove', { defaultValue: 'Remove' })}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </li>
  );
}

function AddVegPicker({
  availableIds,
  onAdd,
}: {
  availableIds: string[];
  onAdd: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  if (availableIds.length === 0) return null;
  return (
    <div className="relative inline-block">
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>
        <Plus className="h-3.5 w-3.5 mr-1" aria-hidden />
        {t('cooking.veg.bagPlanner.addVeggie', { defaultValue: 'Add veggie' })}
        <ChevronDown className="h-3.5 w-3.5 ml-1" aria-hidden />
      </Button>
      {open && (
        <div className="absolute z-10 mt-1 w-56 max-h-64 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
          {availableIds.map((id) => (
            <button
              key={id}
              type="button"
              className="block w-full text-left px-3 py-2 text-sm hover:bg-surface-2 capitalize"
              onClick={() => { onAdd(id); setOpen(false); }}
            >
              {t(`ingredient.${id}`, { defaultValue: id.replace(/_/g, ' ') })}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MixedSessionCard({
  session,
  packaging,
  fromFrozen,
}: {
  session: MixedSessionResult;
  packaging: VegPackaging;
  fromFrozen: boolean;
}) {
  const { t } = useTranslation();
  const orderedSteps = [...session.steps].sort((a, b) => a.addAtMinute - b.addAtMinute);
  return (
    <Card padding="md" className="border-primary/30 bg-primary/5 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden />
        <h3 className="font-semibold text-foreground">
          {t('cooking.veg.session.title', {
            defaultValue: 'Mixed cook session · {{m}} min total',
            m: session.totalMinutes,
          })}
        </h3>
      </div>
      <p className="text-sm text-muted-fg">
        {t('cooking.veg.session.tempLine', {
          defaultValue: '{{method}} at {{t}} °C{{frozen}}',
          method: t(`cooking.methods.${session.method}`, { defaultValue: session.method }),
          t: session.tempC,
          frozen: fromFrozen ? t('cooking.veg.session.fromFrozenSuffix', { defaultValue: ' · from frozen' }) : '',
        })}
      </p>
      <ol className="space-y-2">
        {orderedSteps.map((step, idx) => (
          <li key={`${step.ingredientId}-${idx}`} className="flex items-start gap-3">
            <div className="flex-none w-8 h-8 rounded-full bg-primary/15 text-primary text-sm font-bold flex items-center justify-center">
              {idx + 1}
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium text-foreground capitalize">
                {t(`ingredient.${step.ingredientId}`, { defaultValue: step.ingredientId.replace(/_/g, ' ') })}
                {' · '}
                <span className="text-muted-fg">{t(`cooking.veg.cut.${step.cut}`, { defaultValue: humanCut(step.cut) })}</span>
              </p>
              <p className="text-xs text-muted-fg">
                {step.addAtMinute === 0
                  ? t('cooking.veg.session.startNow', { defaultValue: 'Start now · {{m}} min', m: step.cookMinutes })
                  : t('cooking.veg.session.addAt', {
                      defaultValue: 'Add at +{{at}} min · {{m}} min cook',
                      at: step.addAtMinute, m: step.cookMinutes,
                    })}
                {' · '}
                {t('cooking.veg.session.rawCookedGrams', {
                  defaultValue: '{{r}} g raw → {{c}} g cooked',
                  r: step.rawGrams, c: step.cookedGrams,
                })}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex gap-2 text-xs">
        <Badge variant="info">
          <Package className="h-3 w-3" aria-hidden />
          {t(`cooking.veg.packaging.${packaging}`, { defaultValue: packaging })}
        </Badge>
        {fromFrozen && (
          <Badge variant="info">
            <Snowflake className="h-3 w-3" aria-hidden />
            {t('cooking.veg.fromFrozenChip', { defaultValue: 'From frozen' })}
          </Badge>
        )}
      </div>
    </Card>
  );
}

function PerVegCard({
  row,
  method,
  packaging,
  fromFrozen,
  alts,
}: {
  row: OnHand;
  method: CookingMethod;
  packaging: VegPackaging;
  fromFrozen: boolean;
  alts: { recommended: BagPlan; bigger: BagPlan; smaller: BagPlan };
}) {
  const { t } = useTranslation();
  const [pick, setPick] = useState<'recommended' | 'bigger' | 'smaller'>('recommended');
  const chosen = alts[pick];
  const spec = selectCutMethodSpec(row.id, row.cut, method);
  const yieldRatio = yieldForCut(row.id, row.cut);
  const cookedG = Math.round(row.rawG * yieldRatio);

  // Per-bag "contents" — i.e. what actually goes IN each bag. This is
  // not always equal to bagSizeCookedG: for a 1-bag plan the contents
  // are the user's full cookedG amount (the rounded-up bag size is
  // just the container label), and for an uneven multi-bag split the
  // last bag holds the remainder. Showing contents rather than the
  // container label avoids the confusing "1 × 1000 g (1282 g raw)"
  // when the user only has 1200 g raw.
  const singleBag = chosen.bagCount === 1;
  const evenBags = chosen.bagCount > 1 && chosen.lastBagCookedG === chosen.bagSizeCookedG;
  const fullBagCookedG = chosen.bagSizeCookedG;
  const fullBagRawG = yieldRatio > 0 ? Math.round(fullBagCookedG / yieldRatio) : fullBagCookedG;
  // Last-bag raw view: scale proportional to the cooked last-bag fraction.
  const lastBagRawG = fullBagCookedG > 0
    ? Math.round((chosen.lastBagCookedG / fullBagCookedG) * fullBagRawG)
    : 0;

  const cookMinutesMax = spec
    ? spec.minutes.max + (fromFrozen ? spec.fromFrozenAddMin ?? 0 : 0)
    : null;
  const cookMinutesMin = spec
    ? spec.minutes.min + (fromFrozen ? spec.fromFrozenAddMin ?? 0 : 0)
    : null;

  return (
    <Card padding="md" className="space-y-3">
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="font-semibold text-foreground capitalize">
          {t(`ingredient.${row.id}`, { defaultValue: row.id.replace(/_/g, ' ') })}
          {' · '}
          <span className="text-muted-fg font-normal">
            {t(`cooking.veg.cut.${row.cut}`, { defaultValue: humanCut(row.cut) })}
          </span>
        </h3>
        <p className="text-xs text-muted-fg whitespace-nowrap">
          {t('cooking.veg.bagPlanner.totalLine', {
            defaultValue: '{{r}} g raw → {{c}} g cooked',
            r: row.rawG, c: cookedG,
          })}
        </p>
      </header>

      {/* Alternatives */}
      <div className="grid grid-cols-3 gap-2">
        {(['recommended', 'bigger', 'smaller'] as const).map((key) => {
          const a = alts[key];
          const active = pick === key;
          // When the plan packs into a single bag whose container size
          // exceeds the user's actual cooked amount, show contents to
          // avoid the misleading "1 × 1000 g" when they only have ~936 g
          // cooked. Multi-bag plans show the labeled size — every bag
          // but the last fills it.
          const oneBag = a.bagCount === 1;
          const sizeLabel = oneBag && a.bagSizeCookedG !== cookedG
            ? `${cookedG} g`
            : `${a.bagSizeCookedG} g`;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setPick(key)}
              className={cn(
                'rounded-xl border p-3 text-left transition-colors',
                active
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-surface hover:bg-surface-2',
              )}
            >
              <p className="text-[10px] uppercase tracking-wide font-bold text-muted-fg">
                {t(`cooking.veg.bagOption.${key}`, {
                  defaultValue: key === 'recommended' ? 'Recommended' : key === 'bigger' ? 'Bigger bags' : 'Smaller bags',
                })}
              </p>
              <p className="text-sm font-bold text-foreground mt-1">
                {a.bagCount} × {sizeLabel}
              </p>
              <p className="text-[11px] text-muted-fg">
                {t('cooking.veg.bagPlanner.coversDaysShort', {
                  defaultValue: '~{{d}} days',
                  d: a.coversDays.toFixed(1),
                })}
              </p>
            </button>
          );
        })}
      </div>

      {/* Workflow */}
      <div className="rounded-xl bg-surface-2 p-3 space-y-1.5">
        <SectionLabel>
          {t('cooking.veg.bagPlanner.workflowLabel', { defaultValue: 'Workflow' })}
        </SectionLabel>
        <ol className="text-sm text-foreground space-y-1 list-decimal list-inside">
          {singleBag ? (
            <li>
              {t('cooking.veg.bagPlanner.stepPortionSingle', {
                defaultValue: 'Portion all {{raw}} g raw ({{cooked}} g cooked) into 1 bag (fits ~{{size}} g container).',
                raw: row.rawG,
                cooked: cookedG,
                size: chosen.bagSizeCookedG,
              })}
            </li>
          ) : evenBags ? (
            <li>
              {t('cooking.veg.bagPlanner.stepPortionEven', {
                defaultValue: 'Portion into {{n}} bags of {{cooked}} g cooked (~{{raw}} g raw each).',
                n: chosen.bagCount,
                cooked: fullBagCookedG,
                raw: fullBagRawG,
              })}
            </li>
          ) : (
            <li>
              {t('cooking.veg.bagPlanner.stepPortionUneven', {
                defaultValue: 'Portion into {{n}} bags: {{full}} × {{cooked}} g + 1 × {{lastCooked}} g cooked (~{{raw}} g raw per full bag, {{lastRaw}} g raw for the last).',
                n: chosen.bagCount,
                full: chosen.bagCount - 1,
                cooked: fullBagCookedG,
                lastCooked: chosen.lastBagCookedG,
                raw: fullBagRawG,
                lastRaw: lastBagRawG,
              })}
            </li>
          )}
          {packaging === 'vacuum_seal' && (
            <li>{t('cooking.veg.bagPlanner.stepVacuumSeal', { defaultValue: 'Vacuum-seal each bag flat in a single layer; freeze immediately.' })}</li>
          )}
          {packaging === 'silicone_tray' && (
            <li>{t('cooking.veg.bagPlanner.stepSiliconeTray', { defaultValue: 'Pour into silicone trays; freeze; pop cubes into a freezer bag for portion-on-demand.' })}</li>
          )}
          {packaging === 'freezer_bag' && (
            <li>{t('cooking.veg.bagPlanner.stepFreezerBag', { defaultValue: 'Bag each portion flat; freeze; snap-off portions as you go.' })}</li>
          )}
          {packaging === 'rigid_container' && (
            <li>{t('cooking.veg.bagPlanner.stepRigid', { defaultValue: 'Pack into containers; refrigerate (no freezing). Use within 3–4 days.' })}</li>
          )}
          {spec ? (
            <li>
              {t('cooking.veg.bagPlanner.stepCook', {
                defaultValue: 'Cook {{method}} at {{t}} °C, {{min}}–{{max}} min',
                method: t(`cooking.methods.${method}`, { defaultValue: method }),
                t: spec.tempC,
                min: cookMinutesMin,
                max: cookMinutesMax,
              })}
              {fromFrozen && spec.fromFrozenAddMin ? (
                <span className="text-muted-fg">
                  {' '}
                  {t('cooking.veg.bagPlanner.fromFrozenAddendum', {
                    defaultValue: '(includes +{{x}} min from frozen)',
                    x: spec.fromFrozenAddMin,
                  })}
                </span>
              ) : null}
            </li>
          ) : (
            <li className="text-warning">
              {t('cooking.veg.bagPlanner.noSpec', {
                defaultValue: 'This method is not supported for this veggie — change cut or method.',
              })}
            </li>
          )}
          <li>{t('cooking.veg.bagPlanner.stepCool', { defaultValue: 'Cool to ≤21 °C before fridge (within 2 h); ice-bath leafy/cruciferous.' })}</li>
        </ol>
      </div>

      {chosen.bagHeadroomG > 0 && (
        <p className="text-xs text-muted-fg">
          {t('cooking.veg.bagPlanner.headroomNote', {
            defaultValue: 'Last bag has {{g}} g spare headroom — you can top up with the next cook or freeze as-is.',
            g: chosen.bagHeadroomG,
          })}
        </p>
      )}
    </Card>
  );
}

function ModeChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-primary-fg border-primary'
          : 'bg-surface text-foreground border-border hover:bg-surface-2',
      )}
    >
      {children}
    </button>
  );
}

function humanCut(cut: VegCut): string {
  switch (cut) {
    case 'whole':           return 'Whole';
    case 'large_chunks':    return 'Large chunks (3–4 cm)';
    case 'cubed':           return 'Cubed (1–2 cm)';
    case 'coins':           return 'Coins (6–10 mm)';
    case 'mandolin_thin':   return 'Mandolin thin (2–4 mm)';
    case 'sticks':          return 'Sticks / batons';
    case 'shredded':        return 'Shredded / grated';
    case 'florets':         return 'Florets';
    case 'leaves_whole':    return 'Whole leaves';
    case 'leaves_shredded': return 'Shredded leaves';
  }
}
