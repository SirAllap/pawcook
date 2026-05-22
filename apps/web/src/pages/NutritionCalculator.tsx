import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NutritionInputSchema, type NutritionInput, calculateNutrition, type NutritionResult } from '@pawcook/shared';

const STORAGE_KEY = 'pawcook_nutrition_input';

const DEFAULT_VALUES: NutritionInput = {
  weightKg: 20,
  age: 'adult',
  activityLevel: 'moderate',
  bodyCondition: 'ideal',
  reproductiveStatus: 'neutered',
  mealsPerDay: 2,
  macroProfile: 'balanced_cooked',
};

function loadSavedValues(): NutritionInput {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_VALUES, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_VALUES;
}

export default function NutritionCalculator() {
  const { t } = useTranslation();
  const [result, setResult] = useState<NutritionResult | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<NutritionInput>({
    resolver: zodResolver(NutritionInputSchema),
    defaultValues: loadSavedValues(),
  });

  const values = watch();
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); } catch {}
  }, [values]);

  function onSubmit(data: NutritionInput) {
    setResult(calculateNutrition(data));
  }

  const inputClass = 'w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all';
  const labelClass = 'block text-sm font-medium text-gray-300 mb-1.5';
  const fieldClass = 'space-y-0';

  return (
    <div>
      <h1 className="text-2xl font-bold text-amber-400 mb-1">{t('nutrition.title')}</h1>
      <p className="text-gray-400 text-sm mb-6">{t('nutrition.subtitle')}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-900 rounded-2xl border border-gray-800 shadow-lg overflow-hidden">
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className={fieldClass}>
                <label className={labelClass}>{t('nutrition.weight')}</label>
                <input type="number" step="0.1" {...register('weightKg', { valueAsNumber: true })} className={inputClass} />
                {errors.weightKg && <p className="text-red-400 text-xs mt-1">{errors.weightKg.message}</p>}
              </div>
              <div className={fieldClass}>
                <label className={labelClass}>{t('nutrition.age')}</label>
                <select {...register('age')} className={inputClass}>
                  <option value="puppy">{t('nutrition.ages.puppy')}</option>
                  <option value="adult">{t('nutrition.ages.adult')}</option>
                  <option value="senior">{t('nutrition.ages.senior')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={fieldClass}>
                <label className={labelClass}>{t('nutrition.activity')}</label>
                <select {...register('activityLevel')} className={inputClass}>
                  <option value="sedentary">{t('nutrition.activities.sedentary')}</option>
                  <option value="moderate">{t('nutrition.activities.moderate')}</option>
                  <option value="active">{t('nutrition.activities.active')}</option>
                  <option value="working">{t('nutrition.activities.working')}</option>
                </select>
              </div>
              <div className={fieldClass}>
                <label className={labelClass}>{t('nutrition.bodyCondition')}</label>
                <select {...register('bodyCondition')} className={inputClass}>
                  <option value="underweight">{t('nutrition.conditions.underweight')}</option>
                  <option value="ideal">{t('nutrition.conditions.ideal')}</option>
                  <option value="overweight">{t('nutrition.conditions.overweight')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={fieldClass}>
                <label className={labelClass}>{t('nutrition.reproStatus')}</label>
                <select {...register('reproductiveStatus')} className={inputClass}>
                  <option value="neutered">{t('nutrition.reproStatuses.neutered')}</option>
                  <option value="intact">{t('nutrition.reproStatuses.intact')}</option>
                  <option value="pregnant">{t('nutrition.reproStatuses.pregnant')}</option>
                  <option value="lactating">{t('nutrition.reproStatuses.lactating')}</option>
                </select>
              </div>
              <div className={fieldClass}>
                <label className={labelClass}>{t('nutrition.mealsPerDay')}</label>
                <input type="number" min="1" max="4" {...register('mealsPerDay', { valueAsNumber: true })} className={inputClass} />
              </div>
            </div>

            <div className={fieldClass}>
              <label className={labelClass}>{t('nutrition.dietApproach')}</label>
              <select {...register('macroProfile')} className={inputClass}>
                <option value="balanced_cooked">{t('nutrition.diets.balanced_cooked')}</option>
                <option value="high_protein">{t('nutrition.diets.high_protein')}</option>
                <option value="pmr">{t('nutrition.diets.pmr')}</option>
              </select>
            </div>
          </div>

          <div className="px-5 pb-5">
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-gray-900 font-bold py-4 rounded-xl text-base transition-all shadow-lg shadow-amber-500/20"
            >
              {t('common.calculate')}
            </button>
          </div>
        </form>

        {result && (
          <div className="print-card bg-gray-900 rounded-2xl border border-gray-800 shadow-lg overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-gray-800">
              <h2 className="font-bold text-lg text-amber-300">{t('nutrition.dailyPlan')}</h2>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { key: 'nutrition.dailyFood', value: `${result.dailyFoodGrams.min}–${result.dailyFoodGrams.max} g` },
                  { key: 'nutrition.perMeal', value: `${result.perMealGrams.min}–${result.perMealGrams.max} g` },
                  { key: 'nutrition.protein', value: `~${result.macros.proteinG} g/day` },
                  { key: 'nutrition.vegetables', value: `~${result.macros.vegG} g/day` },
                  { key: 'nutrition.calciumNeeded', value: `~${result.calciumMg} mg/day` },
                  { key: 'nutrition.omega3Target', value: `~${result.omega3Mg} mg` },
                ].map(({ key, value }) => (
                  <div key={key} className="bg-gray-800 rounded-xl p-3.5 text-center">
                    <p className="text-xs text-gray-400 mb-1">{t(key)}</p>
                    <p className="text-lg font-bold text-amber-300">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('nutrition.notes')}</h3>
                <div className="bg-gray-800 rounded-xl p-3.5 space-y-1.5">
                  {result.notes.map((n, i) => (
                    <p key={i} className="text-sm text-gray-300 flex gap-2">
                      <span className="text-amber-500 shrink-0">•</span>{n}
                    </p>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-500 border-t border-gray-800 pt-3">
                ⚠️ {t('nutrition.vetDisclaimer')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
