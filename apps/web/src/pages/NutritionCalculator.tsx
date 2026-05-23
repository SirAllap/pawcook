import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
type TFunction = (key: string, opts?: Record<string, unknown>) => string;
import {
  NutritionInputSchema, calculateNutrition,
  type NutritionInput, type NutritionResult,
  type MacroRatioProfile, type ComponentKey, type AafcoStatus,
} from '@pawcook/shared';

const STORAGE_KEY = 'pawcook_nutrition_input';
const DEFAULT_VALUES: NutritionInput = {
  weightKg: 20, age: 'adult', activityLevel: 'moderate', bodyCondition: 'ideal',
  reproductiveStatus: 'neutered', mealsPerDay: 2, macroProfile: 'balanced_cooked',
};

function loadSavedValues(): NutritionInput {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_VALUES, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_VALUES;
}

const inputCls = 'w-full bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3.5 text-base text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-all appearance-none';
const labelCls = 'block text-[11px] font-bold text-gray-400/80 uppercase tracking-[0.10em] mb-2';

function SectionHead({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span className="text-[11px] font-black text-amber-500/90 uppercase tracking-[0.14em] whitespace-nowrap">{children}</span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}

const DIET_KEYS: MacroRatioProfile[] = ['balanced_cooked', 'high_protein', 'pmr', 'barf', 'real_ancestral'];
const DIET_EMOJIS: Record<MacroRatioProfile, string> = {
  balanced_cooked: '⚖️',
  high_protein:    '💪',
  pmr:             '🦴',
  barf:            '🌿',
  real_ancestral:  '🐺',
};

const COMPONENT_META: Record<ComponentKey, { emoji: string; color: string }> = {
  protein: { emoji: '🥩', color: 'from-amber-600 to-amber-400' },
  muscle:  { emoji: '🥩', color: 'from-red-700 to-red-500' },
  bone:    { emoji: '🦴', color: 'from-stone-400 to-stone-200' },
  liver:   { emoji: '🩸', color: 'from-rose-900 to-rose-700' },
  organ:   { emoji: '🫀', color: 'from-fuchsia-700 to-fuchsia-500' },
  seafood: { emoji: '🐟', color: 'from-cyan-600 to-cyan-400' },
  fiber:   { emoji: '🪶', color: 'from-lime-700 to-lime-500' },
  veg:     { emoji: '🥕', color: 'from-green-600 to-green-400' },
  seeds:   { emoji: '🌰', color: 'from-yellow-700 to-yellow-500' },
  fruit:   { emoji: '🍎', color: 'from-pink-600 to-pink-400' },
  starch:  { emoji: '🌾', color: 'from-blue-600 to-blue-400' },
};

function AafcoBadge({ status, t }: { status: AafcoStatus; t: TFunction }) {
  const style = status === 'pass'
    ? 'bg-green-500/15 text-green-300 border-green-500/30'
    : status === 'caution'
      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      : 'bg-red-500/15 text-red-300 border-red-500/30';
  const symbol = status === 'pass' ? '✓' : status === 'caution' ? '⚠' : '✗';
  return (
    <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border tracking-wide ${style}`}>
      {t(`nutrition.aafco.${status}`)} {symbol}
    </span>
  );
}

function CaPMeter({ ratio, target, t }: { ratio: number; target: { min: number; max: number }; t: TFunction }) {
  const max = 4;
  const pct = Math.min(100, Math.max(0, (ratio / max) * 100));
  const safeStart = (target.min / max) * 100;
  const safeEnd   = (target.max / max) * 100;
  const inRange = ratio >= target.min && ratio <= target.max;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('nutrition.result.caP')}</span>
        <span className={`text-lg font-black ${inRange ? 'text-green-300' : 'text-red-300'}`}>
          {ratio.toFixed(2)} : 1
        </span>
      </div>
      <div className="relative h-3 bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.06]">
        <div className="absolute inset-y-0 bg-green-500/15 border-x border-green-500/40"
          style={{ left: `${safeStart}%`, width: `${safeEnd - safeStart}%` }} />
        <div className={`absolute inset-y-0 w-1 ${inRange ? 'bg-green-400' : 'bg-red-400'} shadow-lg`}
          style={{ left: `calc(${pct}% - 2px)` }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-500 font-semibold">
        <span>0</span>
        <span className="text-green-400">{target.min}:1 ← {t('nutrition.result.safe')} → {target.max}:1</span>
        <span>4:1+</span>
      </div>
    </div>
  );
}

export default function NutritionCalculator() {
  const { t } = useTranslation();
  const [result, setResult] = useState<NutritionResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<NutritionInput>({
    resolver: zodResolver(NutritionInputSchema),
    defaultValues: loadSavedValues(),
  });

  const values = watch();
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); } catch {}
  }, [values]);

  function onSubmit(data: NutritionInput) {
    setCalculating(true);
    setTimeout(() => {
      setResult(calculateNutrition(data));
      setCalculating(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }, 200);
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-black text-white mb-1 tracking-tight">{t('nutrition.title')}</h1>
        <p className="text-gray-400 text-sm">{t('nutrition.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}
        className="glass-card rounded-3xl overflow-hidden animate-fade-in-up delay-100">
        <div className="p-5 space-y-5">

          <SectionHead>{t('nutrition.profileSection')}</SectionHead>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('nutrition.weight')}</label>
              <input type="number" step="0.1" inputMode="decimal"
                {...register('weightKg', { valueAsNumber: true })} className={inputCls} />
              {errors.weightKg && <p className="text-red-400 text-xs mt-1.5 font-medium">{errors.weightKg.message}</p>}
            </div>
            <div>
              <label className={labelCls}>{t('nutrition.age')}</label>
              <select {...register('age')} className={inputCls}>
                <option value="puppy">{t('nutrition.ages.puppy')}</option>
                <option value="adult">{t('nutrition.ages.adult')}</option>
                <option value="senior">{t('nutrition.ages.senior')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('nutrition.activity')}</label>
              <select {...register('activityLevel')} className={inputCls}>
                <option value="sedentary">{t('nutrition.activities.sedentary')}</option>
                <option value="moderate">{t('nutrition.activities.moderate')}</option>
                <option value="active">{t('nutrition.activities.active')}</option>
                <option value="working">{t('nutrition.activities.working')}</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('nutrition.bodyCondition')}</label>
              <select {...register('bodyCondition')} className={inputCls}>
                <option value="underweight">{t('nutrition.conditions.underweight')}</option>
                <option value="ideal">{t('nutrition.conditions.ideal')}</option>
                <option value="overweight">{t('nutrition.conditions.overweight')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('nutrition.reproStatus')}</label>
              <select {...register('reproductiveStatus')} className={inputCls}>
                <option value="neutered">{t('nutrition.reproStatuses.neutered')}</option>
                <option value="intact">{t('nutrition.reproStatuses.intact')}</option>
                <option value="pregnant">{t('nutrition.reproStatuses.pregnant')}</option>
                <option value="lactating">{t('nutrition.reproStatuses.lactating')}</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('nutrition.mealsPerDay')}</label>
              <input type="number" min="1" max="4" inputMode="numeric"
                {...register('mealsPerDay', { valueAsNumber: true })} className={inputCls} />
            </div>
          </div>

          <SectionHead>{t('nutrition.dietApproach')}</SectionHead>
          <Controller control={control} name="macroProfile"
            render={({ field }) => (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DIET_KEYS.map(key => (
                  <button key={key} type="button" onClick={() => field.onChange(key)}
                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border
                               transition-all active:scale-95 text-center overflow-hidden ${
                      field.value === key
                        ? 'bg-amber-500/12 border-amber-500/45 text-amber-300'
                        : 'bg-white/[0.04] border-white/[0.08] text-gray-400 hover:border-white/[0.14]'
                    }`}>
                    {field.value === key && (
                      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/8 to-transparent pointer-events-none" />
                    )}
                    <span className="text-[22px]">{DIET_EMOJIS[key]}</span>
                    <span className="text-xs font-black leading-tight">
                      {t(`nutrition.dietShort.${key}`)}
                    </span>
                    <span className="text-[10px] text-gray-500 leading-tight">
                      {t(`nutrition.dietSub.${key}`)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        <div className="px-5 pb-5">
          <button type="submit" disabled={calculating}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed
                      active:scale-[0.98] text-gray-900 font-black py-4 rounded-2xl text-base
                      transition-all glow-sm-amber flex items-center justify-center gap-2">
            {calculating ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span>{t('common.calculating')}</span>
              </>
            ) : <span>🐕 {t('common.calculate')}</span>}
          </button>
        </div>
      </form>

      {result && (
        <div ref={resultRef}
          className="animate-spring-in glass-card rounded-3xl overflow-hidden scroll-mt-20">
          <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] flex items-start justify-between gap-3">
            <div>
              <h2 className="font-black text-lg text-white tracking-tight">📊 {t('nutrition.dailyPlan')}</h2>
              <p className="text-xs text-gray-500 mt-1">
                {t(`nutrition.dietShort.${result.dietProfile}`)}
                {' · '}
                {t(`nutrition.dietSub.${result.dietProfile}`)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <AafcoBadge status={result.aafcoStatus} t={t} />
              <button type="button" onClick={() => window.print()}
                className="hidden sm:inline-block text-[11px] font-bold px-2.5 py-1 rounded-full
                          border border-white/[0.10] text-gray-300 hover:bg-white/[0.06] transition-all no-print">
                🖨 {t('nutrition.result.vetPdf')}
              </button>
            </div>
          </div>

          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              { emoji: '🍽️', label: t('nutrition.dailyFood'),       value: `${result.dailyFoodGrams.min}–${result.dailyFoodGrams.max} g` },
              { emoji: '🥣', label: t('nutrition.perMeal'),          value: `${result.perMealGrams.min}–${result.perMealGrams.max} g` },
              { emoji: '🔥', label: t('nutrition.result.derEnergy'), value: `${result.derKcal} kcal` },
              { emoji: '🦴', label: t('nutrition.calciumNeeded'),    value: `~${result.calciumMg} mg` },
            ].map(({ emoji, label, value }, i) => (
              <div key={label}
                className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 text-center animate-slide-up"
                style={{ animationDelay: `${i * 55}ms` }}>
                <div className="text-2xl mb-1.5">{emoji}</div>
                <p className="text-[11px] text-gray-400 font-semibold mb-1.5 leading-tight">{label}</p>
                <p className="text-base font-black text-amber-300 leading-tight">{value}</p>
              </div>
            ))}
          </div>

          {/* Component breakdown */}
          <div className="px-5 pb-4">
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('nutrition.result.breakdown')}</span>
                <span className="text-[10px] text-gray-500 font-semibold">{t('nutrition.result.perDay')}</span>
              </div>
              <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
                {result.components.map((c, idx) => {
                  const meta = COMPONENT_META[c.key];
                  const first = idx === 0;
                  const last = idx === result.components.length - 1;
                  return (
                    <div key={c.key}
                      className={`bg-gradient-to-r ${meta.color} transition-all duration-700`}
                      style={{
                        width: `${c.pct * 100}%`,
                        borderRadius: first ? '9999px 0 0 9999px' : last ? '0 9999px 9999px 0' : '0',
                      }}
                      title={`${t(`nutrition.components.${c.key}`)}: ${(c.pct * 100).toFixed(0)}%`} />
                  );
                })}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {result.components.map(c => {
                  const meta = COMPONENT_META[c.key];
                  return (
                    <div key={c.key} className="flex items-center gap-1.5 text-[11px] font-semibold">
                      <span className="text-base">{meta.emoji}</span>
                      <span className="text-gray-300 truncate">{t(`nutrition.components.${c.key}`)}</span>
                      <span className="text-gray-500 ml-auto whitespace-nowrap">{c.grams} g</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ca:P ratio */}
          <div className="px-5 pb-4">
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4">
              <CaPMeter ratio={result.caPRatio} target={result.caPTarget} t={t} />
              <div className="flex justify-between text-[11px] text-gray-500 mt-3 pt-3 border-t border-white/[0.05]">
                <span><span className="text-gray-400 font-semibold">{t('nutrition.result.calcium')}:</span> {result.calciumMg} mg</span>
                <span><span className="text-gray-400 font-semibold">{t('nutrition.result.phosphorus')}:</span> {result.phosphorusMg} mg</span>
                <span><span className="text-gray-400 font-semibold">{t('nutrition.result.omegaTarget')}:</span> {result.omega3Mg} mg</span>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="px-5 pb-4">
              <div className="bg-red-500/[0.06] border border-red-500/30 rounded-2xl p-4 space-y-2">
                <p className="text-[11px] font-black text-red-300 uppercase tracking-wider">⚠ {t('nutrition.result.safetyGuardrails')}</p>
                {result.warnings.map((w, i) => (
                  <p key={i} className="text-sm text-red-200/90 flex gap-2 items-start leading-relaxed">
                    <span className="text-red-400 shrink-0 font-black">•</span>
                    {t(`nutrition.warnings.${w.id}`, w.values ?? {})}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Calculation notes */}
          <div className="px-5 pb-4">
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4 space-y-2">
              {result.notes.map((n, i) => (
                <p key={i} className="text-sm text-gray-300 flex gap-2 items-start">
                  <span className="text-amber-500 shrink-0 font-black">•</span>
                  {t(`nutrition.notes.${n.id}`, n.values ?? {})}
                </p>
              ))}
            </div>
          </div>

          <div className="px-5 pb-5">
            <p className="text-xs text-gray-600 border-t border-white/[0.05] pt-3 leading-relaxed">
              ⚠️ {t('nutrition.vetDisclaimer')}
            </p>
          </div>
        </div>
      )}

      {!result && (
        <div className="text-center py-12 text-gray-600 animate-fade-in">
          <div className="text-5xl mb-4 animate-float">🐕</div>
          <p className="text-sm">{t('nutrition.placeholder')} <strong className="text-gray-500">{t('common.calculate')}</strong></p>
        </div>
      )}
    </div>
  );
}
