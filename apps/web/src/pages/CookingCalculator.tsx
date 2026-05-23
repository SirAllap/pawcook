import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Flame, Printer, ChefHat, Snowflake, AlertTriangle, Clock, Thermometer } from 'lucide-react';
import { CookingInputSchema, type CookingInput, calculateCookingTime, type CookingResult } from '@pawcook/shared';
import { PageHeader } from '../components/ui/page-header';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { SectionLabel } from '../components/ui/section-label';
import { Tooltip } from '../components/ui/tooltip';
import { EmptyState } from '../components/ui/empty-state';
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
  const display = unit === 'fahrenheit' ? tempF : tempC;
  const max = unit === 'fahrenheit' ? 220 : 100;
  const pct = Math.min(1, display / max);
  const C = 2 * Math.PI * 56;
  return (
    <div className="relative h-40 w-40 sm:h-44 sm:w-44">
      <svg viewBox="0 0 144 144" className="absolute inset-0 -rotate-90">
        <circle cx="72" cy="72" r="56" fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
        <motion.circle
          cx="72" cy="72" r="56" fill="none" stroke="hsl(var(--primary))" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - pct) }}
          transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-4xl sm:text-5xl font-black text-foreground tabular-nums">{display}</span>
        <span className="text-xs font-bold text-muted-fg uppercase tracking-wider mt-1">
          °{unit === 'fahrenheit' ? 'F' : 'C'}
        </span>
      </div>
    </div>
  );
}

export default function CookingCalculator() {
  const { t } = useTranslation();
  const [result, setResult] = useState<CookingResult | null>(null);
  const [submittedData, setSubmittedData] = useState<CookingInput | null>(null);
  const [calculating, setCalculating] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CookingInput>({
    resolver: zodResolver(CookingInputSchema),
    defaultValues: loadSaved(),
  });

  const values = watch();
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); } catch { /* ignore */ }
  }, [values]);

  const isSousVide = values.cookingMethod === 'sous_vide';
  const totalKg = isSousVide
    ? (values.weightKg || 0) * (values.numberOfBags || 0)
    : (values.totalWeightKg || 0);
  const yieldPct = YIELD_PCT[values.cookingMethod] ?? 0.90;

  function onSubmit(data: CookingInput) {
    setCalculating(true);
    setTimeout(() => {
      setResult(calculateCookingTime(data));
      setSubmittedData(data);
      setCalculating(false);
      toast.success(t('cooking.toastReady', { defaultValue: 'Recipe ready.' }));
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }, 220);
  }

  return (
    <div className="space-y-7 sm:space-y-9">
      <PageHeader
        eyebrow={t('cooking.eyebrow', { defaultValue: 'Cooking' })}
        title={t('cooking.title')}
        description={t('cooking.subtitle')}
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
                    type="number" step="0.1" inputMode="decimal"
                    {...register('weightKg', { valueAsNumber: true })}
                    error={errors.weightKg?.message}
                  />
                  <Input
                    label={t('cooking.numberOfBags')}
                    type="number" inputMode="numeric"
                    {...register('numberOfBags', { valueAsNumber: true })}
                    error={errors.numberOfBags?.message}
                  />
                </div>
                <Input
                  label={t('cooking.thickness')}
                  type="number" step="0.5" inputMode="decimal"
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
                  type="number" step="0.1" inputMode="decimal"
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
            {calculating
              ? t('common.calculating')
              : <><Thermometer className="h-4 w-4" />{t('common.calculate')}</>
            }
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
            <Card padding="none" variant="elevated" className="overflow-hidden print-card">
              <header className="flex items-center justify-between gap-3 p-5 border-b border-border">
                <h2 className="font-black text-lg tracking-tight flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-primary" />
                  {t('cooking.recipeCard')}
                </h2>
                <Tooltip content={t('common.print')}>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-2 hover:bg-surface-3 transition-colors no-print"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                </Tooltip>
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
                  ].map((w, i) => (
                    <p key={i} className="text-sm text-foreground/90 flex gap-2 items-start leading-relaxed mt-1">
                      <span className="text-danger font-black shrink-0">!</span>{w}
                    </p>
                  ))}
                </Card>
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
