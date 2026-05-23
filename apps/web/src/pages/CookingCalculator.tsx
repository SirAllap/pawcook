import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CookingInputSchema, type CookingInput, calculateCookingTime, type CookingResult } from '@pawcook/shared';

const STORAGE_KEY = 'pawcook_cooking_input';

const DEFAULT_VALUES: CookingInput = {
  meatType: 'beef', form: 'minced', weightKg: 1, numberOfBags: 1,
  thicknessCm: 5, cookingMethod: 'sous_vide', fatContent: 'medium', temperatureUnit: 'celsius',
};

const MEAT_KEYS = ['beef','chicken','turkey','lamb','pork','duck','rabbit','venison','salmon','mackerel','sardines','whitefish'] as const;

function loadSavedValues(): CookingInput {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_VALUES, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_VALUES;
}

const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all appearance-none';
const labelCls = 'block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5';
const errCls   = 'text-red-400 text-xs mt-1';

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-xs font-bold text-amber-500 uppercase tracking-widest whitespace-nowrap">{children}</span>
      <div className="flex-1 h-px bg-gray-800" />
    </div>
  );
}

export default function CookingCalculator() {
  const { t } = useTranslation();
  const [result, setResult] = useState<CookingResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CookingInput>({
    resolver: zodResolver(CookingInputSchema),
    defaultValues: loadSavedValues(),
  });

  const values = watch();
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); } catch {}
  }, [values]);

  const totalKg = (values.weightKg || 0) * (values.numberOfBags || 0);

  function onSubmit(data: CookingInput) {
    setCalculating(true);
    setTimeout(() => {
      setResult(calculateCookingTime(data));
      setCalculating(false);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }, 200);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">{t('cooking.title')}</h1>
        <p className="text-gray-400 text-sm">{t('cooking.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-900 rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
        <div className="p-5 space-y-5">

          <SectionHead>{t('cooking.meatType')}</SectionHead>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('cooking.meatType')}</label>
              <select {...register('meatType')} className={inputCls}>
                {MEAT_KEYS.map(key => (
                  <option key={key} value={key}>{t(`cooking.meats.${key}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('cooking.form')}</label>
              <select {...register('form')} className={inputCls}>
                <option value="minced">{t('cooking.forms.minced')}</option>
                <option value="cubed">{t('cooking.forms.cubed')}</option>
                <option value="whole_cut">{t('cooking.forms.whole_cut')}</option>
                <option value="fillet">{t('cooking.forms.fillet')}</option>
              </select>
            </div>
          </div>

          <SectionHead>{t('cooking.method')}</SectionHead>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('cooking.weightPerBag')}</label>
              <input type="number" step="0.1" inputMode="decimal" {...register('weightKg', { valueAsNumber: true })} className={inputCls} />
              {errors.weightKg && <p className={errCls}>{errors.weightKg.message}</p>}
            </div>
            <div>
              <label className={labelCls}>{t('cooking.numberOfBags')}</label>
              <input type="number" inputMode="numeric" {...register('numberOfBags', { valueAsNumber: true })} className={inputCls} />
              {errors.numberOfBags && <p className={errCls}>{errors.numberOfBags.message}</p>}
            </div>
          </div>

          {totalKg > 0 && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5">
              <span className="text-amber-400 text-lg">⚖️</span>
              <span className="text-sm text-amber-200 font-medium">
                {t('cooking.total')}: <strong>{totalKg.toFixed(1)} kg</strong>
                &nbsp;· {t('cooking.yield')} ≈ <strong>{(totalKg * 0.9).toFixed(1)} kg</strong> {t('cooking.cooked')}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('cooking.thickness')}</label>
              <input type="number" step="0.5" inputMode="decimal" {...register('thicknessCm', { valueAsNumber: true })} className={inputCls} />
              {errors.thicknessCm && <p className={errCls}>{errors.thicknessCm.message}</p>}
            </div>
            <div>
              <label className={labelCls}>{t('cooking.method')}</label>
              <select {...register('cookingMethod')} className={inputCls}>
                <option value="sous_vide">{t('cooking.methods.sous_vide')}</option>
                <option value="oven">{t('cooking.methods.oven')}</option>
                <option value="stovetop_low">{t('cooking.methods.stovetop_low')}</option>
                <option value="slow_cooker">{t('cooking.methods.slow_cooker')}</option>
              </select>
            </div>
          </div>

          <SectionHead>{t('cooking.optionsSection')}</SectionHead>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('cooking.fatContent')}</label>
              <select {...register('fatContent')} className={inputCls}>
                <option value="lean">{t('cooking.fat.lean')}</option>
                <option value="medium">{t('cooking.fat.medium')}</option>
                <option value="fatty">{t('cooking.fat.fatty')}</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('cooking.tempUnit')}</label>
              <select {...register('temperatureUnit')} className={inputCls}>
                <option value="celsius">{t('cooking.units.celsius')}</option>
                <option value="fahrenheit">{t('cooking.units.fahrenheit')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            type="submit"
            disabled={calculating}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] text-gray-900 font-bold py-4 rounded-xl text-base transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
          >
            {calculating ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span>{t('common.calculating')}</span>
              </>
            ) : (
              <span>🌡️ {t('common.calculate')}</span>
            )}
          </button>
        </div>
      </form>

      {result && (
        <div ref={resultRef} className="animate-fade-in-up print-card bg-gray-900 rounded-2xl border border-gray-800 shadow-xl overflow-hidden scroll-mt-20">
          <div className="px-5 pt-5 pb-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-bold text-lg text-white">🧑‍🍳 {t('cooking.recipeCard')}</h2>
            <button onClick={() => window.print()}
              className="no-print text-xs text-gray-500 hover:text-amber-400 transition-colors flex items-center gap-1">
              🖨️ {t('common.print')}
            </button>
          </div>

          <div className="p-4 grid grid-cols-2 gap-3">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
              <p className="text-xs text-amber-400/80 font-semibold uppercase tracking-wide mb-1">{t('cooking.safeTemp')}</p>
              <p className="text-3xl font-black text-amber-400">{result.safeInternalTempC}°C</p>
              <p className="text-sm text-amber-400/60">{result.safeInternalTempF}°F</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
              <p className="text-xs text-blue-400/80 font-semibold uppercase tracking-wide mb-1">{t('cooking.cookingTime')}</p>
              <p className="text-3xl font-black text-blue-400">{result.cookingTimeMinutes.min}–{result.cookingTimeMinutes.max}</p>
              <p className="text-sm text-blue-400/60">{t('cooking.minutes')}</p>
            </div>
          </div>

          <div className="px-5 pb-4">
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">📋 {t('cooking.instructionsSection')}</p>
              <p className="text-sm text-gray-300 leading-relaxed">{result.methodInstructions}</p>
            </div>
          </div>

          <div className="px-5 pb-4">
            <div className="bg-green-950/60 border border-green-800/50 rounded-xl p-4 space-y-1.5">
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-2">🧊 {t('cooking.storage')}</p>
              {result.storageInstructions.map((s, i) => (
                <p key={i} className="text-sm text-green-200 flex gap-2 items-start">
                  <span className="text-green-500 shrink-0 mt-0.5">✓</span>{s}
                </p>
              ))}
            </div>
          </div>

          <div className="px-5 pb-5">
            <div className="bg-red-950/60 border border-red-800/50 rounded-xl p-4 space-y-1.5">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">⚠️ {t('cooking.warnings')}</p>
              {result.warnings.map((w, i) => (
                <p key={i} className="text-sm text-red-200 flex gap-2 items-start">
                  <span className="text-red-500 shrink-0 mt-0.5">!</span>{w}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {!result && (
        <div className="text-center py-10 text-gray-600 animate-fade-in">
          <div className="text-5xl mb-3">🍖</div>
          <p className="text-sm">{t('cooking.placeholder')} <strong className="text-gray-500">{t('common.calculate')}</strong></p>
        </div>
      )}
    </div>
  );
}
