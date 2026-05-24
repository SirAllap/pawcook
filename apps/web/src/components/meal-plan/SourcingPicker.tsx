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
const METHOD_OPTIONS: CookingMethod[] = ['sous_vide', 'oven', 'stovetop_low', 'slow_cooker'];
const METHOD_EMOJI: Record<CookingMethod, string> = {
  sous_vide: '🛁',
  oven: '🍲',
  stovetop_low: '🫕',
  slow_cooker: '🥘',
};

export function SourcingPicker({
  value,
  onChange,
  species,
}: {
  value: SourcingPrefs;
  onChange: (next: SourcingPrefs) => void;
  /**
   * Used to scope the ingredient picker chips. The planner already filters
   * by species per pet, but if a wizard only has dogs, showing cat-only
   * proteins as picks would be confusing.
   */
  species: Species;
}) {
  const { t } = useTranslation();
  const translateIngredient = useTranslateIngredient();

  const meats = useMemo(() => getMeatIngredients(species), [species]);
  const veggies = useMemo(() => getVegIngredients(species), [species]);

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
          className="grid grid-cols-2 sm:grid-cols-4 w-full"
        >
          {METHOD_OPTIONS.map((opt) => (
            <ToggleGroupItem key={opt} value={opt} aria-label={t(`cooking.methods.${opt}`)}>
              <span aria-hidden>{METHOD_EMOJI[opt]}</span>
              <span className="truncate">{t(`cooking.methods.${opt}`)}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

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
          label={t('mealPlan.sourcing.includeOrgans', { defaultValue: 'Include organ meats (liver, kidney, spleen)' })}
          help={t('mealPlan.sourcing.includeOrgansHelp', {
            defaultValue: 'Off = no organs in the shopping list. Heads up: raw-style diets rely on organs for vitamin A and (for cats) taurine.',
          })}
          checked={value.includeOrgans}
          onChange={(v) => onChange({ ...value, includeOrgans: v })}
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
