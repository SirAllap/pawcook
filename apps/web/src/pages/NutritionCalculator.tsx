import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useRef } from 'react';
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

const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all appearance-none';
const labelCls = 'block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5';

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-xs font-bold text-amber-500 uppercase tracking-widest whitespace-nowrap">{children}</span>
      <div className="flex-1 h-px bg-gray-800" />
    </div>
  );
}

const DIET_KEYS = ['balanced_cooked', 'high_protein', 'pmr'] as const;
const DIET_EMOJIS: Record<string, string> = {
  balanced_cooked: '⚖️',
  high_protein: '💪',
  pmr: '🦴',
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
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">{t('nutrition.title')}</h1>
        <p className="text-gray-400 text-sm">{t('nutrition.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-900 rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
        <div className="p-5 space-y-5">

          <SectionHead>{t('nutrition.profileSection')}</SectionHead>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('nutrition.weight')}</label>
              <input type="number" step="0.1" inputMode="decimal" {...register('weightKg', { valueAsNumber: true })} className={inputCls} />
              {errors.weightKg && <p className="text-red-400 text-xs mt-1">{errors.weightKg.message}</p>}
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
              <input type="number" min="1" max="4" inputMode="numeric" {...register('mealsPerDay', { valueAsNumber: true })} className={inputCls} />
            </div>
          </div>

          <SectionHead>{t('nutrition.dietApproach')}</SectionHead>
          <Controller
            control={control}
            name="macroProfile"
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-2">
                {DIET_KEYS.map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => field.onChange(key)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all active:scale-95 text-center ${
                      field.value === key
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <span className="text-2xl">{DIET_EMOJIS[key]}</span>
                    <span className="text-xs font-bold leading-tight">{t(`nutrition.dietShort.${key}`)}</span>
                    <span className="text-[10px] text-gray-500 leading-tight">{t(`nutrition.dietSub.${key}`)}</span>
                  </button>
                ))}
              </div>
            )}
          />

          <div className="space-y-1.5">
            <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 transition-all duration-500 rounded-l-full" style={{ width: `${proteinPct}%` }} />
              <div className="bg-green-500 transition-all duration-500" style={{ width: `${vegPct}%` }} />
              <div className="bg-blue-500 transition-all duration-500 rounded-r-full" style={{ width: `${starchPct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500">
              <span className="text-amber-400">🥩 {proteinPct}% {t('nutrition.macroProtein')}</span>
              <span className="text-green-400">🥕 {vegPct}% {t('nutrition.macroVeg')}</span>
              <span className="text-blue-400">🌾 {starchPct}% {t('nutrition.macroStarch')}</span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button type="submit" disabled={calculating}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] text-gray-900 font-bold py-4 rounded-xl text-base transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2">
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
        <div ref={resultRef} className="animate-fade-in-up bg-gray-900 rounded-2xl border border-gray-800 shadow-xl overflow-hidden scroll-mt-20">
          <div className="px-5 pt-5 pb-4 border-b border-gray-800">
            <h2 className="font-bold text-lg text-white">📊 {t('nutrition.dailyPlan')}</h2>
          </div>

          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              { emoji: '🍽️', label: t('nutrition.dailyFood'), value: `${result.dailyFoodGrams.min}–${result.dailyFoodGrams.max} g` },
              { emoji: '🥣', label: t('nutrition.perMeal'),   value: `${result.perMealGrams.min}–${result.perMealGrams.max} g` },
              { emoji: '🥩', label: t('nutrition.protein'),   value: `~${result.macros.proteinG} g` },
              { emoji: '🥕', label: t('nutrition.vegetables'),value: `~${result.macros.vegG} g` },
              { emoji: '🦴', label: t('nutrition.calciumNeeded'), value: `~${result.calciumMg} mg` },
              { emoji: '🐟', label: t('nutrition.omega3Target'),  value: `~${result.omega3Mg} mg` },
            ].map(({ emoji, label, value }) => (
              <div key={label} className="bg-gray-800 rounded-xl p-3.5 text-center">
                <div className="text-xl mb-1">{emoji}</div>
                <p className="text-[11px] text-gray-400 font-medium mb-1">{label}</p>
                <p className="text-base font-bold text-amber-300 leading-tight">{value}</p>
              </div>
            ))}
          </div>

          <div className="px-5 pb-4">
            <div className="bg-gray-800 rounded-xl p-4 space-y-1.5">
              {result.notes.map((n, i) => (
                <p key={i} className="text-sm text-gray-300 flex gap-2 items-start">
                  <span className="text-amber-500 shrink-0">•</span>{n}
                </p>
              ))}
            </div>
          </div>

          <div className="px-5 pb-5">
            <p className="text-xs text-gray-600 border-t border-gray-800 pt-3 leading-relaxed">
              ⚠️ {t('nutrition.vetDisclaimer')}
            </p>
          </div>
        </div>
      )}

      {!result && (
        <div className="text-center py-10 text-gray-600 animate-fade-in">
          <div className="text-5xl mb-3">🐕</div>
          <p className="text-sm">{t('nutrition.placeholder')} <strong className="text-gray-500">{t('common.calculate')}</strong></p>
        </div>
      )}
    </div>
  );
}
