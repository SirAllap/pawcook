import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CookingInputSchema, type CookingInput, calculateCookingTime, type CookingResult } from '@pawcook/shared';

const STORAGE_KEY = 'pawcook_cooking_input';

const DEFAULT_VALUES: CookingInput = {
  meatType: 'beef', form: 'minced', cookingMethod: 'sous_vide', fatContent: 'medium',
  temperatureUnit: 'celsius',
  weightKg: 1, numberOfBags: 1, thicknessCm: 5,
  totalWeightKg: 1,
};

const MEAT_KEYS = ['beef','chicken','turkey','lamb','pork','duck','rabbit','venison','salmon','mackerel','sardines','whitefish'] as const;

const METHOD_VESSEL: Record<string, string> = {
  sous_vide: '🛁', oven: '🍲', stovetop_low: '🫕', slow_cooker: '🥘',
};

function loadSavedValues(): CookingInput {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_VALUES, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_VALUES;
}

const inputCls = 'w-full bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3.5 text-base text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-all appearance-none';
const labelCls = 'block text-[11px] font-bold text-gray-400/80 uppercase tracking-[0.10em] mb-2';
const errCls   = 'text-red-400 text-xs mt-1.5 font-medium';

function SectionHead({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span className="text-[11px] font-black text-amber-500/90 uppercase tracking-[0.14em] whitespace-nowrap">{children}</span>
      <div className="flex-1 h-px bg-white/[0.06]" />
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

  const isSousVide = values.cookingMethod === 'sous_vide';
  const totalKg = isSousVide
    ? (values.weightKg || 0) * (values.numberOfBags || 0)
    : (values.totalWeightKg || 0);

  // Sous-vide bags are sealed — virtually no moisture escapes (~97% yield).
  // Oven loses moisture to evaporation (~82%). Stovetop/slow cooker yield
  // assumes the cooking broth is served with the meat (~90% / ~88%).
  const YIELD_PCT: Record<string, number> = {
    sous_vide: 0.97, oven: 0.82, stovetop_low: 0.90, slow_cooker: 0.88,
  };
  const yieldPct = YIELD_PCT[values.cookingMethod] ?? 0.90;

  function onSubmit(data: CookingInput) {
    setCalculating(true);
    setTimeout(() => {
      setResult(calculateCookingTime(data));
      setCalculating(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }, 200);
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-black text-white mb-1 tracking-tight">{t('cooking.title')}</h1>
        <p className="text-gray-400 text-sm">{t('cooking.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}
        className="glass-card rounded-3xl overflow-hidden animate-fade-in-up delay-100">
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
          <div>
            <label className={labelCls}>{t('cooking.method')}</label>
            <select {...register('cookingMethod')} className={inputCls}>
              <option value="sous_vide">{METHOD_VESSEL.sous_vide} {t('cooking.methods.sous_vide')}</option>
              <option value="oven">{METHOD_VESSEL.oven} {t('cooking.methods.oven')}</option>
              <option value="stovetop_low">{METHOD_VESSEL.stovetop_low} {t('cooking.methods.stovetop_low')}</option>
              <option value="slow_cooker">{METHOD_VESSEL.slow_cooker} {t('cooking.methods.slow_cooker')}</option>
            </select>
          </div>

          {/* Sous-vide: per-bag inputs */}
          {isSousVide && (
            <div className="space-y-3 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{t('cooking.weightPerBag')}</label>
                  <input type="number" step="0.1" inputMode="decimal"
                    {...register('weightKg', { valueAsNumber: true })} className={inputCls} />
                  {errors.weightKg && <p className={errCls}>{errors.weightKg.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>{t('cooking.numberOfBags')}</label>
                  <input type="number" inputMode="numeric"
                    {...register('numberOfBags', { valueAsNumber: true })} className={inputCls} />
                  {errors.numberOfBags && <p className={errCls}>{errors.numberOfBags.message}</p>}
                </div>
              </div>
              <div>
                <label className={labelCls}>{t('cooking.thickness')}</label>
                <input type="number" step="0.5" inputMode="decimal"
                  {...register('thicknessCm', { valueAsNumber: true })} className={inputCls} />
                {errors.thicknessCm && <p className={errCls}>{errors.thicknessCm.message}</p>}
              </div>
            </div>
          )}

          {/* Oven / stovetop / slow cooker: single weight */}
          {!isSousVide && (
            <div className="animate-fade-in">
              <label className={labelCls}>{t('cooking.totalWeight')}</label>
              <input type="number" step="0.1" inputMode="decimal"
                {...register('totalWeightKg', { valueAsNumber: true })} className={inputCls} />
              {errors.totalWeightKg && <p className={errCls}>{errors.totalWeightKg.message}</p>}
            </div>
          )}

          {totalKg > 0 && (
            <div className="flex items-center gap-2.5 bg-amber-500/8 border border-amber-500/20 rounded-2xl px-4 py-3">
              <span className="text-amber-400 text-lg">⚖️</span>
              <span className="text-sm text-amber-200 font-semibold">
                {t('cooking.total')}: <strong>{totalKg.toFixed(1)} kg</strong>
                &nbsp;· {t('cooking.yield')} ≈ <strong>{(totalKg * yieldPct).toFixed(1)} kg</strong> {t('cooking.cooked')} ({Math.round(yieldPct * 100)}%)
              </span>
            </div>
          )}

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
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed
                      active:scale-[0.98] text-gray-900 font-black py-4 rounded-2xl text-base
                      transition-all glow-sm-amber flex items-center justify-center gap-2"
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
        <div ref={resultRef}
          className="animate-spring-in print-card glass-card rounded-3xl overflow-hidden scroll-mt-20">

          <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="font-black text-lg text-white tracking-tight">🧑‍🍳 {t('cooking.recipeCard')}</h2>
            <button onClick={() => window.print()}
              className="no-print text-xs text-gray-500 hover:text-amber-400 transition-colors font-semibold">
              🖨️ {t('common.print')}
            </button>
          </div>

          {/* Metric tiles */}
          <div className="p-4 grid grid-cols-2 gap-3">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
              <p className="text-[11px] text-amber-400/70 font-black uppercase tracking-[0.12em] mb-2">{t('cooking.safeTemp')}</p>
              <p className="text-4xl font-black text-amber-400 leading-none">{result.safeInternalTempC}°C</p>
              <p className="text-sm text-amber-400/50 mt-1">{result.safeInternalTempF}°F</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
              <p className="text-[11px] text-blue-400/70 font-black uppercase tracking-[0.12em] mb-2">{t('cooking.cookingTime')}</p>
              <p className="text-4xl font-black text-blue-400 leading-none">{result.cookingTimeMinutes.min}–{result.cookingTimeMinutes.max}</p>
              <p className="text-sm text-blue-400/50 mt-1">{t('cooking.minutes')}</p>
            </div>
          </div>

          <div className="px-5 pb-4">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.12em] mb-2">📋 {t('cooking.instructionsSection')}</p>
              <p className="text-sm text-gray-300 leading-relaxed">{result.methodInstructions}</p>
            </div>
          </div>

          <div className="px-5 pb-4">
            <div className="bg-green-950/50 border border-green-800/40 rounded-2xl p-4 space-y-2">
              <p className="text-[11px] font-black text-green-400 uppercase tracking-[0.12em] mb-2">🧊 {t('cooking.storage')}</p>
              {result.storageInstructions.map((s, i) => (
                <p key={i} className="text-sm text-green-200 flex gap-2 items-start">
                  <span className="text-green-500 shrink-0 mt-0.5 font-bold">✓</span>{s}
                </p>
              ))}
            </div>
          </div>

          <div className="px-5 pb-5">
            <div className="bg-red-950/50 border border-red-800/40 rounded-2xl p-4 space-y-2">
              <p className="text-[11px] font-black text-red-400 uppercase tracking-[0.12em] mb-2">⚠️ {t('cooking.warnings')}</p>
              {result.warnings.map((w, i) => (
                <p key={i} className="text-sm text-red-200 flex gap-2 items-start">
                  <span className="text-red-400 shrink-0 mt-0.5 font-black">!</span>{w}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {!result && (
        <div className="text-center py-12 text-gray-600 animate-fade-in">
          <div className="text-5xl mb-4 animate-float">🍖</div>
          <p className="text-sm">{t('cooking.placeholder')} <strong className="text-gray-500">{t('common.calculate')}</strong></p>
        </div>
      )}
    </div>
  );
}
