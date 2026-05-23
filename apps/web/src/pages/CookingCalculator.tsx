import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { toast } from 'sonner';
import { Flame, ChefHat, Snowflake, AlertTriangle, Clock, Thermometer, Sparkles } from 'lucide-react';
import { CookingInputSchema, type CookingInput, calculateCookingTime, type CookingResult } from '@pawcook/shared';
import { useSpecies } from '../lib/species';
import { useSpeciesT } from '../lib/use-species-t';
import { PageHeader } from '../components/ui/page-header';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { SectionLabel } from '../components/ui/section-label';
import { EmptyState } from '../components/ui/empty-state';
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
  sous_vide: 0.97, oven: 0.82, stovetop_low: 0.90, slow_cooker: 0.88,
};

function loadSaved(): CookingInput {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_VALUES, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return DEFAULT_VALUES;
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
  const { t } = useTranslation();
  const tS = useSpeciesT();
  const { species } = useSpecies();
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

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CookingInput>({
    resolver: zodResolver(CookingInputSchema),
    mode: 'onBlur',
    defaultValues: loadSaved(),
  });

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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('cooking.weightPerBag')}
                    type="number" step="0.1" min={0.05} max={20} inputMode="decimal"
                    onKeyDown={blockBadNumberKeys}
                    {...register('weightKg', { valueAsNumber: true })}
                    error={errors.weightKg?.message}
                  />
                  <Input
                    label={t('cooking.numberOfBags')}
                    type="number" min={1} max={50} step={1} inputMode="numeric"
                    onKeyDown={blockBadNumberKeys}
                    {...register('numberOfBags', { valueAsNumber: true })}
                    error={errors.numberOfBags?.message}
                  />
                </div>
                <Input
                  label={t('cooking.thickness')}
                  type="number" step="0.5" min={0.5} max={20} inputMode="decimal"
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
                  type="number" step="0.1" min={0.05} max={100} inputMode="decimal"
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
    </div>
  );
}
