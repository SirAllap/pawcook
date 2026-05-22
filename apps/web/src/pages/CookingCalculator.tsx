import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { CookingInputSchema, type CookingInput, calculateCookingTime, type CookingResult } from '@pawcook/shared';

const STORAGE_KEY = 'pawcook_cooking_input';

const MEAT_OPTIONS = [
  { value: 'beef', label: 'Beef' },
  { value: 'chicken', label: 'Chicken' },
  { value: 'turkey', label: 'Turkey' },
  { value: 'lamb', label: 'Lamb' },
  { value: 'pork', label: 'Pork' },
  { value: 'duck', label: 'Duck' },
  { value: 'rabbit', label: 'Rabbit' },
  { value: 'venison', label: 'Venison' },
  { value: 'salmon', label: 'Salmon' },
  { value: 'mackerel', label: 'Mackerel' },
  { value: 'sardines', label: 'Sardines' },
  { value: 'whitefish', label: 'Whitefish' },
];

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

function loadSavedValues(): CookingInput {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_VALUES, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_VALUES;
}

export default function CookingCalculator() {
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

  const inputClass = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500';
  const labelClass = 'block text-xs font-medium text-gray-400 mb-1';
  const errorClass = 'text-red-400 text-xs mt-1';

  return (
    <div>
      <h1 className="text-2xl font-bold text-amber-400 mb-1">Cooking Calculator</h1>
      <p className="text-gray-400 text-sm mb-6">Calculate safe cooking time and temperature for your dog's food.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Meat type</label>
              <select {...register('meatType')} className={inputClass}>
                {MEAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Form</label>
              <select {...register('form')} className={inputClass}>
                <option value="minced">Minced</option>
                <option value="cubed">Cubed</option>
                <option value="whole_cut">Whole cut</option>
                <option value="fillet">Fillet</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Weight per bag (kg)</label>
              <input type="number" step="0.1" {...register('weightKg', { valueAsNumber: true })} className={inputClass} />
              {errors.weightKg && <p className={errorClass}>{errors.weightKg.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Number of bags</label>
              <input type="number" {...register('numberOfBags', { valueAsNumber: true })} className={inputClass} />
              {errors.numberOfBags && <p className={errorClass}>{errors.numberOfBags.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Bag thickness (cm)</label>
              <input type="number" step="0.5" {...register('thicknessCm', { valueAsNumber: true })} className={inputClass} />
              {errors.thicknessCm && <p className={errorClass}>{errors.thicknessCm.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Cooking method</label>
              <select {...register('cookingMethod')} className={inputClass}>
                <option value="sous_vide">Sous-vide</option>
                <option value="oven">Oven (low)</option>
                <option value="stovetop_low">Stovetop low</option>
                <option value="slow_cooker">Slow cooker</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Fat content</label>
              <select {...register('fatContent')} className={inputClass}>
                <option value="lean">Lean</option>
                <option value="medium">Medium</option>
                <option value="fatty">Fatty</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Temperature unit</label>
              <select {...register('temperatureUnit')} className={inputClass}>
                <option value="celsius">Celsius</option>
                <option value="fahrenheit">Fahrenheit</option>
              </select>
            </div>
          </div>

          <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold py-2.5 rounded-lg transition-colors">
            Calculate
          </button>
        </form>

        {result && (
          <div className="print-card bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
            <h2 className="font-bold text-lg text-amber-300">Recipe Card</h2>

            <div className="bg-gray-800 rounded-lg p-4 space-y-2 text-sm font-mono">
              <p><span className="text-amber-400">Safe temp:</span> {result.safeInternalTempC} °C / {result.safeInternalTempF} °F</p>
              <p><span className="text-amber-400">Cooking time:</span> {result.cookingTimeMinutes.min}–{result.cookingTimeMinutes.max} minutes</p>
              <p className="text-gray-300 text-xs pt-1">{result.methodInstructions}</p>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Storage</h3>
              <ul className="space-y-1">
                {result.storageInstructions.map((s, i) => (
                  <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-amber-500">•</span>{s}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">⚠ Warnings</h3>
              <ul className="space-y-1">
                {result.warnings.map((w, i) => (
                  <li key={i} className="text-sm text-red-300 flex gap-2"><span>•</span>{w}</li>
                ))}
              </ul>
            </div>

            <button onClick={() => window.print()} className="no-print text-xs text-gray-500 hover:text-gray-300 underline">
              Print recipe card
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
