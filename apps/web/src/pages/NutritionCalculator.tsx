import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Sparkles, Printer, Beef, Drumstick, Carrot, Fish, Wheat, Bone, Heart, Apple, Wind, Droplet } from 'lucide-react';
import {
  NutritionInputSchema, calculateNutrition,
  type NutritionInput, type NutritionResult,
  type MacroRatioProfile, type ComponentKey,
} from '@pawcook/shared';
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
import { Tooltip } from '../components/ui/tooltip';
import { cn } from '../lib/cn';

const STORAGE_KEY = 'pawcook_nutrition_input';
const DEFAULT_VALUES: NutritionInput = {
  weightKg: 20, age: 'adult', activityLevel: 'moderate', bodyCondition: 'ideal',
  reproductiveStatus: 'neutered', mealsPerDay: 2, macroProfile: 'balanced_cooked',
};

function loadSaved(): NutritionInput {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_VALUES, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return DEFAULT_VALUES;
}

const DIET_KEYS: MacroRatioProfile[] = ['balanced_cooked', 'high_protein', 'pmr', 'barf', 'real_ancestral'];

const DIET_META: Record<MacroRatioProfile, { emoji: string; label: string; sub: string }> = {
  balanced_cooked: { emoji: '⚖️', label: 'Balanced',       sub: '40 · 30 · 30' },
  high_protein:    { emoji: '💪', label: 'High protein',   sub: '55 · 30 · 15' },
  pmr:             { emoji: '🦴', label: 'PMR 80/10/10',   sub: 'Raw, ancestral' },
  barf:            { emoji: '🌿', label: 'BARF',           sub: 'Raw + veg' },
  real_ancestral:  { emoji: '🐺', label: 'Real ancestral', sub: 'Raw + seafood' },
};

const COMPONENT_META: Record<ComponentKey, { label: string; Icon: typeof Beef; color: string }> = {
  protein: { label: 'Protein',     Icon: Beef,     color: 'bg-primary' },
  muscle:  { label: 'Muscle meat', Icon: Beef,     color: 'bg-rose-500' },
  bone:    { label: 'Raw bone',    Icon: Bone,     color: 'bg-stone-300' },
  liver:   { label: 'Liver',       Icon: Droplet,  color: 'bg-rose-700' },
  organ:   { label: 'Organs',      Icon: Heart,    color: 'bg-fuchsia-500' },
  seafood: { label: 'Seafood',     Icon: Fish,     color: 'bg-cyan-500' },
  fiber:   { label: 'Animal fiber',Icon: Wind,     color: 'bg-lime-500' },
  veg:     { label: 'Vegetables',  Icon: Carrot,   color: 'bg-success' },
  seeds:   { label: 'Seeds & nuts',Icon: Drumstick,color: 'bg-amber-700' },
  fruit:   { label: 'Fruits',      Icon: Apple,    color: 'bg-pink-500' },
  starch:  { label: 'Starch',      Icon: Wheat,    color: 'bg-info' },
};

function AafcoBadge({ status }: { status: 'pass' | 'caution' | 'fail' }) {
  const map = {
    pass: { variant: 'success', label: 'AAFCO · pass' },
    caution: { variant: 'warning', label: 'AAFCO · caution' },
    fail: { variant: 'danger', label: 'AAFCO · fail' },
  } as const;
  const s = map[status];
  return <Badge variant={s.variant} className="text-[10px]">{s.label}</Badge>;
}

export default function NutritionCalculator() {
  const { t } = useTranslation();
  const [result, setResult] = useState<NutritionResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<NutritionInput>({
    resolver: zodResolver(NutritionInputSchema),
    defaultValues: loadSaved(),
  });

  const values = watch();
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); } catch { /* ignore */ }
  }, [values]);

  function onSubmit(data: NutritionInput) {
    setCalculating(true);
    setTimeout(() => {
      const r = calculateNutrition(data);
      setResult(r);
      setCalculating(false);
      if (r.aafcoStatus === 'pass') {
        toast.success(t('nutrition.toastPass', { defaultValue: 'Daily plan ready — AAFCO compliant.' }));
      } else if (r.aafcoStatus === 'caution') {
        toast.warning(t('nutrition.toastCaution', { defaultValue: 'Plan ready — review caution notes.' }));
      } else {
        toast.error(t('nutrition.toastFail', { defaultValue: 'Plan needs adjustment to meet AAFCO targets.' }));
      }
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }, 220);
  }

  return (
    <div className="space-y-7 sm:space-y-9">
      <PageHeader
        eyebrow={t('nutrition.eyebrow', { defaultValue: 'Nutrition' })}
        title={t('nutrition.title')}
        description={t('nutrition.subtitle')}
      />

      <Card padding="none" className="overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 sm:p-6 space-y-6">
          <SectionLabel>{t('nutrition.profileSection')}</SectionLabel>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('nutrition.weight')}
              type="number" step="0.1" inputMode="decimal"
              {...register('weightKg', { valueAsNumber: true })}
              error={errors.weightKg?.message}
            />
            <Select label={t('nutrition.age')} {...register('age')}>
              <option value="puppy">{t('nutrition.ages.puppy')}</option>
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
              type="number" min={1} max={4} inputMode="numeric"
              {...register('mealsPerDay', { valueAsNumber: true })}
            />
          </div>

          <SectionLabel>{t('nutrition.dietApproach')}</SectionLabel>

          <Controller
            control={control}
            name="macroProfile"
            render={({ field }) => (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {DIET_KEYS.map((key) => {
                  const meta = DIET_META[key];
                  const active = field.value === key;
                  return (
                    <button
                      key={key}
                      type="button"
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
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
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
            {calculating
              ? t('common.calculating')
              : <>
                  <Sparkles className="h-4 w-4" />
                  {t('common.calculate')}
                </>
            }
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
            <Card padding="none" variant="elevated" className="overflow-hidden print-card">
              <header className="flex items-start justify-between gap-3 p-5 border-b border-border">
                <div>
                  <h2 className="font-black text-lg tracking-tight">{t('nutrition.dailyPlan')}</h2>
                  <p className="text-xs text-muted-fg mt-1">
                    {t(`nutrition.dietShort.${result.dietProfile}`, { defaultValue: DIET_META[result.dietProfile].label })}
                    {' · '}
                    {t(`nutrition.dietSub.${result.dietProfile}`, { defaultValue: DIET_META[result.dietProfile].sub })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <AafcoBadge status={result.aafcoStatus} />
                  <Tooltip content={t('common.print', { defaultValue: 'Print' })}>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-2 hover:bg-surface-3 transition-colors no-print"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              </header>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5">
                <StatTile label={t('nutrition.dailyFood')} value={`${result.dailyFoodGrams.min}–${result.dailyFoodGrams.max}`} unit="g" tone="primary" delay={0.0} />
                <StatTile label={t('nutrition.perMeal')}   value={`${result.perMealGrams.min}–${result.perMealGrams.max}`}   unit="g" tone="primary" delay={0.05} />
                <StatTile label="DER (energy)" value={result.derKcal} unit="kcal" tone="warning" delay={0.10} />
                <StatTile label={t('nutrition.calciumNeeded')} value={result.calciumMg} unit="mg" tone="info" delay={0.15} />
              </div>

              <div className="px-5 pb-5">
                <Card variant="muted" padding="md" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-fg">
                      {t('nutrition.dietBreakdown', { defaultValue: 'Diet breakdown' })}
                    </p>
                    <span className="text-[10px] text-muted-fg font-semibold">per day</span>
                  </div>
                  <MacroBar
                    segments={result.components.map((c) => ({
                      key: c.key,
                      pct: c.pct,
                      color: COMPONENT_META[c.key].color,
                      label: `${COMPONENT_META[c.key].label}: ${Math.round(c.pct * 100)}%`,
                    }))}
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5 pt-1">
                    {result.components.map((c) => {
                      const meta = COMPONENT_META[c.key];
                      return (
                        <div key={c.key} className="flex items-center gap-2 text-xs">
                          <meta.Icon className="h-3.5 w-3.5 text-muted-fg" />
                          <span className="text-foreground truncate">{meta.label}</span>
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
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border text-xs">
                    <div><span className="text-muted-fg">Calcium:</span> <span className="font-mono font-bold">{result.calciumMg}mg</span></div>
                    <div><span className="text-muted-fg">Phosphorus:</span> <span className="font-mono font-bold">{result.phosphorusMg}mg</span></div>
                    <div><span className="text-muted-fg">Ω-3 target:</span> <span className="font-mono font-bold">{result.omega3Mg}mg</span></div>
                  </div>
                </Card>
              </div>

              {result.warnings.length > 0 && (
                <div className="px-5 pb-5">
                  <Card padding="md" className="bg-danger/5 border-danger/30">
                    <p className="text-[10px] font-black uppercase tracking-wider text-danger mb-2">
                      {t('nutrition.safetyGuardrails', { defaultValue: 'Safety guardrails' })}
                    </p>
                    {result.warnings.map((w, i) => (
                      <p key={i} className="text-sm text-foreground/90 flex gap-2 items-start leading-relaxed mt-1">
                        <span className="text-danger font-black shrink-0">!</span>{w}
                      </p>
                    ))}
                  </Card>
                </div>
              )}

              <div className="px-5 pb-5">
                <Card variant="muted" padding="md">
                  {result.notes.map((n, i) => (
                    <p key={i} className="text-sm text-foreground/90 flex gap-2 items-start leading-relaxed mt-1 first:mt-0">
                      <span className="text-primary font-black shrink-0">•</span>{n}
                    </p>
                  ))}
                </Card>
              </div>

              <p className="px-5 pb-5 text-xs text-muted-fg border-t border-border pt-4 leading-relaxed">
                ⚠️ {t('nutrition.vetDisclaimer')}
              </p>
            </Card>
          </motion.div>
        ) : (
          <EmptyState
            key="empty"
            icon={<Sparkles className="h-8 w-8" />}
            title={t('nutrition.placeholder')}
            description={t('nutrition.placeholderHint', { defaultValue: 'Enter your dog’s profile and tap Calculate.' })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
