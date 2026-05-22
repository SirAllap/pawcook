import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
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

  const inputClass = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500';
  const labelClass = 'block text-xs font-medium text-gray-400 mb-1';

  return (
    <div>
      <h1 className="text-2xl font-bold text-amber-400 mb-1">Nutrition Calculator</h1>
      <p className="text-gray-400 text-sm mb-6">Calculate daily portions and macronutrient ratios based on your dog's profile.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Dog weight (kg)</label>
              <input type="number" step="0.1" {...register('weightKg', { valueAsNumber: true })} className={inputClass} />
              {errors.weightKg && <p className="text-red-400 text-xs mt-1">{errors.weightKg.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Age group</label>
              <select {...register('age')} className={inputClass}>
                <option value="puppy">Puppy (&lt;1 yr)</option>
                <option value="adult">Adult (1–7 yr)</option>
                <option value="senior">Senior (7+ yr)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Activity level</label>
              <select {...register('activityLevel')} className={inputClass}>
                <option value="sedentary">Sedentary</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
                <option value="working">Working</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Body condition</label>
              <select {...register('bodyCondition')} className={inputClass}>
                <option value="underweight">Underweight</option>
                <option value="ideal">Ideal</option>
                <option value="overweight">Overweight</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Reproductive status</label>
              <select {...register('reproductiveStatus')} className={inputClass}>
                <option value="neutered">Neutered</option>
                <option value="intact">Intact</option>
                <option value="pregnant">Pregnant</option>
                <option value="lactating">Lactating</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Meals per day</label>
              <input type="number" min="1" max="4" {...register('mealsPerDay', { valueAsNumber: true })} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Diet approach</label>
            <select {...register('macroProfile')} className={inputClass}>
              <option value="balanced_cooked">Balanced cooked (vet-recommended) — 40% protein / 50% veg / 10% starch</option>
              <option value="high_protein">High-protein cooked — 50% protein / 30% veg / 15% starch</option>
              <option value="pmr">PMR 80-10-10 (advanced)</option>
            </select>
          </div>

          <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold py-2.5 rounded-lg transition-colors">
            Calculate
          </button>
        </form>

        {result && (
          <div className="print-card bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
            <h2 className="font-bold text-lg text-amber-300">Daily Nutrition Plan</h2>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Daily food', value: `${result.dailyFoodGrams.min}–${result.dailyFoodGrams.max} g` },
                { label: 'Per meal', value: `${result.perMealGrams.min}–${result.perMealGrams.max} g` },
                { label: 'Protein', value: `~${result.macros.proteinG} g/day` },
                { label: 'Vegetables', value: `~${result.macros.vegG} g/day` },
                { label: 'Calcium needed', value: `~${result.calciumMg} mg/day` },
                { label: 'Omega-3 target', value: `~${result.omega3Mg} mg EPA+DHA` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-base font-semibold text-amber-300">{value}</p>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Notes</h3>
              <ul className="space-y-1">
                {result.notes.map((n, i) => (
                  <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-amber-500">•</span>{n}</li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-gray-500 border-t border-gray-800 pt-3">
              ⚠️ This tool provides general guidance only. Consult a board-certified veterinary nutritionist (ACVN) for long-term homemade feeding or any dog with a medical condition.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
