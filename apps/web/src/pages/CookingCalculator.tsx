import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { toast } from 'sonner';
import { Flame, ChefHat, Snowflake, AlertTriangle, Clock, Thermometer, Sparkles, ClipboardList, X, Info } from 'lucide-react';
import {
  CookingInputSchema, type CookingInput,
  calculateCookingTime, type CookingResult,
  MeatTypeSchema, CookingMethodSchema,
  type CookingMethod,
} from '@pawcook/shared';
import vegCookingData from '@pawcook/data/vegetable-cooking';
import { useSpecies } from '../lib/species';
import { useSpeciesT } from '../lib/use-species-t';
import { consumePendingCookingPrefill, setPendingCookingPrefill, buildPrefillHash } from '../lib/cooking-prefill-bridge';
import { useMealPlans } from '../contexts/MealPlansContext';
import { PageHeader } from '../components/ui/page-header';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { SectionLabel } from '../components/ui/section-label';
import { EmptyState } from '../components/ui/empty-state';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group';
import { DownloadMenu } from '../components/recipe/DownloadMenu';
import { useRecipeExport } from '../hooks/useRecipeExport';
import { useDebouncedEffect } from '../lib/use-debounced-effect';
import { blockBadNumberKeys } from '../lib/number-input';
import { cn } from '../lib/cn';

const STORAGE_KEY = 'pawcook_cooking_input';

const DEFAULT_VALUES: CookingInput = {
  meatType: 'beef', form: 'minced', cookingMethod: 'sous_vide', fatContent: 'medium',
  temperatureUnit: 'celsius',
  weightKg: 1, numberOfBags: 1, thicknessCm: 5,
  totalWeightKg: 1,
};

const MEAT_KEYS = ['beef','chicken','turkey','lamb','pork','duck','rabbit','venison','salmon','mackerel','sardines','whitefish'] as const;

const YIELD_PCT: Record<string, number> = {
  sous_vide: 0.97, oven: 0.82, stovetop_low: 0.90, slow_cooker: 0.88, pressure_cooker: 0.91,
};

function loadSaved(): CookingInput {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_VALUES, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return DEFAULT_VALUES;
}

/**
 * Payload accepted via router state when the user taps "Cook this" from a
 * meal plan. Only fields that make sense to carry over are picked — we
 * never overwrite the user's preferred temperature unit. The caller can
 * also tell us how many pets share the batch and how many days the plan
 * covers; we use those to surface a bag-splitting strategy for sous-vide.
 */
export type CookingPrefill = {
  meatType?: CookingInput['meatType'];
  totalWeightKg?: number;
  planName?: string;
  petCount?: number;
  feedingDays?: number;
  cookingMethod?: CookingInput['cookingMethod'];
  /**
   * Plan ID the prefill came from. When set, CookingCalculator looks the
   * plan up via MealPlansContext and renders an in-page meat switcher so
   * the user can jump between proteins without going back to the shopping
   * list. Optional; legacy URLs without it still work.
   */
  planId?: string;
};

// Default refrigerator life of a cooked, sealed bag. Three days is the
// FDA-safe ceiling for cooked meats stored at ≤4 °C; we surface "use within
// 2 days" copy because users open and re-seal the bag.
const FRIDGE_SAFE_DAYS = 3;
const DEFAULT_DAYS_PER_BAG = 2;

function applyPrefill(base: CookingInput, prefill?: CookingPrefill): CookingInput {
  if (!prefill) return base;
  const merged = { ...base };
  const parsedMeat = MeatTypeSchema.safeParse(prefill.meatType);
  if (parsedMeat.success) merged.meatType = parsedMeat.data;
  const parsedMethod = CookingMethodSchema.safeParse(prefill.cookingMethod);
  if (parsedMethod.success) merged.cookingMethod = parsedMethod.data;
  if (typeof prefill.totalWeightKg === 'number' && Number.isFinite(prefill.totalWeightKg)) {
    // Cap to the schema max so router payloads can't bypass validation.
    merged.totalWeightKg = Math.min(30, Math.max(0.1, prefill.totalWeightKg));
    // Seed sous-vide bag fields too so switching methods doesn't lose the
    // prefilled total. We assume DEFAULT_DAYS_PER_BAG; the user can tune
    // it via the bag-strategy panel.
    if (prefill.feedingDays && prefill.feedingDays > 0) {
      const bagCount = Math.max(1, Math.ceil(prefill.feedingDays / DEFAULT_DAYS_PER_BAG));
      const weightPerBag = Math.min(5, Math.max(0.1, merged.totalWeightKg / bagCount));
      merged.numberOfBags = Math.min(20, bagCount);
      merged.weightKg = Math.round(weightPerBag * 100) / 100;
    }
  }
  return merged;
}

function TempDial({ tempC, tempF, unit }: { tempC: number; tempF: number; unit: 'celsius' | 'fahrenheit' }) {
  const reduced = useReducedMotion();
  const display = unit === 'fahrenheit' ? tempF : tempC;
  const max = unit === 'fahrenheit' ? 220 : 100;
  const pct = Math.min(1, display / max);
  const C = 2 * Math.PI * 56;
  const unitLabel = `°${unit === 'fahrenheit' ? 'F' : 'C'}`;
  return (
    <div
      className="relative h-40 w-40 sm:h-44 sm:w-44"
      role="img"
      aria-label={`${display}${unitLabel}`}
    >
      <svg viewBox="0 0 144 144" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="72" cy="72" r="56" fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
        <motion.circle
          cx="72" cy="72" r="56" fill="none" stroke="hsl(var(--primary))" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={C}
          initial={reduced ? { strokeDashoffset: C * (1 - pct) } : { strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - pct) }}
          transition={{ duration: reduced ? 0 : 1.2, ease: [0.32, 0.72, 0, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-4xl sm:text-5xl font-black text-foreground tabular-nums">{display}</span>
        <span className="text-xs font-bold text-muted-fg uppercase tracking-wider mt-1">
          {unitLabel}
        </span>
      </div>
    </div>
  );
}


export default function CookingCalculator() {
  const { t, i18n } = useTranslation();
  const tS = useSpeciesT();
  const { species } = useSpecies();
  const location = useLocation();
  const navigate = useNavigate();
  const { getPlan } = useMealPlans();
  // useRef so consumePrefill only runs once per mount (StrictMode-safe
  // because React 18 may run the initializer twice; we just memo it).
  const prefillRef = useRef<CookingPrefill | null | undefined>(undefined);
  if (prefillRef.current === undefined) {
    prefillRef.current = consumePendingCookingPrefill(location.hash);
  }
  const prefill = prefillRef.current;
  const [prefillBanner, setPrefillBanner] = useState<CookingPrefill | null>(prefill ?? null);
  const [result, setResult] = useState<CookingResult | null>(null);
  const [submittedData, setSubmittedData] = useState<CookingInput | null>(null);
  const [calculating, setCalculating] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const { setTarget, downloadPdf, downloadImage, busy } = useRecipeExport();

  const exportConfig = submittedData
    ? {
        prefix: 'pawcook-cooking',
        parts: [submittedData.meatType, submittedData.cookingMethod],
        footer: t('cooking.exportFooter', {
          defaultValue: 'PawCook — not veterinary advice. Use a meat thermometer to verify safe internal temperature.',
        }),
      }
    : null;

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<CookingInput>({
    resolver: zodResolver(CookingInputSchema),
    mode: 'onBlur',
    defaultValues: applyPrefill(loadSaved(), prefill ?? undefined),
  });

  // If the user was already on /cooking and tapped another "Cook" button
  // from the shopping list, ShoppingListView wrote a new prefill into
  // localStorage and then navigate() bumped location.key. Read-and-apply
  // here so the form rebinds without needing a remount.
  useEffect(() => {
    const fresh = consumePendingCookingPrefill(location.hash);
    if (!fresh) return;
    reset(applyPrefill(loadSaved(), fresh));
    setPrefillBanner(fresh);
    setResult(null);
    setSubmittedData(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const values = watch();
  useDebouncedEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); } catch { /* ignore */ }
  }, [values], 300);

  const isSousVide = values.cookingMethod === 'sous_vide';
  const totalKg = isSousVide
    ? (values.weightKg || 0) * (values.numberOfBags || 0)
    : (values.totalWeightKg || 0);
  const yieldPct = YIELD_PCT[values.cookingMethod] ?? 0.90;

  const timeouts = useRef<number[]>([]);
  useEffect(() => () => {
    for (const id of timeouts.current) window.clearTimeout(id);
    timeouts.current = [];
  }, []);

  function onSubmit(data: CookingInput) {
    setCalculating(true);
    try {
      const result = calculateCookingTime(data);
      const id1 = window.setTimeout(() => {
        setResult(result);
        setSubmittedData(data);
        setCalculating(false);
        toast.success(t('cooking.toastReady', { defaultValue: 'Recipe ready.' }));
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
        eyebrow={t('cooking.eyebrow', { defaultValue: 'Cooking' })}
        title={t('cooking.title')}
        description={tS('cooking.subtitle')}
      />

      {prefillBanner && (
        <Card
          padding="md"
          className="border-l-[3px] border-l-primary bg-primary/5 flex items-start gap-3"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary shrink-0">
            <ClipboardList className="h-4 w-4" aria-hidden />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-primary">
              {t('cooking.prefilledFromPlan', { defaultValue: 'Pre-filled from your plan' })}
            </p>
            <p className="text-sm text-foreground/90 mt-0.5 leading-relaxed">
              {t('cooking.prefilledHelp', {
                defaultValue: 'We carried over the meat and total weight from “{{plan}}”. Tweak anything before calculating.',
                plan: prefillBanner.planName ?? t('cooking.prefilledPlanFallback', { defaultValue: 'your plan' }),
              })}
            </p>
            {/* Concrete echo of what the URL/state actually delivered. If
               this shows the right values, the wire works — only the form
               below would be at fault. If it shows wrong values, the wire
               itself broke (cache, state-strip, etc). */}
            <ul className="flex flex-wrap gap-1.5 mt-2 text-[11px] font-mono tabular-nums">
              {prefillBanner.meatType && (
                <li className="rounded-md bg-primary/10 text-primary px-2 py-0.5 font-bold">
                  {t(`cooking.meats.${prefillBanner.meatType}`, { defaultValue: prefillBanner.meatType })}
                </li>
              )}
              {prefillBanner.totalWeightKg != null && (
                <li className="rounded-md bg-primary/10 text-primary px-2 py-0.5 font-bold">
                  {prefillBanner.totalWeightKg.toLocaleString(i18n.language, { maximumFractionDigits: 2 })} kg
                </li>
              )}
              {prefillBanner.cookingMethod && (
                <li className="rounded-md bg-primary/10 text-primary px-2 py-0.5 font-bold">
                  {t(`cooking.methods.${prefillBanner.cookingMethod}`, { defaultValue: prefillBanner.cookingMethod })}
                </li>
              )}
              {prefillBanner.petCount != null && (
                <li className="rounded-md bg-surface-2 text-muted-fg px-2 py-0.5">
                  {prefillBanner.petCount} {t('cooking.prefilledPetsShort', { defaultValue: 'pets' })}
                </li>
              )}
              {prefillBanner.feedingDays != null && (
                <li className="rounded-md bg-surface-2 text-muted-fg px-2 py-0.5">
                  {prefillBanner.feedingDays} {t('cooking.prefilledDaysShort', { defaultValue: 'days' })}
                </li>
              )}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => setPrefillBanner(null)}
            aria-label={t('common.dismiss', { defaultValue: 'Dismiss' })}
            title={t('common.dismiss', { defaultValue: 'Dismiss' })}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-fg hover:bg-surface-2 hover:text-foreground transition-colors shrink-0"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </Card>
      )}

      {prefillBanner?.planId && (
        <PlanMeatSwitcher
          planId={prefillBanner.planId}
          activeMeat={prefillBanner.meatType}
          getPlan={getPlan}
          onPick={(next) => {
            setPendingCookingPrefill(next);
            navigate(`/cooking#${buildPrefillHash(next)}`);
          }}
        />
      )}

      <Card padding="none" className="overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 sm:p-6 space-y-6">
          <SectionLabel>{t('cooking.meatType')}</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label={t('cooking.meatType')} {...register('meatType')}>
              {MEAT_KEYS.map((key) => (
                <option key={key} value={key}>{t(`cooking.meats.${key}`)}</option>
              ))}
            </Select>
            <Select label={t('cooking.form')} {...register('form')}>
              <option value="minced">{t('cooking.forms.minced')}</option>
              <option value="cubed">{t('cooking.forms.cubed')}</option>
              <option value="whole_cut">{t('cooking.forms.whole_cut')}</option>
              <option value="fillet">{t('cooking.forms.fillet')}</option>
            </Select>
          </div>

          <SectionLabel>{t('cooking.method')}</SectionLabel>
          <Select label={t('cooking.method')} {...register('cookingMethod')}>
            <option value="sous_vide">🛁 {t('cooking.methods.sous_vide')}</option>
            <option value="oven">🍲 {t('cooking.methods.oven')}</option>
            <option value="stovetop_low">🫕 {t('cooking.methods.stovetop_low')}</option>
            <option value="slow_cooker">🥘 {t('cooking.methods.slow_cooker')}</option>
            <option value="pressure_cooker">⏲️ {t('cooking.methods.pressure_cooker')}</option>
          </Select>

          <AnimatePresence mode="wait">
            {isSousVide ? (
              <motion.div
                key="sous"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {prefillBanner?.feedingDays && prefillBanner.totalWeightKg ? (
                  <BagStrategyPanel
                    totalWeightKg={prefillBanner.totalWeightKg}
                    feedingDays={prefillBanner.feedingDays}
                    petCount={prefillBanner.petCount ?? 1}
                    onApply={({ bagSizeKg, bagCount }) => {
                      setValue('weightKg',     bagSizeKg, { shouldDirty: true });
                      setValue('numberOfBags', bagCount,  { shouldDirty: true });
                    }}
                  />
                ) : null}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('cooking.weightPerBag')}
                    type="number" step="0.1" min={0.1} max={5} inputMode="decimal"
                    onKeyDown={blockBadNumberKeys}
                    {...register('weightKg', { valueAsNumber: true })}
                    error={errors.weightKg?.message}
                  />
                  <Input
                    label={t('cooking.numberOfBags')}
                    type="number" min={1} max={20} step={1} inputMode="numeric"
                    onKeyDown={blockBadNumberKeys}
                    {...register('numberOfBags', { valueAsNumber: true })}
                    error={errors.numberOfBags?.message}
                  />
                </div>
                <Input
                  label={t('cooking.thickness')}
                  type="number" step="0.5" min={1} max={10} inputMode="decimal"
                  onKeyDown={blockBadNumberKeys}
                  {...register('thicknessCm', { valueAsNumber: true })}
                  error={errors.thicknessCm?.message}
                />
              </motion.div>
            ) : (
              <motion.div
                key="other"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <Input
                  label={t('cooking.totalWeight')}
                  type="number" step="0.1" min={0.1} max={30} inputMode="decimal"
                  onKeyDown={blockBadNumberKeys}
                  {...register('totalWeightKg', { valueAsNumber: true })}
                  error={errors.totalWeightKg?.message}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {totalKg > 0 && (
            <div className="flex items-center gap-2.5 bg-primary/8 border border-primary/30 rounded-2xl px-4 py-3">
              <Flame className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm text-foreground/90 font-medium">
                {t('cooking.total')}: <strong className="font-mono">{totalKg.toFixed(1)} kg</strong>
                {' · '}{t('cooking.yield')} ≈ <strong className="font-mono">{(totalKg * yieldPct).toFixed(1)} kg</strong> {t('cooking.cooked')} ({Math.round(yieldPct * 100)}%)
              </p>
            </div>
          )}

          <SectionLabel>{t('cooking.optionsSection')}</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label={t('cooking.fatContent')} {...register('fatContent')}>
              <option value="lean">{t('cooking.fat.lean')}</option>
              <option value="medium">{t('cooking.fat.medium')}</option>
              <option value="fatty">{t('cooking.fat.fatty')}</option>
            </Select>
            <Select label={t('cooking.tempUnit')} {...register('temperatureUnit')}>
              <option value="celsius">{t('cooking.units.celsius')}</option>
              <option value="fahrenheit">{t('cooking.units.fahrenheit')}</option>
            </Select>
          </div>

          <Button type="submit" variant="glow" size="lg" block loading={calculating}>
            {calculating ? (
              t('common.calculating')
            ) : (
              <>
                <Thermometer className="h-4 w-4" aria-hidden />
                {t('common.calculate')}
              </>
            )}
          </Button>
        </form>
      </Card>

      <AnimatePresence mode="wait">
        {result && submittedData ? (
          <motion.div
            key="recipe"
            ref={resultRef}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
            className="scroll-mt-20"
          >
            <Card padding="none" variant="elevated" className="overflow-hidden print-card" ref={setTarget}>
              <header className="flex items-center justify-between gap-3 p-5 border-b border-border">
                <h2 className="font-black text-lg tracking-tight flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-primary" />
                  {t('cooking.recipeCard')}
                </h2>
                {exportConfig && (
                  <DownloadMenu
                    busy={busy}
                    onDownloadPdf={() => downloadPdf(exportConfig)}
                    onDownloadImage={() => downloadImage(exportConfig)}
                    onPrint={() => window.print()}
                  />
                )}
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-center p-6 border-b border-border">
                <div className="flex justify-center">
                  <TempDial
                    tempC={result.safeInternalTempC}
                    tempF={result.safeInternalTempF}
                    unit={submittedData.temperatureUnit}
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <div className="rounded-2xl border border-border bg-surface-2 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-fg flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {t('cooking.cookingTime')}
                    </p>
                    <p className="font-mono text-3xl sm:text-4xl font-black text-info mt-2 tabular-nums">
                      {result.cookingTimeMinutes.min}–{result.cookingTimeMinutes.max}
                      <span className="text-base text-muted-fg ml-2">{t('cooking.minutes')}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <Card variant="muted" padding="md">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-fg mb-2">
                    {t('cooking.instructionsSection')}
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {t(`cooking.instr.${submittedData.cookingMethod}`)}
                  </p>
                </Card>

                <Card padding="md" className="bg-success/5 border-success/30">
                  <p className="text-[10px] font-black uppercase tracking-wider text-success mb-2 flex items-center gap-1.5">
                    <Snowflake className="h-3 w-3" />
                    {t('cooking.storage')}
                  </p>
                  {(['refrigerated', 'frozen', 'cooling'] as const).map((k) => (
                    <p key={k} className="text-sm text-foreground/90 flex gap-2 items-start leading-relaxed mt-1">
                      <span className="text-success font-bold shrink-0">✓</span>
                      {t(`cooking.store.${k}`)}
                    </p>
                  ))}
                </Card>

                <Card padding="md" className="bg-danger/5 border-danger/30">
                  <p className="text-[10px] font-black uppercase tracking-wider text-danger mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3" />
                    {t('cooking.warnings')}
                  </p>
                  {[
                    t('cooking.warn.noBones'),
                    t('cooking.warn.thermometer'),
                    ...(submittedData.meatType === 'pork'   ? [t('cooking.warn.pork')]   : []),
                    ...(submittedData.meatType === 'salmon' ? [t('cooking.warn.salmon')] : []),
                    ...(species === 'cat' && ['salmon', 'whitefish', 'mackerel'].includes(submittedData.meatType)
                      ? [t('cooking.warn.catThiaminase')]
                      : []),
                  ].map((w, i) => (
                    <p key={i} className="text-sm text-foreground/90 flex gap-2 items-start leading-relaxed mt-1">
                      <span className="text-danger font-black shrink-0">!</span>{w}
                    </p>
                  ))}
                </Card>

                {species === 'cat' && (
                  <Card padding="md" className="bg-primary/5 border-primary/30">
                    <p className="text-[10px] font-black uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" />
                      {t('cooking.catSupplementsTitle')}
                    </p>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {t('cooking.catSupplementsBody')}
                    </p>
                  </Card>
                )}
              </div>
            </Card>
          </motion.div>
        ) : (
          <EmptyState
            key="empty"
            icon={<ChefHat className="h-8 w-8" />}
            title={t('cooking.placeholder')}
            description={t('cooking.placeholderHint', { defaultValue: 'Choose a meat and method, then tap Calculate.' })}
            className={cn('')}
          />
        )}
      </AnimatePresence>

      <VegCookingGuide unit={values.temperatureUnit} meatMethod={values.cookingMethod} />
    </div>
  );
}

/**
 * Helper for sous-vide users coming from a meal plan. The plan tells us
 * how much meat we're cooking and how many days it needs to last; we use
 * those to suggest a batch split (cook once, fridge one bag, freeze the
 * rest). The user picks `daysPerBag` and we round both values to safe
 * schema bounds before pushing them into the form.
 */
/**
 * Horizontal chip row that lists every meat (chef-eligible protein) from
 * the plan that triggered this prefill. Tapping a chip re-fires the same
 * prefill flow with that meat selected — no need to back out to the
 * shopping list to switch.
 *
 * Quietly renders nothing if the plan can't be found (deleted, different
 * device, etc.) or if there's only one meat to choose from.
 */
function PlanMeatSwitcher({
  planId, activeMeat, getPlan, onPick,
}: {
  planId: string;
  activeMeat?: CookingInput['meatType'];
  getPlan: (id: string) => import('@pawcook/shared').MealPlan | undefined;
  onPick: (next: CookingPrefill) => void;
}) {
  const { t, i18n } = useTranslation();
  const plan = getPlan(planId);

  // Collect all chef-eligible meats from the plan's shopping list (the
  // same set of items that would surface a Cook button in ShoppingListView).
  const items = useMemo(() => {
    if (!plan) return [];
    type Row = { meatType: CookingInput['meatType']; totalGrams: number; petCount: number };
    const out: Row[] = [];
    for (const section of plan.shoppingList.sections) {
      for (const item of section.items) {
        const meat = MeatTypeSchema.safeParse(item.ingredientId);
        if (!meat.success) continue;
        out.push({
          meatType: meat.data,
          totalGrams: item.totalGrams,
          petCount: item.forPetIds.length,
        });
      }
    }
    return out;
  }, [plan]);

  if (!plan || items.length < 2) return null;

  return (
    <Card padding="none" variant="muted" className="overflow-hidden">
      <p className="px-4 pt-3 text-[10px] font-black uppercase tracking-wider text-muted-fg">
        {t('cooking.meatSwitcher.label', { defaultValue: 'Cook a different meat from this plan' })}
      </p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar p-3">
        {items.map((row) => {
          const isActive = row.meatType === activeMeat;
          return (
            <button
              key={row.meatType}
              type="button"
              onClick={() => onPick({
                meatType: row.meatType,
                totalWeightKg: Math.max(0.1, Math.min(30, row.totalGrams / 1000)),
                planName: plan.name,
                petCount: row.petCount,
                feedingDays: plan.durationDays,
                cookingMethod: plan.sourcing.preferredCookingMethod,
                planId: plan.id,
              })}
              aria-pressed={isActive}
              className={cn(
                'shrink-0 inline-flex flex-col items-start gap-0.5 rounded-2xl px-3.5 py-2 min-h-[44px]',
                'border transition-colors',
                isActive
                  ? 'bg-primary text-primary-fg border-primary'
                  : 'bg-surface border-border text-foreground hover:bg-surface-2',
              )}
            >
              <span className="text-sm font-black">
                {t(`cooking.meats.${row.meatType}`, { defaultValue: row.meatType })}
              </span>
              <span
                className={cn(
                  'text-[10px] font-mono tabular-nums',
                  isActive ? 'text-primary-fg/80' : 'text-muted-fg',
                )}
              >
                {(row.totalGrams / 1000).toLocaleString(i18n.language, { maximumFractionDigits: 2 })} kg
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function BagStrategyPanel({
  totalWeightKg, feedingDays, petCount, onApply,
}: {
  totalWeightKg: number;
  feedingDays: number;
  petCount: number;
  onApply: (next: { bagSizeKg: number; bagCount: number }) => void;
}) {
  const { t, i18n } = useTranslation();
  const [daysPerBag, setDaysPerBag] = useState<number>(
    Math.min(DEFAULT_DAYS_PER_BAG, Math.max(1, feedingDays)),
  );

  // The form values that drop out of "I want X days per bag" — rounded to
  // values the schema will accept (numberOfBags 1-20, weightKg 0.1-5).
  const { bagCount, bagSizeKg } = useMemo(() => {
    const safeDays = Math.max(1, Math.min(feedingDays, daysPerBag));
    const rawBagCount = Math.max(1, Math.ceil(feedingDays / safeDays));
    const count = Math.min(20, rawBagCount);
    const size = Math.min(5, Math.max(0.1, totalWeightKg / count));
    return { bagCount: count, bagSizeKg: Math.round(size * 100) / 100 };
  }, [feedingDays, daysPerBag, totalWeightKg]);

  // Whenever the user nudges daysPerBag, push the computed values back into
  // the parent form so the standard inputs stay in sync.
  useEffect(() => {
    onApply({ bagSizeKg, bagCount });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bagSizeKg, bagCount]);

  const fmt = (n: number) => n.toLocaleString(i18n.language);
  const maxDays = Math.min(FRIDGE_SAFE_DAYS, feedingDays);

  return (
    <Card padding="md" variant="muted" className="space-y-3 border-primary/30 bg-primary/5">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Snowflake className="h-3.5 w-3.5" aria-hidden />
        </span>
        <p className="text-[11px] font-black uppercase tracking-wider text-primary">
          {t('cooking.bagStrategy.title', { defaultValue: 'Bag strategy' })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
        <div>
          <label htmlFor="bag-days" className="block text-[11px] font-bold text-muted-fg uppercase tracking-[0.1em] mb-1.5">
            {t('cooking.bagStrategy.daysPerBag', { defaultValue: 'Days each cooked bag covers' })}
          </label>
          <input
            id="bag-days"
            type="range"
            min={1}
            max={maxDays}
            step={1}
            value={daysPerBag}
            onChange={(e) => setDaysPerBag(Math.max(1, Math.min(maxDays, Number(e.target.value))))}
            className="w-full accent-primary"
            aria-valuetext={t('cooking.bagStrategy.daysAria', {
              defaultValue: '{{n}} days per bag',
              n: daysPerBag,
            })}
          />
          <div className="flex justify-between text-[10px] font-mono text-muted-fg mt-1">
            <span>1 {t('cooking.bagStrategy.day', { defaultValue: 'day' })}</span>
            <span className="font-bold text-foreground">
              {daysPerBag} {daysPerBag === 1
                ? t('cooking.bagStrategy.day', { defaultValue: 'day' })
                : t('cooking.bagStrategy.days', { defaultValue: 'days' })}
            </span>
            <span>{maxDays} {t('cooking.bagStrategy.days', { defaultValue: 'days' })}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-fg">
            {t('cooking.bagStrategy.result', { defaultValue: 'Split' })}
          </p>
          <p className="font-mono text-lg font-black text-foreground tabular-nums">
            {fmt(bagCount)} × {fmt(bagSizeKg)} kg
          </p>
        </div>
      </div>

      <p className="text-xs text-foreground/90 leading-relaxed">
        {t('cooking.bagStrategy.help', {
          defaultValue: 'Feeds {{pets}} pet(s) for {{days}} days total. After cooking, keep 1 bag in the fridge (use within {{fridge}} days) and freeze the other {{frozen}}. Thaw a bag overnight before serving.',
          pets: petCount,
          days: feedingDays,
          fridge: FRIDGE_SAFE_DAYS,
          frozen: Math.max(0, bagCount - 1),
        })}
      </p>
    </Card>
  );
}

type RecMethod = 'steam' | 'bake' | 'blanch' | 'raw' | 'boil';
type MethodSpec = {
  tempC: number;
  minutes: { min: number; max: number };
  notes?: string;
  warning?: string;
};
type VegEntry = {
  id: string;
  recommendedMethod: RecMethod;
  recommendedTempC: number;
  recommendedMinutes: { min: number; max: number };
  recommendedNotes: string;
  recommendedReason: string;
  speciesNotes?: { cat?: string; dog?: string };
  rawBlocked?: boolean;
  rawBlockedReason?: string;
  cookingBlocked?: boolean;
  cookingBlockedReason?: string;
  methods: Partial<Record<CookingMethod, MethodSpec | null>>;
};

const VEG_COOKING = vegCookingData as VegEntry[];

const VEG_GUIDE_STORAGE_KEY = 'pawcook_veg_guide_method';
const VEG_METHOD_OPTIONS: CookingMethod[] = ['sous_vide', 'oven', 'stovetop_low', 'slow_cooker', 'pressure_cooker'];
const VEG_METHOD_EMOJI: Record<CookingMethod, string> = {
  sous_vide: '🛁',
  oven: '🍲',
  stovetop_low: '🫕',
  slow_cooker: '🥘',
  pressure_cooker: '⏲️',
};

function isMethodSpec(v: MethodSpec | null | undefined): v is MethodSpec {
  return v != null && typeof v === 'object';
}

function VegCookingGuide({
  unit,
  meatMethod,
}: {
  unit: 'celsius' | 'fahrenheit';
  meatMethod: CookingMethod;
}) {
  const { t, i18n } = useTranslation();
  const { species } = useSpecies();
  const [selected, setSelected] = useState<CookingMethod>(() => {
    if (typeof window === 'undefined') return meatMethod;
    const stored = window.localStorage.getItem(VEG_GUIDE_STORAGE_KEY);
    if (stored && (VEG_METHOD_OPTIONS as string[]).includes(stored)) {
      return stored as CookingMethod;
    }
    return meatMethod;
  });
  const userHasChosen = useRef<boolean>(
    typeof window !== 'undefined' && window.localStorage.getItem(VEG_GUIDE_STORAGE_KEY) != null,
  );

  // Mirror the meat method until the user explicitly picks one for the veg guide.
  useEffect(() => {
    if (!userHasChosen.current) setSelected(meatMethod);
  }, [meatMethod]);

  const onMethodChange = (next: string) => {
    if (!next) return;
    const m = next as CookingMethod;
    setSelected(m);
    userHasChosen.current = true;
    try { window.localStorage.setItem(VEG_GUIDE_STORAGE_KEY, m); } catch { /* ignore */ }
  };

  const fmt = (n: number) => n.toLocaleString(i18n.language);
  const fmtTemp = (c: number) => {
    if (c <= 0) return '—';
    if (unit === 'fahrenheit') return `${fmt(Math.round(c * 9 / 5 + 32))} °F`;
    return `${fmt(c)} °C`;
  };
  const fmtMinutes = (m: { min: number; max: number }) =>
    m.max === 0
      ? t('cooking.vegMethod.raw', { defaultValue: 'raw' })
      : `${fmt(m.min)}–${fmt(m.max)} ${t('cooking.minutes', { defaultValue: 'min' })}`;

  // The bath-temperature warning — show only when the user picked sous-vide
  // AND the meat side is also on sous-vide at a different (typically lower)
  // temperature. The meat bath runs at 74 °C; vegetables need ≥85 °C.
  const showBathWarning = selected === 'sous_vide';

  return (
    <Card padding="none" variant="elevated" className="overflow-hidden">
      <header className="flex items-start gap-3 px-5 py-4 border-b border-border">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-black text-base tracking-tight">
            {t('cooking.veggieGuideTitle', { defaultValue: 'Vegetable cooking guide' })}
          </h2>
          <p className="text-xs text-muted-fg mt-0.5 leading-relaxed">
            {t('cooking.vegGuide.help', {
              defaultValue: 'Pick the appliance you actually use — we translate the recommendation to your method and tell you when something needs a different approach.',
            })}
          </p>
        </div>
      </header>

      <div className="px-5 py-3 border-b border-border bg-surface-2/40">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-fg mb-2">
          {t('cooking.vegGuide.selectorLabel', { defaultValue: 'Cook them like:' })}
        </p>
        <ToggleGroup
          type="single"
          value={selected}
          onValueChange={onMethodChange}
          aria-label={t('cooking.vegGuide.selectorLabel', { defaultValue: 'Cook them like:' })}
          className="grid grid-cols-5 w-full gap-0.5"
        >
          {VEG_METHOD_OPTIONS.map((opt) => (
            <ToggleGroupItem
              key={opt}
              value={opt}
              aria-label={t(`cooking.methods.${opt}`)}
              className="flex-col gap-0.5 px-1 py-2 text-[10px] leading-tight"
            >
              <span aria-hidden className="text-base">{VEG_METHOD_EMOJI[opt]}</span>
              <span className="truncate w-full text-center">{t(`cooking.methods.${opt}`)}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {showBathWarning && (
          <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-foreground/80">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-warning" aria-hidden />
            <span>
              {t('cooking.vegGuide.sousVideBathNote', {
                defaultValue: 'Vegetables need a hotter bath than meat. Cook them first at 85 °C, then drop the temperature for your protein — one appliance, two stages.',
              })}
            </span>
          </p>
        )}
      </div>

      <ul className="divide-y divide-border/60">
        {VEG_COOKING.map((v) => (
          <VegGuideRow
            key={v.id}
            entry={v}
            selectedMethod={selected}
            species={species}
            fmtTemp={fmtTemp}
            fmtMinutes={fmtMinutes}
          />
        ))}
      </ul>
    </Card>
  );
}

function VegGuideRow({
  entry,
  selectedMethod,
  species,
  fmtTemp,
  fmtMinutes,
}: {
  entry: VegEntry;
  selectedMethod: CookingMethod;
  species: 'dog' | 'cat';
  fmtTemp: (c: number) => string;
  fmtMinutes: (m: { min: number; max: number }) => string;
}) {
  const { t } = useTranslation();

  // Resolve what to display in the row.
  // 1. Cucumber (cookingBlocked) — always show recommended (raw), with explainer.
  // 2. methods[selectedMethod] is a valid spec → use it.
  // 3. methods[selectedMethod] is null → silent fallback to recommended, amber explainer.
  const spec = entry.methods?.[selectedMethod];
  const isCookingBlocked = entry.cookingBlocked === true;
  const useOverride = !isCookingBlocked && isMethodSpec(spec);
  const fellBack = !isCookingBlocked && !useOverride;

  const displayMethodLabel = useOverride
    ? t(`cooking.methods.${selectedMethod}`)
    : t(`cooking.vegMethod.${entry.recommendedMethod}`, { defaultValue: entry.recommendedMethod });
  const displayTempC = useOverride ? spec!.tempC : entry.recommendedTempC;
  const displayMinutes = useOverride ? spec!.minutes : entry.recommendedMinutes;

  const recI18nKey = `cooking.vegMethod.${entry.recommendedMethod}`;
  const recLabel = t(recI18nKey, { defaultValue: entry.recommendedMethod });

  // Appliances and recommended techniques are disjoint enums — any
  // active override is by definition different from the recommendation.
  const showRecCitation = useOverride;

  const noteText = useOverride && spec!.notes ? spec!.notes : entry.recommendedNotes;
  const warningText = useOverride ? spec!.warning : undefined;
  const speciesNote = species === 'cat' ? entry.speciesNotes?.cat : entry.speciesNotes?.dog;

  const fallbackReason = fellBack
    ? t('cooking.vegGuide.fellBackTo', {
        defaultValue: 'kept as {{method}} — {{appliance}} not suitable for this veg',
        method: recLabel,
        appliance: t(`cooking.methods.${selectedMethod}`),
      })
    : null;

  const blockedReason = isCookingBlocked
    ? t(`cooking.vegGuide.cookingBlocked.${entry.id}`, {
        defaultValue: entry.cookingBlockedReason ?? 'Cooking not recommended for this item.',
      })
    : null;

  return (
    <li
      className={cn(
        'px-5 py-3 flex items-start gap-3',
        fellBack && 'border-l-2 border-l-warning/60',
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-foreground">
          {t(`vegData.${entry.id}.label`, { defaultValue: entry.id })}
        </p>
        <p className="text-xs text-muted-fg mt-0.5 leading-relaxed">
          {noteText}
        </p>
        {warningText && (
          <p className="text-[11px] text-warning mt-1 leading-relaxed flex items-start gap-1">
            <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" aria-hidden />
            <span>{warningText}</span>
          </p>
        )}
        {fallbackReason && (
          <p className="text-[11px] text-warning mt-1 leading-relaxed flex items-start gap-1">
            <Info className="h-3 w-3 mt-0.5 shrink-0" aria-hidden />
            <span>{fallbackReason}</span>
          </p>
        )}
        {blockedReason && (
          <p className="text-[11px] text-muted-fg mt-1 leading-relaxed flex items-start gap-1">
            <Info className="h-3 w-3 mt-0.5 shrink-0" aria-hidden />
            <span>{blockedReason}</span>
          </p>
        )}
        {speciesNote && (
          <p className="text-[11px] text-foreground/70 mt-1 leading-relaxed italic">
            {speciesNote}
          </p>
        )}
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1 min-w-[6.5rem]">
        <span
          className="inline-flex items-center gap-1 rounded-full bg-surface-2 border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground"
          aria-label={
            showRecCitation
              ? t('cooking.vegGuide.pillAria', {
                  defaultValue: 'Showing {{active}}; recommended method is {{recommended}}',
                  active: displayMethodLabel,
                  recommended: recLabel,
                })
              : undefined
          }
        >
          {displayMethodLabel}
        </span>
        <span className="text-xs font-mono font-bold tabular-nums text-foreground">
          {fmtTemp(displayTempC)}
        </span>
        <span className="text-[11px] font-mono tabular-nums text-muted-fg">
          {fmtMinutes(displayMinutes)}
        </span>
        {showRecCitation && (
          <span
            className="text-[10px] text-muted-fg leading-tight text-right"
            title={entry.recommendedReason}
          >
            {t('cooking.vegGuide.recCaption', {
              defaultValue: 'rec: {{method}}',
              method: recLabel,
            })}
          </span>
        )}
      </div>
    </li>
  );
}
