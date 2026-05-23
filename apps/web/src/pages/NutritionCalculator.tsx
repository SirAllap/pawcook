import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { NutritionInputSchema, type NutritionInput, calculateNutrition, type NutritionResult } from '@pawcook/shared';

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

const DIET_KEYS = ['balanced_cooked', 'high_protein', 'pmr'] as const;
const DIET_EMOJIS: Record<string, string> = {
  balanced_cooked: '⚖️', high_protein: '💪', pmr: '🦴',
};

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

  const macroProfile = values.macroProfile;
  const proteinPct = macroProfile === 'balanced_cooked' ? 40 : macroProfile === 'high_protein' ? 50 : 80;
  const vegPct     = macroProfile === 'balanced_cooked' ? 50 : macroProfile === 'high_protein' ? 30 : 10;
  const starchPct  = 100 - proteinPct - vegPct;

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
              <div className="grid grid-cols-3 gap-2">
                {DIET_KEYS.map(key => (
                  <button key={key} type="button" onClick={() => field.onChange(key)}
                    className={`relative flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border
                               transition-all active:scale-95 text-center overflow-hidden ${
                      field.value === key
                        ? 'bg-amber-500/12 border-amber-500/45 text-amber-300'
                        : 'bg-white/[0.04] border-white/[0.08] text-gray-400 hover:border-white/[0.14]'
                    }`}>
                    {field.value === key && (
                      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/8 to-transparent pointer-events-none" />
                    )}
                    <span className="text-[22px]">{DIET_EMOJIS[key]}</span>
                    <span className="text-xs font-black leading-tight">{t(`nutrition.dietShort.${key}`)}</span>
                    <span className="text-[10px] text-gray-500 leading-tight">{t(`nutrition.dietSub.${key}`)}</span>
                  </button>
                ))}
              </div>
            )}
          />

          {/* Macro bar */}
          <div className="space-y-2">
            <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
              <div className="bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-700"
                style={{ width: `${proteinPct}%`, borderRadius: '9999px 0 0 9999px' }} />
              <div className="bg-gradient-to-r from-green-600 to-green-400 transition-all duration-700"
                style={{ width: `${vegPct}%` }} />
              <div className="bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700"
                style={{ width: `${starchPct}%`, borderRadius: '0 9999px 9999px 0' }} />
            </div>
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-amber-400">🥩 {proteinPct}% {t('nutrition.macroProtein')}</span>
              <span className="text-green-400">🥕 {vegPct}% {t('nutrition.macroVeg')}</span>
              <span className="text-blue-400">🌾 {starchPct}% {t('nutrition.macroStarch')}</span>
            </div>
          </div>
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
          <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
            <h2 className="font-black text-lg text-white tracking-tight">📊 {t('nutrition.dailyPlan')}</h2>
          </div>

          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              { emoji: '🍽️', label: t('nutrition.dailyFood'),      value: `${result.dailyFoodGrams.min}–${result.dailyFoodGrams.max} g` },
              { emoji: '🥣', label: t('nutrition.perMeal'),         value: `${result.perMealGrams.min}–${result.perMealGrams.max} g` },
              { emoji: '🥩', label: t('nutrition.protein'),         value: `~${result.macros.proteinG} g` },
              { emoji: '🥕', label: t('nutrition.vegetables'),      value: `~${result.macros.vegG} g` },
              { emoji: '🦴', label: t('nutrition.calciumNeeded'),   value: `~${result.calciumMg} mg` },
              { emoji: '🐟', label: t('nutrition.omega3Target'),    value: `~${result.omega3Mg} mg` },
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

          <div className="px-5 pb-4">
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4 space-y-2">
              {result.notes.map((n, i) => (
                <p key={i} className="text-sm text-gray-300 flex gap-2 items-start">
                  <span className="text-amber-500 shrink-0 font-black">•</span>{n}
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
