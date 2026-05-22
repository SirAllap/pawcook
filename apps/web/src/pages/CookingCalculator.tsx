import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CookingInputSchema, type CookingInput, calculateCookingTime, type CookingResult } from '@pawcook/shared';

const STORAGE_KEY = 'pawcook_cooking_input';

const DEFAULT_VALUES: CookingInput = {
  meatType: 'beef',
  form: 'minced',
  weightKg: 1,
  numberOfBags: 1,
  thicknessCm: 5,
  cookingMethod: 'sous_vide',
  fatContent: 'medium',
  temperatureUnit: 'celsius',
};

const MEAT_OPTIONS = [
  'beef', 'chicken', 'turkey', 'lamb', 'pork', 'duck',
  'rabbit', 'venison', 'salmon', 'mackerel', 'sardines', 'whitefish',
];

function loadSavedValues(): CookingInput {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_VALUES, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_VALUES;
}

export default function CookingCalculator() {
  const { t } = useTranslation();
  const [result, setResult] = useState<CookingResult | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CookingInput>({
    resolver: zodResolver(CookingInputSchema),
    defaultValues: loadSavedValues(),
  });

  const values = watch();
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); } catch {}
  }, [values]);

  function onSubmit(data: CookingInput) {
    setResult(calculateCookingTime(data));
  }

  const inputClass = 'w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all';
  const labelClass = 'block text-sm font-medium text-gray-300 mb-1.5';
  const errorClass = 'text-red-400 text-xs mt-1';
  const fieldClass = 'space-y-0';

  return (
    <div>
      <h1 className="text-2xl font-bold text-amber-400 mb-1">{t('cooking.title')}</h1>
      <p className="text-gray-400 text-sm mb-6">{t('cooking.subtitle')}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-900 rounded-2xl border border-gray-800 shadow-lg overflow-hidden">
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className={fieldClass}>
                <label className={labelClass}>{t('cooking.meatType')}</label>
                <select {...register('meatType')} className={inputClass}>
                  {MEAT_OPTIONS.map(m => (
                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className={fieldClass}>
                <label className={labelClass}>{t('cooking.form')}</label>
                <select {...register('form')} className={inputClass}>
                  <option value="minced">{t('cooking.forms.minced')}</option>
                  <option value="cubed">{t('cooking.forms.cubed')}</option>
                  <option value="whole_cut">{t('cooking.forms.whole_cut')}</option>
                  <option value="fillet">{t('cooking.forms.fillet')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={fieldClass}>
                <label className={labelClass}>{t('cooking.weightPerBag')}</label>
                <input type="number" step="0.1" {...register('weightKg', { valueAsNumber: true })} className={inputClass} />
                {errors.weightKg && <p className={errorClass}>{errors.weightKg.message}</p>}
              </div>
              <div className={fieldClass}>
                <label className={labelClass}>{t('cooking.numberOfBags')}</label>
                <input type="number" {...register('numberOfBags', { valueAsNumber: true })} className={inputClass} />
                {errors.numberOfBags && <p className={errorClass}>{errors.numberOfBags.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={fieldClass}>
                <label className={labelClass}>{t('cooking.thickness')}</label>
                <input type="number" step="0.5" {...register('thicknessCm', { valueAsNumber: true })} className={inputClass} />
                {errors.thicknessCm && <p className={errorClass}>{errors.thicknessCm.message}</p>}
              </div>
              <div className={fieldClass}>
                <label className={labelClass}>{t('cooking.method')}</label>
                <select {...register('cookingMethod')} className={inputClass}>
                  <option value="sous_vide">{t('cooking.methods.sous_vide')}</option>
                  <option value="oven">{t('cooking.methods.oven')}</option>
                  <option value="stovetop_low">{t('cooking.methods.stovetop_low')}</option>
                  <option value="slow_cooker">{t('cooking.methods.slow_cooker')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={fieldClass}>
                <label className={labelClass}>{t('cooking.fatContent')}</label>
                <select {...register('fatContent')} className={inputClass}>
                  <option value="lean">{t('cooking.fat.lean')}</option>
                  <option value="medium">{t('cooking.fat.medium')}</option>
                  <option value="fatty">{t('cooking.fat.fatty')}</option>
                </select>
              </div>
              <div className={fieldClass}>
                <label className={labelClass}>{t('cooking.tempUnit')}</label>
                <select {...register('temperatureUnit')} className={inputClass}>
                  <option value="celsius">{t('cooking.units.celsius')}</option>
                  <option value="fahrenheit">{t('cooking.units.fahrenheit')}</option>
                </select>
              </div>
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
          <div className="print-card bg-gray-900 rounded-2xl border border-gray-800 shadow-lg overflow-hidden space-y-0">
            <div className="px-5 pt-5 pb-4 border-b border-gray-800">
              <h2 className="font-bold text-lg text-amber-300">{t('cooking.recipeCard')}</h2>
            </div>

            <div className="p-5 grid grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">{t('cooking.safeTemp')}</p>
                <p className="text-2xl font-bold text-amber-400">{result.safeInternalTempC}°C</p>
                <p className="text-sm text-gray-500">{result.safeInternalTempF}°F</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">{t('cooking.cookingTime')}</p>
                <p className="text-2xl font-bold text-amber-400">{result.cookingTimeMinutes.min}–{result.cookingTimeMinutes.max}</p>
                <p className="text-sm text-gray-500">{t('cooking.minutes')}</p>
              </div>
            </div>

            <div className="px-5 pb-2">
              <p className="text-sm text-gray-400 bg-gray-800 rounded-xl p-3">{result.methodInstructions}</p>
            </div>

            <div className="px-5 pb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('cooking.storage')}</h3>
              <div className="bg-green-950 border border-green-800/50 rounded-xl p-3 space-y-1">
                {result.storageInstructions.map((s, i) => (
                  <p key={i} className="text-sm text-green-200 flex gap-2"><span className="text-green-400 shrink-0">•</span>{s}</p>
                ))}
              </div>
            </div>

            <div className="px-5 pb-5">
              <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">⚠ {t('cooking.warnings')}</h3>
              <div className="bg-red-950 border border-red-800/50 rounded-xl p-3 space-y-1">
                {result.warnings.map((w, i) => (
                  <p key={i} className="text-sm text-red-200 flex gap-2"><span className="shrink-0">•</span>{w}</p>
                ))}
              </div>
            </div>

            <div className="px-5 pb-5">
              <button
                onClick={() => window.print()}
                className="no-print w-full text-sm text-gray-500 hover:text-gray-300 border border-gray-700 rounded-xl py-2.5 transition-all hover:border-gray-600 active:scale-95"
              >
                {t('common.print')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
