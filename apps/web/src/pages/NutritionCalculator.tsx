import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { toast } from 'sonner';
import { useDebouncedEffect } from '../lib/use-debounced-effect';
import { blockBadNumberKeys } from '../lib/number-input';
import { Sparkles, Beef, Drumstick, Carrot, Fish, Wheat, Bone, Heart, Apple, Wind, Droplet, Info } from 'lucide-react';
import {
  NutritionInputSchema, calculateNutrition,
  type NutritionInput, type NutritionResult,
  type MacroRatioProfile, type ComponentKey, type AafcoStatus,
} from '@pawcook/shared';
import { useSpecies } from '../lib/species';
import { useSpeciesT } from '../lib/use-species-t';
import { PageHeader } from '../components/ui/page-header';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { SectionLabel } from '../components/ui/section-label';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group';
import { StatTile } from '../components/calculators/stat-tile';
import { MacroBar } from '../components/calculators/macro-bar';
import { CaPGauge } from '../components/calculators/ca-p-gauge';
import { EmptyState } from '../components/ui/empty-state';
import { DownloadMenu } from '../components/recipe/DownloadMenu';
import { Tooltip } from '../components/ui/tooltip';
import { useRecipeExport } from '../hooks/useRecipeExport';
import { cn } from '../lib/cn';

// Keys are tied to per-species storage so dog inputs and cat inputs
// don't overwrite each other.
const STORAGE_KEY = (species: 'dog' | 'cat') => `pawcook_nutrition_input_${species}`;

const DOG_DEFAULTS: NutritionInput = {
  species: 'dog',
  weightKg: 20, age: 'adult', activityLevel: 'moderate', bodyCondition: 'ideal',
  reproductiveStatus: 'neutered', mealsPerDay: 2, macroProfile: 'balanced_cooked',
};
const CAT_DEFAULTS: NutritionInput = {
  species: 'cat',
  weightKg: 4, age: 'adult', activityLevel: 'moderate', bodyCondition: 'ideal',
  reproductiveStatus: 'neutered', mealsPerDay: 2, macroProfile: 'cat_pmr',
};

function loadSaved(species: 'dog' | 'cat'): NutritionInput {
  const defaults = species === 'dog' ? DOG_DEFAULTS : CAT_DEFAULTS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY(species));
    if (!saved) return defaults;
    const parsed = JSON.parse(saved);
    if (parsed?.species !== species) return defaults;
    // Validate the full payload via Zod before trusting it. Shallow-merging
    // an arbitrary saved blob over defaults used to let an `age:'kitten'`
    // payload survive on the dog calculator (rendering an empty <select>),
    // or a `macroProfile:'cat_pmr'` payload survive on dog (no diet button
    // highlighted, calculator silently does nothing). safeParse drops the
    // whole blob if anything is incoherent — defaults always render.
    const result = NutritionInputSchema.safeParse({ ...defaults, ...parsed });
    return result.success ? result.data : defaults;
  } catch { return defaults; }
}

const DOG_DIET_KEYS = ['balanced_cooked', 'high_protein', 'pmr', 'barf', 'real_ancestral'] as const;
const CAT_DIET_KEYS = ['cat_pmr', 'cat_frankenprey', 'cat_barf_lite', 'cat_whole_prey', 'cat_cooked_carnivore'] as const;

const DIET_META: Record<MacroRatioProfile, { emoji: string; label: string; sub: string }> = {
  balanced_cooked: { emoji: '⚖️', label: 'Balanced',       sub: '40 · 30 · 30' },
  high_protein:    { emoji: '💪', label: 'High protein',   sub: '55 · 30 · 15' },
  pmr:             { emoji: '🦴', label: 'PMR 80/10/10',   sub: 'Raw, ancestral' },
  barf:            { emoji: '🌿', label: 'BARF',           sub: 'Raw + veg' },
  real_ancestral:  { emoji: '🐺', label: 'Real ancestral', sub: 'Raw + seafood' },
  // Custom is set on pet profiles, not the standalone calculator — falls back
  // to a generic label if a saved input happens to carry it.
  custom:          { emoji: '🛠️', label: 'Custom mix',     sub: 'Your own ratio' },
  // Cat profiles
  cat_pmr:              { emoji: '🦴', label: 'PMR 84/6/10',     sub: 'Prey model raw' },
  cat_frankenprey:      { emoji: '🥩', label: 'Frankenprey',     sub: 'Assembled raw cuts' },
  cat_whole_prey:       { emoji: '🐭', label: 'Whole prey',      sub: 'Mice, quail, chicks' },
  cat_barf_lite:        { emoji: '🌿', label: 'BARF-lite',       sub: 'Raw + small veg' },
  cat_cooked_carnivore: { emoji: '🍳', label: 'Cooked carnivore', sub: '+ taurine supplement' },
};

const COMPONENT_META: Record<ComponentKey, { Icon: typeof Beef; color: string }> = {
  protein: { Icon: Beef,     color: 'bg-primary' },
  muscle:  { Icon: Beef,     color: 'bg-rose-500' },
  bone:    { Icon: Bone,     color: 'bg-stone-300' },
  liver:   { Icon: Droplet,  color: 'bg-rose-700' },
  organ:   { Icon: Heart,    color: 'bg-fuchsia-500' },
  seafood: { Icon: Fish,     color: 'bg-cyan-500' },
  fiber:   { Icon: Wind,     color: 'bg-lime-500' },
  veg:     { Icon: Carrot,   color: 'bg-success' },
  seeds:   { Icon: Drumstick,color: 'bg-amber-700' },
  fruit:   { Icon: Apple,    color: 'bg-pink-500' },
  starch:  { Icon: Wheat,    color: 'bg-info' },
};

function AafcoBadge({ status }: { status: AafcoStatus }) {
  const { t } = useTranslation();
  const variant = status === 'pass' ? 'success' : status === 'caution' ? 'warning' : 'danger';
  return (
    <Badge variant={variant} className="text-[10px]">
      {t(`nutrition.aafco.${status}`)}
    </Badge>
  );
}

export default function NutritionCalculator() {
  const { t, i18n } = useTranslation();
  const tS = useSpeciesT();
  const { species } = useSpecies();
  const reduced = useReducedMotion();
  const [result, setResult] = useState<NutritionResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const { setTarget, downloadPdf, downloadImage, busy } = useRecipeExport();

  const exportConfig = result
    ? {
        prefix: species === 'cat' ? 'pawcook-cat-nutrition' : 'pawcook-dog-nutrition',
        parts: [result.dietProfile, `${result.dailyFoodGrams.min}-${result.dailyFoodGrams.max}g`],
        footer: t('nutrition.exportFooter', {
          defaultValue: 'PawCook — not veterinary advice. Consult your veterinarian before major diet changes.',
        }),
      }
    : null;

  const { register, handleSubmit, watch, control, reset, formState: { errors } } = useForm<NutritionInput>({
    resolver: zodResolver(NutritionInputSchema),
    mode: 'onBlur',
    defaultValues: loadSaved(species),
  });

  // Reset form when the user flips species in the top bar
  useEffect(() => {
    reset(loadSaved(species));
    setResult(null);
  }, [species, reset]);

  const values = watch();
  useDebouncedEffect(() => {
    try { localStorage.setItem(STORAGE_KEY(species), JSON.stringify(values)); } catch { /* ignore */ }
  }, [values, species], 300);

  const dietKeys = species === 'cat' ? CAT_DIET_KEYS : DOG_DIET_KEYS;
  const growthLabel = species === 'cat' ? t('nutrition.ages.kitten') : t('nutrition.ages.puppy');
  const growthValue: 'puppy' | 'kitten' = species === 'cat' ? 'kitten' : 'puppy';

  const timeouts = useRef<number[]>([]);
  useEffect(() => () => {
    for (const id of timeouts.current) window.clearTimeout(id);
    timeouts.current = [];
  }, []);

  function onSubmit(data: NutritionInput) {
    setCalculating(true);
    try {
      const r = calculateNutrition(data);
      const id1 = window.setTimeout(() => {
        setResult(r);
        setCalculating(false);
        if (r.aafcoStatus === 'pass') {
          toast.success(t('nutrition.toastPass', { defaultValue: 'Daily plan ready — AAFCO compliant.' }));
        } else if (r.aafcoStatus === 'caution') {
          toast.warning(t('nutrition.toastCaution', { defaultValue: 'Plan ready — review caution notes.' }));
        } else {
          toast.error(t('nutrition.toastFail', { defaultValue: 'Plan needs adjustment to meet AAFCO targets.' }));
        }
        const id2 = window.setTimeout(
          () => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
          60,
        );
        timeouts.current.push(id2);
      }, 220);
      timeouts.current.push(id1);
    } catch (err) {
      console.error(err);
      setCalculating(false);
      toast.error(t('common.calcFailed', { defaultValue: 'Could not calculate — please check inputs.' }));
    }
  }

  return (
    <div className="space-y-7 sm:space-y-9">
      <PageHeader
        eyebrow={t('nutrition.eyebrow', { defaultValue: 'Nutrition' })}
        title={t('nutrition.title')}
        description={tS('nutrition.subtitle')}
      />

      <Card padding="none" className="overflow-hidden">
        <form
          onSubmit={handleSubmit(onSubmit, () => {
            // Validation failure: drop any stale result + success toast so
            // the user doesn't see green "AAFCO compliant" next to a red
            // field error from a previous calculation.
            setResult(null);
            setCalculating(false);
          })}
          className="p-5 sm:p-6 space-y-6"
        >
          <SectionLabel>{tS('nutrition.profileSection')}</SectionLabel>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={tS('nutrition.weight')}
              type="number" step="0.1" min={0.1} max={100} inputMode="decimal"
              onKeyDown={blockBadNumberKeys}
              {...register('weightKg', { valueAsNumber: true })}
              error={errors.weightKg?.message}
            />
            <Select label={t('nutrition.age')} {...register('age')}>
              <option value={growthValue}>{growthLabel}</option>
              <option value="adult">{t('nutrition.ages.adult')}</option>
              <option value="senior">{t('nutrition.ages.senior')}</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="block text-[11px] font-bold text-muted-fg uppercase tracking-[0.1em]">
                {t('nutrition.activity')}
              </span>
              <Controller
                control={control}
                name="activityLevel"
                render={({ field }) => (
                  <ToggleGroup
                    type="single"
                    value={field.value}
                    onValueChange={(v) => v && field.onChange(v)}
                    aria-label={t('nutrition.activity')}
                    className="grid grid-cols-2 sm:grid-cols-4 w-full"
                  >
                    <ToggleGroupItem value="sedentary">{t('nutrition.activities.sedentary')}</ToggleGroupItem>
                    <ToggleGroupItem value="moderate">{t('nutrition.activities.moderate')}</ToggleGroupItem>
                    <ToggleGroupItem value="active">{t('nutrition.activities.active')}</ToggleGroupItem>
                    <ToggleGroupItem value="working">{t('nutrition.activities.working')}</ToggleGroupItem>
                  </ToggleGroup>
                )}
              />
            </div>
            <div className="space-y-2">
              <span className="block text-[11px] font-bold text-muted-fg uppercase tracking-[0.1em]">
                {t('nutrition.bodyCondition')}
              </span>
              <Controller
                control={control}
                name="bodyCondition"
                render={({ field }) => (
                  <ToggleGroup
                    type="single"
                    value={field.value}
                    onValueChange={(v) => v && field.onChange(v)}
                    aria-label={t('nutrition.bodyCondition')}
                    className="grid grid-cols-3 w-full"
                  >
                    <ToggleGroupItem value="underweight">{t('nutrition.conditions.underweight')}</ToggleGroupItem>
                    <ToggleGroupItem value="ideal">{t('nutrition.conditions.ideal')}</ToggleGroupItem>
                    <ToggleGroupItem value="overweight">{t('nutrition.conditions.overweight')}</ToggleGroupItem>
                  </ToggleGroup>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label={t('nutrition.reproStatus')} {...register('reproductiveStatus')}>
              <option value="neutered">{t('nutrition.reproStatuses.neutered')}</option>
              <option value="intact">{t('nutrition.reproStatuses.intact')}</option>
              <option value="pregnant">{t('nutrition.reproStatuses.pregnant')}</option>
              <option value="lactating">{t('nutrition.reproStatuses.lactating')}</option>
            </Select>
            <Input
              label={t('nutrition.mealsPerDay')}
              type="number" min={1} max={4} step={1} inputMode="numeric"
              onKeyDown={blockBadNumberKeys}
              {...register('mealsPerDay', { valueAsNumber: true })}
              error={errors.mealsPerDay?.message}
            />
          </div>

          <SectionLabel>{t('nutrition.dietApproach')}</SectionLabel>

          <Controller
            control={control}
            name="macroProfile"
            render={({ field }) => (
              <div
                role="radiogroup"
                aria-label={t('nutrition.dietApproach')}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2"
              >
                {dietKeys.map((key) => {
                  const meta = DIET_META[key];
                  const active = field.value === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => field.onChange(key)}
                      className={cn(
                        'relative flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border text-center',
                        'transition-all duration-200 active:scale-95 overflow-hidden',
                        active
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-surface-2 text-muted-fg hover:bg-surface-3 hover:text-foreground'
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId="diet-active"
                          className="absolute inset-0 -z-10 rounded-2xl bg-primary/5"
                          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="text-2xl">{meta.emoji}</span>
                      <span className="text-xs font-black leading-tight">
                        {t(`nutrition.dietShort.${key}`, { defaultValue: meta.label })}
                      </span>
                      <span className="text-[10px] text-muted-fg leading-tight">
                        {t(`nutrition.dietSub.${key}`, { defaultValue: meta.sub })}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          />

          <Button type="submit" variant="glow" size="lg" block loading={calculating}>
            {calculating ? (
              t('common.calculating')
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden />
                {t('common.calculate')}
              </>
            )}
          </Button>
        </form>
      </Card>

      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key="result"
            ref={resultRef}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
            className="scroll-mt-20"
          >
            <Card padding="none" variant="elevated" className="overflow-hidden print-card" ref={setTarget}>
              <header className="flex items-start justify-between gap-3 p-5 border-b border-border">
                <div>
                  <h2 className="font-black text-lg tracking-tight">{t('nutrition.dailyPlan')}</h2>
                  <p className="text-xs text-muted-fg mt-1">
                    {t(`nutrition.dietShort.${result.dietProfile}`, { defaultValue: DIET_META[result.dietProfile].label })}
                    {' · '}
                    {t(`nutrition.dietSub.${result.dietProfile}`, { defaultValue: DIET_META[result.dietProfile].sub })}
                  </p>
                  <p className="text-xs text-muted-fg mt-1.5 leading-relaxed">
                    {t('nutrition.result.planCaption', {
                      defaultValue: 'Here’s how much to feed each day and how the bowl breaks down. The badge shows whether it clears the standard minimums.',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <AafcoBadge status={result.aafcoStatus} />
                  <Tooltip content={t('nutrition.result.aafcoTooltip', {
                    defaultValue: "AAFCO = the US pet-nutrition standard. ‘Meets AAFCO’ means the plan clears the published minimums.",
                  })}>
                    <button
                      type="button"
                      aria-label={t('nutrition.result.aafcoTooltipLabel', { defaultValue: 'What does AAFCO mean?' })}
                      className="inline-flex items-center justify-center text-muted-fg hover:text-foreground transition-colors"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </Tooltip>
                  {exportConfig && (
                    <DownloadMenu
                      busy={busy}
                      onDownloadPdf={() => downloadPdf(exportConfig)}
                      onDownloadImage={() => downloadImage(exportConfig)}
                      onPrint={() => window.print()}
                    />
                  )}
                </div>
              </header>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5">
                <StatTile
                  label={t('nutrition.dailyFood')}
                  value={`${result.dailyFoodGrams.min.toLocaleString(i18n.language)}–${result.dailyFoodGrams.max.toLocaleString(i18n.language)}`}
                  unit="g" tone="primary" delay={0.0}
                />
                <StatTile
                  label={t('nutrition.perMeal')}
                  value={`${result.perMealGrams.min.toLocaleString(i18n.language)}–${result.perMealGrams.max.toLocaleString(i18n.language)}`}
                  unit="g" tone="primary" delay={0.05}
                />
                <StatTile
                  label={t('nutrition.result.derEnergy', { defaultValue: 'DER (energy)' })}
                  value={result.derKcal.toLocaleString(i18n.language)}
                  unit="kcal" tone="warning" delay={0.10}
                />
                <StatTile
                  label={t('nutrition.calciumNeeded')}
                  value={result.calciumMg.toLocaleString(i18n.language)}
                  unit="mg" tone="info" delay={0.15}
                />
              </div>

              <div className="px-5 pb-5">
                <Card variant="muted" padding="md" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-fg">
                      {t('nutrition.result.breakdown', { defaultValue: 'Diet breakdown' })}
                    </p>
                    <span className="text-[10px] text-muted-fg font-semibold">
                      {t('nutrition.result.perDay', { defaultValue: 'per day' })}
                    </span>
                  </div>
                  <MacroBar
                    segments={result.components.map((c) => ({
                      key: c.key,
                      pct: c.pct,
                      color: COMPONENT_META[c.key].color,
                      label: `${t(`nutrition.components.${c.key}`)}: ${Math.round(c.pct * 100)}%`,
                    }))}
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5 pt-1">
                    {result.components.map((c) => {
                      const meta = COMPONENT_META[c.key];
                      return (
                        <div key={c.key} className="flex items-center gap-2 text-xs">
                          <meta.Icon className="h-3.5 w-3.5 text-muted-fg" />
                          <span className="text-foreground truncate">{t(`nutrition.components.${c.key}`)}</span>
                          <span className="ml-auto font-mono font-bold text-muted-fg tabular-nums">{c.grams}g</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              <div className="px-5 pb-5">
                <Card variant="muted" padding="md">
                  <CaPGauge ratio={result.caPRatio} target={result.caPTarget} />
                  <p className="text-xs text-muted-fg mt-3 leading-relaxed">
                    {t('nutrition.result.caPExplain', {
                      defaultValue: 'Calcium-to-phosphorus ratio. Outside the safe band can cause bone problems over time — add a calcium source if it’s low, more muscle meat if it’s high.',
                    })}
                  </p>
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border text-xs">
                    <div>
                      <span className="text-muted-fg">{t('nutrition.result.calcium', { defaultValue: 'Calcium' })}:</span>{' '}
                      <span className="font-mono font-bold">{result.calciumMg}mg</span>
                    </div>
                    <div>
                      <span className="text-muted-fg">{t('nutrition.result.phosphorus', { defaultValue: 'Phosphorus' })}:</span>{' '}
                      <span className="font-mono font-bold">{result.phosphorusMg}mg</span>
                    </div>
                    <div>
                      <span className="text-muted-fg">{t('nutrition.result.omegaTargetPlain', { defaultValue: 'Omega-3 target' })}:</span>{' '}
                      <span className="font-mono font-bold">{result.omega3Mg}mg</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-fg mt-2 leading-relaxed">
                    {t('nutrition.result.omegaHelper', {
                      defaultValue: 'Aim for oily fish or a fish-oil supplement to hit this.',
                    })}
                  </p>
                </Card>
              </div>

              {result.warnings.length > 0 && (() => {
                // Reserve the alarming "Safety guardrails" red treatment for the
                // hard-fail state. Caution-level notes get a softer "Worth noting"
                // header so newcomers aren't alarmed by an informational nudge.
                const isFail = result.aafcoStatus === 'fail';
                return (
                  <div className="px-5 pb-5">
                    <Card padding="md" className={isFail ? 'bg-danger/5 border-danger/30' : 'bg-warning/5 border-warning/30'}>
                      <p className={cn(
                        'text-[10px] font-black uppercase tracking-wider mb-2',
                        isFail ? 'text-danger' : 'text-warning',
                      )}>
                        {isFail
                          ? t('nutrition.result.safetyGuardrails', { defaultValue: 'Safety guardrails' })
                          : t('nutrition.result.worthNoting', { defaultValue: 'Worth noting' })}
                      </p>
                      {result.warnings.map((w, i) => (
                        <p key={i} className="text-sm text-foreground/90 flex gap-2 items-start leading-relaxed mt-1">
                          <span className={cn('font-black shrink-0', isFail ? 'text-danger' : 'text-warning')} aria-hidden="true">!</span>
                          {t(`nutrition.warnings.${w.id}`, w.values)}
                        </p>
                      ))}
                    </Card>
                  </div>
                );
              })()}

              <div className="px-5 pb-5">
                <Card variant="muted" padding="md">
                  {result.notes.map((n, i) => (
                    <p key={i} className="text-sm text-foreground/90 flex gap-2 items-start leading-relaxed mt-1 first:mt-0">
                      <span className="text-primary font-black shrink-0" aria-hidden="true">•</span>
                      {t(`nutrition.notes.${n.id}`, n.values)}
                    </p>
                  ))}
                </Card>
              </div>

              <p className="px-5 pb-5 text-xs text-muted-fg border-t border-border pt-4 leading-relaxed">
                <span aria-hidden>⚠️</span> {t('nutrition.vetDisclaimer')}
              </p>
            </Card>
          </motion.div>
        ) : (
          <EmptyState
            key="empty"
            icon={<Sparkles className="h-8 w-8" />}
            title={tS('nutrition.placeholder')}
            description={tS('nutrition.placeholderHint')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
