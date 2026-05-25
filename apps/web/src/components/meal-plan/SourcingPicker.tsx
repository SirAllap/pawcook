import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Beef, Carrot } from 'lucide-react';
import {
  getMeatIngredients, getVegIngredients,
  type AccessibilityTier, type CookingMethod, type Species, type SourcingPrefs, type VarietyTier,
} from '@pawcook/shared';
import { SectionLabel } from '../ui/section-label';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Switch } from '../ui/switch';
import { useTranslateIngredient } from '../../lib/translate-ingredient';
import { cn } from '../../lib/cn';

const VARIETY_OPTIONS: VarietyTier[] = ['standard', 'diverse', 'novel'];
const ACCESS_OPTIONS: AccessibilityTier[] = ['easy', 'specialty'];
const METHOD_OPTIONS: CookingMethod[] = ['sous_vide', 'oven', 'stovetop_low', 'slow_cooker', 'pressure_cooker'];
const METHOD_EMOJI: Record<CookingMethod, string> = {
  sous_vide: '🛁',
  oven: '🍲',
  stovetop_low: '🫕',
  slow_cooker: '🥘',
  pressure_cooker: '⏲️',
};
// User-facing options. "Whole plan" maps to bagDays=durationDays at
// commit-time, but only when durationDays <= FRIDGE_SAFE_DAYS (3) — for
// longer plans the option is disabled (cooked meat keeps 3 days post-
// thaw, so a bag covering more would breach food-safety).
const COOK_AHEAD_OPTIONS = [1, 2, 3] as const;
type CookAheadDays = (typeof COOK_AHEAD_OPTIONS)[number];
const FRIDGE_SAFE_DAYS = 3;

export function SourcingPicker({
  value,
  onChange,
  species,
  durationDays,
  cookAheadStats,
  householdHints,
}: {
  value: SourcingPrefs;
  onChange: (next: SourcingPrefs) => void;
  /**
   * Used to scope the ingredient picker chips. The planner already filters
   * by species per pet, but if a wizard only has dogs, showing cat-only
   * proteins as picks would be confusing.
   */
  species: Species;
  /**
   * Plan duration in days. Used to cap the bag-size selector so the user
   * can't pick a bag that covers more than half the plan, which would
   * defeat the rotation benefit.
   */
  durationDays: number;
  /**
   * Live cook-ahead stats from the wizard. When present, the Cook ahead
   * step shows the resulting bag count and how many cook sessions the
   * current setting saves vs daily rotation — so the user can see the
   * frugal payoff before they generate.
   */
  cookAheadStats?: {
    bags: number;
    sessions: number;
    sessionsSaved: number;
  } | null;
  /**
   * Household-derived hints. Surfaces a "tiny-household: consider longer
   * Cook ahead" nudge when total daily intake is low enough that smaller
   * windows produce runt-sized bags. See `recommendDefaultBagDays`.
   */
  householdHints?: {
    recommendedBagDays: 1 | 2 | 3;
    estimatedDailyGrams: number;
  } | null;
}) {
  const { t } = useTranslation();
  const translateIngredient = useTranslateIngredient();

  const meats = useMemo(() => getMeatIngredients(species), [species]);
  const veggies = useMemo(() => getVegIngredients(species), [species]);

  // Hard cap by food safety: cooked-then-thawed meat keeps 3 days in
  // the fridge. Longer windows are never offered, even on 30-day plans.
  const maxCookAhead = Math.min(FRIDGE_SAFE_DAYS, Math.max(1, durationDays)) as CookAheadDays;
  const showCookAhead = value.preferredCookingMethod === 'sous_vide';
  // Warning fires when a bag would sit frozen for ~3+ weeks before its
  // last serve day. Most pronounced on long plans with large windows.
  const cookAheadWarning = value.bagDays >= 3 && durationDays >= 30;

  const meatSet = useMemo(() => new Set(value.meatIds), [value.meatIds]);
  const vegSet = useMemo(() => new Set(value.vegIds), [value.vegIds]);

  function toggleMeat(id: string) {
    onChange({
      ...value,
      meatIds: meatSet.has(id)
        ? value.meatIds.filter((m) => m !== id)
        : [...value.meatIds, id],
    });
  }
  function toggleVeg(id: string) {
    onChange({
      ...value,
      vegIds: vegSet.has(id)
        ? value.vegIds.filter((v) => v !== id)
        : [...value.vegIds, id],
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SectionLabel>{t('mealPlan.sourcing.varietyLabel')}</SectionLabel>
        <p className="text-xs text-muted-fg leading-relaxed">
          {t('mealPlan.sourcing.varietyHelp')}
        </p>
        <ToggleGroup
          type="single"
          value={value.variety}
          onValueChange={(v) => v && onChange({ ...value, variety: v as VarietyTier })}
          aria-label={t('mealPlan.sourcing.varietyLabel')}
          className="grid grid-cols-3 w-full"
        >
          {VARIETY_OPTIONS.map((opt) => (
            <ToggleGroupItem key={opt} value={opt}>
              {t(`mealPlan.sourcing.variety.${opt}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="space-y-2">
        <SectionLabel>{t('mealPlan.sourcing.accessLabel')}</SectionLabel>
        <p className="text-xs text-muted-fg leading-relaxed">
          {t('mealPlan.sourcing.accessHelp')}
        </p>
        <ToggleGroup
          type="single"
          value={value.accessibility}
          onValueChange={(v) => v && onChange({ ...value, accessibility: v as AccessibilityTier })}
          aria-label={t('mealPlan.sourcing.accessLabel')}
          className="grid grid-cols-2 w-full"
        >
          {ACCESS_OPTIONS.map((opt) => (
            <ToggleGroupItem key={opt} value={opt}>
              {t(`mealPlan.sourcing.access.${opt}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="space-y-2">
        <SectionLabel>
          {t('mealPlan.sourcing.methodLabel', { defaultValue: 'Cooking method' })}
        </SectionLabel>
        <p className="text-xs text-muted-fg leading-relaxed">
          {t('mealPlan.sourcing.methodHelp', {
            defaultValue: 'We remember this so "Cook" buttons in the shopping list open the calculator already set up your way.',
          })}
        </p>
        <ToggleGroup
          type="single"
          value={value.preferredCookingMethod}
          onValueChange={(v) => v && onChange({ ...value, preferredCookingMethod: v as CookingMethod })}
          aria-label={t('mealPlan.sourcing.methodLabel', { defaultValue: 'Cooking method' })}
          className="grid grid-cols-2 sm:grid-cols-5 w-full"
        >
          {METHOD_OPTIONS.map((opt) => (
            <ToggleGroupItem key={opt} value={opt} aria-label={t(`cooking.methods.${opt}`)}>
              <span aria-hidden>{METHOD_EMOJI[opt]}</span>
              <span className="truncate">{t(`cooking.methods.${opt}`)}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {showCookAhead && (
        <div className="space-y-2">
          <SectionLabel>
            {t('mealPlan.sourcing.cookAheadLabel', { defaultValue: 'Cook ahead' })}
          </SectionLabel>
          <p className="text-xs text-muted-fg leading-relaxed">
            {t('mealPlan.sourcing.cookAheadHelp', {
              defaultValue:
                'How many days each protein-batch should cover. Bigger windows = fewer cook sessions and less plastic; the planner groups consecutive days of the same protein so each bag is full.',
            })}
          </p>
          <ToggleGroup
            type="single"
            value={String(value.bagDays)}
            onValueChange={(v) => {
              if (!v) return;
              const n = Number(v);
              if (!Number.isFinite(n) || n < 1 || n > 3) return;
              onChange({ ...value, bagDays: n as 1 | 2 | 3 });
            }}
            aria-label={t('mealPlan.sourcing.cookAheadLabel', { defaultValue: 'Cook ahead' })}
            className="grid grid-cols-3 w-full"
          >
            {COOK_AHEAD_OPTIONS.map((opt) => {
              const disabled = opt > maxCookAhead;
              const labelKey =
                opt === 1 ? 'mealPlan.sourcing.cookAhead.perServe'
                : opt === 2 ? 'mealPlan.sourcing.cookAhead.upTo2'
                : 'mealPlan.sourcing.cookAhead.upTo3';
              const defaultLabel =
                opt === 1 ? 'Per serve'
                : opt === 2 ? 'Up to 2 days'
                : 'Up to 3 days';
              return (
                <ToggleGroupItem
                  key={opt}
                  value={String(opt)}
                  disabled={disabled}
                  title={disabled
                    ? t('mealPlan.sourcing.cookAheadCapSafety', {
                        defaultValue: 'Cooked meat keeps 3 days after thaw.',
                      })
                    : undefined}
                  aria-label={t(labelKey, { defaultValue: defaultLabel })}
                >
                  {t(labelKey, { defaultValue: defaultLabel })}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
          <p className="text-[11px] text-muted-fg leading-relaxed">
            {t('mealPlan.sourcing.cookAheadCaption', {
              defaultValue: 'One protein per bag · veggies in their own bags',
            })}
          </p>
          {cookAheadStats && cookAheadStats.bags > 0 && (
            <p className="text-[11px] font-mono tabular-nums text-foreground/80 leading-relaxed">
              {cookAheadStats.sessionsSaved > 0
                ? t('mealPlan.sourcing.cookAheadStatsSaving', {
                    defaultValue:
                      '{{bags}} bags · {{sessions}} cook session(s) · saves {{saved}} vs daily',
                    bags: cookAheadStats.bags,
                    sessions: cookAheadStats.sessions,
                    saved: cookAheadStats.sessionsSaved,
                  })
                : t('mealPlan.sourcing.cookAheadStats', {
                    defaultValue: '{{bags}} bags · {{sessions}} cook session(s)',
                    bags: cookAheadStats.bags,
                    sessions: cookAheadStats.sessions,
                  })}
            </p>
          )}
          {householdHints
            && householdHints.recommendedBagDays > value.bagDays
            && value.bagDays < 3 && (
              <p className="text-[11px] text-info dark:text-info leading-relaxed">
                {t('mealPlan.sourcing.tinyHouseholdHint', {
                  defaultValue:
                    'Tiny household (~{{grams}} g/day) — try Up to 3 days to avoid runt-sized bags.',
                  grams: householdHints.estimatedDailyGrams,
                })}
              </p>
            )}
          {cookAheadWarning && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
              {t('mealPlan.sourcing.cookAheadWarn', {
                defaultValue:
                  'Some bags will sit frozen for ~3 weeks. Safe, but flavour fades — try a shorter window.',
              })}
            </p>
          )}
        </div>
      )}

      <IngredientChips
        eyebrow={<Beef className="h-3.5 w-3.5" aria-hidden />}
        label={t('mealPlan.sourcing.meatsLabel', { defaultValue: 'Meats to include' })}
        help={t('mealPlan.sourcing.meatsHelp', {
          defaultValue: 'Pick the proteins you want — leave empty to let the planner choose any.',
        })}
        emptyHint={t('mealPlan.sourcing.anyMeats', { defaultValue: 'Any · planner picks' })}
        ingredients={meats}
        selected={meatSet}
        onToggle={toggleMeat}
        translate={translateIngredient}
      />

      <IngredientChips
        eyebrow={<Carrot className="h-3.5 w-3.5" aria-hidden />}
        label={t('mealPlan.sourcing.veggiesLabel', { defaultValue: 'Veggies to include' })}
        help={t('mealPlan.sourcing.veggiesHelp', {
          defaultValue: 'Pick the produce you want — leave empty to let the planner choose any.',
        })}
        emptyHint={t('mealPlan.sourcing.anyVeggies', { defaultValue: 'Any · planner picks' })}
        ingredients={veggies}
        selected={vegSet}
        onToggle={toggleVeg}
        translate={translateIngredient}
      />

      <div className="space-y-2.5">
        <SectionLabel>{t('mealPlan.sourcing.prefsLabel')}</SectionLabel>
        <SourcingFlag
          label={t('mealPlan.sourcing.simpleMeals', { defaultValue: 'Simple meals' })}
          help={t('mealPlan.sourcing.simpleMealsHelp', {
            defaultValue:
              'One protein per meal — same bag for the whole household. Cats get a daily taurine + cod liver oil supplement card to fill the gap. Turn off for the full multi-component recipe (organs, seafood add-ins, per-pet macros).',
          })}
          checked={value.simpleMeals}
          onChange={(v) => onChange({
            ...value,
            simpleMeals: v,
            // Keep the legacy includeOrgans flag in sync so plans saved
            // with the new schema still serialise sensibly for older
            // tooling that reads it. When simpleMeals is ON, organs are
            // already collapsed into protein, so includeOrgans is moot.
            includeOrgans: v ? false : true,
          })}
        />
        <SourcingFlag
          label={t('mealPlan.sourcing.preferWildFish')}
          checked={value.preferWildFish}
          onChange={(v) => onChange({ ...value, preferWildFish: v })}
        />
        <SourcingFlag
          label={t('mealPlan.sourcing.preferGrassFed')}
          checked={value.preferGrassFed}
          onChange={(v) => onChange({ ...value, preferGrassFed: v })}
        />
        <SourcingFlag
          label={t('mealPlan.sourcing.preferOrganic')}
          checked={value.preferOrganic}
          onChange={(v) => onChange({ ...value, preferOrganic: v })}
        />
      </div>
    </div>
  );
}

function IngredientChips({
  eyebrow,
  label,
  help,
  emptyHint,
  ingredients,
  selected,
  onToggle,
  translate,
}: {
  eyebrow: ReactNode;
  label: string;
  help: string;
  emptyHint: string;
  ingredients: { id: string }[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  translate: (id: string) => string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
          {eyebrow}
        </span>
        <SectionLabel className="mb-0">{label}</SectionLabel>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-muted-fg tabular-nums">
          {selected.size === 0 ? emptyHint : `${selected.size} / ${ingredients.length}`}
        </span>
      </div>
      <p className="text-xs text-muted-fg leading-relaxed">{help}</p>
      <div className="flex flex-wrap gap-2">
        {ingredients.map((i) => {
          const active = selected.has(i.id);
          return (
            <button
              key={i.id}
              type="button"
              onClick={() => onToggle(i.id)}
              aria-pressed={active}
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold',
                'min-h-[36px] border transition-colors',
                active
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'bg-surface-2 border-border text-muted-fg hover:text-foreground',
              )}
            >
              {translate(i.id)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SourcingFlag({
  label, help, checked, onChange,
}: {
  label: string;
  help?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-2 p-3 cursor-pointer min-h-[44px]">
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold text-foreground">{label}</span>
        {help && <span className="block text-[11px] text-muted-fg leading-snug mt-0.5">{help}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0" />
    </label>
  );
}
