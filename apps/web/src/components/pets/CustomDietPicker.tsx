import { useTranslation } from 'react-i18next';
import { Settings2, ChevronDown, ChevronUp, Info, Stethoscope } from 'lucide-react';
import { type CustomDiet, type CalciumSource, type VetPrescription, type ClinicalCondition } from '@pawcook/shared';
import { Slider } from '../ui/slider';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { cn } from '../../lib/cn';

// Default macro/composition values when the user first opens "+ Custom".
// 50/30/20 mirrors the new Lean Cooked baseline, which is a defensible
// adult-maintenance starting point per FEDIAF/NRC 2006.
export const DEFAULT_CUSTOM_DIET: CustomDiet = {
  mode: 'easy',
  macros: { protein: 50, fat: 0, veg: 30, carb: 20 },
  proteinComposition: undefined,
  calciumSource: 'eggshell',
  supplements: { omega3: false, vitaminE: false, taurine: false, multivitamin: false },
};

// Snap pills for Easy mode. Each is a one-tap shortcut to a recognisable
// ratio. 90/10 covers the user's vet-prescribed case from the original
// brief without us shipping it as a marquee preset.
const EASY_PILLS = [
  { id: 'lean',    proteinPct: 50, vegPct: 30, carbPct: 20 },
  { id: 'protein', proteinPct: 55, vegPct: 30, carbPct: 15 },
  { id: 'meat90',  proteinPct: 90, vegPct: 10, carbPct:  0 },
] as const;

// FEDIAF/NRC 2006-derived guide rail for adult dog protein, expressed as
// % of as-fed weight (the slider's domain). Below 18% triggers a warning;
// above 75% does not but is uncommon outside therapeutic plans.
const PROTEIN_GUIDE = { min: 18, max: 75 };

const CLINICAL_CONDITIONS: ClinicalCondition[] = [
  'renal_ckd', 'hepatic', 'pancreatitis', 'ibd', 'food_allergy',
  'urolithiasis_struvite', 'urolithiasis_calcium_oxalate', 'urolithiasis_urate',
  'diabetes', 'obesity', 'cardiac', 'epi', 'cancer_cachexia', 'other',
];

export function CustomDietPicker({
  value,
  onChange,
  vetPrescription,
  onVetPrescriptionChange,
}: {
  value: CustomDiet;
  onChange: (next: CustomDiet) => void;
  // Optional vet-prescribed support. When both are provided, the Advanced
  // section gets a "This diet is vet-prescribed" toggle that unlocks the
  // clinical context fields. The planner uses these to relax overridable
  // refusals — see packages/shared/src/planner/safety.ts.
  vetPrescription?: VetPrescription;
  onVetPrescriptionChange?: (next: VetPrescription | undefined) => void;
}) {
  const { t } = useTranslation();
  const advanced = value.mode === 'advanced';

  function patch(next: Partial<CustomDiet>) {
    onChange({ ...value, ...next });
  }
  function patchMacros(next: Partial<CustomDiet['macros']>) {
    onChange({ ...value, macros: { ...value.macros, ...next } });
  }
  function setEasyProtein(protein: number) {
    // Easy mode: veg absorbs the residual after starch (carb stays where it is).
    const carb = value.macros.carb;
    const veg = Math.max(0, 100 - protein - carb);
    onChange({ ...value, macros: { protein, fat: 0, veg, carb } });
  }
  function applyPill(p: typeof EASY_PILLS[number]) {
    onChange({
      ...value,
      macros: { protein: p.proteinPct, fat: 0, veg: p.vegPct, carb: p.carbPct },
    });
  }

  const macroSum = value.macros.protein + value.macros.fat + value.macros.veg + value.macros.carb;
  const sumValid = Math.abs(macroSum - 100) <= 1;

  // Plain-language summary derived from the current ratio so users think
  // in food, not percentages. Three buckets: meat-heavy, balanced, veg-heavy.
  const summary = describeRatio(value.macros.protein, value.macros.veg, value.macros.carb, t);

  // Tier 2 inline warnings — actionable, named risks. Never block save.
  const warnings = collectWarnings(value, t);

  return (
    <div className="mt-4 rounded-2xl border border-border bg-surface-2 p-4 space-y-4">
      {/* Header + mode switch */}
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-fg uppercase tracking-[0.1em]">
          <Settings2 className="h-3 w-3" aria-hidden />
          {t('nutrition.custom.title')}
        </span>
        <button
          type="button"
          onClick={() => patch({ mode: advanced ? 'easy' : 'advanced' })}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-muted-fg hover:text-foreground transition-colors"
        >
          {advanced ? (
            <>
              <ChevronUp className="h-3 w-3" aria-hidden />
              {t('nutrition.custom.collapseAdvanced')}
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" aria-hidden />
              {t('nutrition.custom.expandAdvanced')}
            </>
          )}
        </button>
      </div>

      {/* Easy: snap pills */}
      {!advanced && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[11px] text-muted-fg self-center mr-1">
            {t('nutrition.custom.nearest')}
          </span>
          {EASY_PILLS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPill(p)}
              className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-muted-fg hover:text-foreground border border-border min-h-[28px]"
            >
              ≈ {t(`nutrition.custom.pills.${p.id}`)}
            </button>
          ))}
        </div>
      )}

      {/* Macro sliders */}
      <div className="space-y-3">
        <SliderRow
          label={t('nutrition.components.protein')}
          value={value.macros.protein}
          onChange={(v) => (advanced ? patchMacros({ protein: v }) : setEasyProtein(v))}
          recommended={PROTEIN_GUIDE}
        />

        {advanced ? (
          <>
            <SliderRow
              label={t('nutrition.components.veg')}
              value={value.macros.veg}
              onChange={(v) => patchMacros({ veg: v })}
            />
            <SliderRow
              label={t('nutrition.components.starch')}
              value={value.macros.carb}
              onChange={(v) => patchMacros({ carb: v })}
              max={50}
            />
            <div className={cn(
              'flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-semibold',
              sumValid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning',
            )}>
              <span>{t('nutrition.custom.sumLabel')}</span>
              <span>{Math.round(macroSum)}%</span>
            </div>
          </>
        ) : (
          // Easy: visualise the protein/veg/starch split as a single bar so
          // users see the food, not the math.
          <div className="space-y-1.5">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface">
              <div className="bg-rose-500" style={{ width: `${value.macros.protein}%` }} />
              <div className="bg-success" style={{ width: `${value.macros.veg}%` }} />
              <div className="bg-info"    style={{ width: `${value.macros.carb}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-fg font-semibold">
              <span>{Math.round(value.macros.protein)}% {t('nutrition.macroProtein')}</span>
              <span>{Math.round(value.macros.veg)}% {t('nutrition.macroVeg')}</span>
              <span>{Math.round(value.macros.carb)}% {t('nutrition.macroStarch')}</span>
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-fg italic leading-snug">{summary}</p>

      {/* Advanced extras */}
      {advanced && (
        <div className="space-y-4 pt-2 border-t border-border/50">
          <ProteinCompositionSection value={value} onChange={onChange} />
          <CalciumSourceSection value={value.calciumSource} onChange={(v) => patch({ calciumSource: v })} />
          <SupplementsSection value={value.supplements} onChange={(v) => patch({ supplements: v })} />
          {onVetPrescriptionChange && (
            <VetPrescriptionSection
              value={vetPrescription}
              onChange={onVetPrescriptionChange}
            />
          )}
        </div>
      )}

      {/* Tier 2 inline warnings — list of named, actionable risks. */}
      {warnings.length > 0 && (
        <ul className="space-y-1.5">
          {warnings.map((w) => (
            <li key={w} className="flex items-start gap-1.5 rounded-xl bg-warning/8 border border-warning/30 px-3 py-2 text-[11px] text-warning leading-snug">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SliderRow({
  label, value, onChange, recommended, max = 100,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  recommended?: { min: number; max: number };
  max?: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="text-muted-fg tabular-nums">{Math.round(value)}%</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => v !== undefined && onChange(v)}
        min={0}
        max={max}
        step={1}
        recommended={recommended}
        aria-label={label}
      />
    </div>
  );
}

function ProteinCompositionSection({
  value, onChange,
}: {
  value: CustomDiet;
  onChange: (next: CustomDiet) => void;
}) {
  const { t } = useTranslation();
  const enabled = Boolean(value.proteinComposition);
  const comp = value.proteinComposition ?? { muscle: 85, organ: 10, bone: 5 };
  const compSum = comp.muscle + comp.organ + comp.bone;
  const sumValid = Math.abs(compSum - 100) <= 1;

  function patchComp(next: Partial<typeof comp>) {
    onChange({ ...value, proteinComposition: { ...comp, ...next } });
  }
  function toggle() {
    onChange({
      ...value,
      proteinComposition: enabled ? undefined : { muscle: 85, organ: 10, bone: 5 },
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-2 text-[11px] font-bold text-muted-fg uppercase tracking-[0.1em]"
      >
        <span className={cn('inline-block h-3.5 w-3.5 rounded border', enabled ? 'bg-primary border-primary' : 'border-border bg-surface')} aria-hidden />
        {t('nutrition.custom.compositionLabel')}
      </button>
      {enabled && (
        <div className="space-y-2 rounded-xl bg-surface p-3 border border-border/50">
          <p className="text-[10px] text-muted-fg leading-snug">{t('nutrition.custom.compositionHelp')}</p>
          <SliderRow label={t('nutrition.components.muscle')} value={comp.muscle} onChange={(v) => patchComp({ muscle: v })} />
          <SliderRow label={t('nutrition.components.organ')} value={comp.organ} onChange={(v) => patchComp({ organ: v })} max={30} />
          <SliderRow label={t('nutrition.components.bone')} value={comp.bone} onChange={(v) => patchComp({ bone: v })} max={20} />
          <div className={cn(
            'flex items-center justify-between rounded-xl px-3 py-1.5 text-[10px] font-semibold',
            sumValid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning',
          )}>
            <span>{t('nutrition.custom.sumLabel')}</span>
            <span>{Math.round(compSum)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CalciumSourceSection({
  value, onChange,
}: {
  value: CalciumSource;
  onChange: (v: CalciumSource) => void;
}) {
  const { t } = useTranslation();
  const opts: CalciumSource[] = ['bone_in', 'eggshell', 'supplement', 'none'];
  return (
    <div className="space-y-2">
      <span className="block text-[11px] font-bold text-muted-fg uppercase tracking-[0.1em]">
        {t('nutrition.custom.calciumLabel')}
      </span>
      <div className="grid grid-cols-2 gap-1.5">
        {opts.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-semibold text-left',
                active
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-surface text-muted-fg hover:text-foreground',
              )}
            >
              {t(`nutrition.custom.calcium.${opt}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SupplementsSection({
  value, onChange,
}: {
  value: CustomDiet['supplements'];
  onChange: (v: CustomDiet['supplements']) => void;
}) {
  const { t } = useTranslation();
  const keys: (keyof CustomDiet['supplements'])[] = ['omega3', 'vitaminE', 'taurine', 'multivitamin'];
  return (
    <div className="space-y-2">
      <span className="block text-[11px] font-bold text-muted-fg uppercase tracking-[0.1em]">
        {t('nutrition.custom.supplementsLabel')}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {keys.map((k) => {
          const active = value[k];
          return (
            <button
              key={k}
              type="button"
              onClick={() => onChange({ ...value, [k]: !active })}
              aria-pressed={active}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border min-h-[28px]',
                active
                  ? 'bg-primary/10 border-primary text-foreground'
                  : 'bg-surface border-border text-muted-fg hover:text-foreground',
              )}
            >
              <span className={cn('inline-block h-3 w-3 rounded border', active ? 'bg-primary border-primary' : 'border-border bg-surface')} aria-hidden />
              {t(`nutrition.custom.supplement.${k}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VetPrescriptionSection({
  value, onChange,
}: {
  value: VetPrescription | undefined;
  onChange: (v: VetPrescription | undefined) => void;
}) {
  const { t } = useTranslation();
  const enabled = Boolean(value);

  function toggle() {
    onChange(enabled ? undefined : { condition: 'other', restrictedIngredients: [], acknowledgments: [] });
  }
  function patch(next: Partial<VetPrescription>) {
    if (!value) return;
    onChange({ ...value, ...next });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-2 text-[11px] font-bold text-muted-fg uppercase tracking-[0.1em]"
      >
        <span className={cn('inline-block h-3.5 w-3.5 rounded border', enabled ? 'bg-primary border-primary' : 'border-border bg-surface')} aria-hidden />
        <Stethoscope className="h-3 w-3" aria-hidden />
        {t('nutrition.custom.vetPrescribed')}
      </button>
      {enabled && value && (
        <div className="space-y-3 rounded-xl bg-surface p-3 border border-primary/30">
          <p className="text-[10px] text-muted-fg leading-snug">{t('nutrition.custom.vetPrescribedHelp')}</p>
          <Input
            label={t('nutrition.custom.vetName')}
            placeholder=""
            autoComplete="off"
            value={value.vetName ?? ''}
            onChange={(e) => patch({ vetName: e.target.value || undefined })}
          />
          <Select
            label={t('nutrition.custom.condition')}
            value={value.condition}
            onChange={(e) => patch({ condition: e.target.value as ClinicalCondition })}
          >
            {CLINICAL_CONDITIONS.map((c) => (
              <option key={c} value={c}>{t(`nutrition.custom.conditions.${c}`)}</option>
            ))}
          </Select>
          <Input
            label={t('nutrition.custom.reviewDate')}
            type="date"
            value={value.reviewDate ?? ''}
            onChange={(e) => patch({ reviewDate: e.target.value || undefined })}
          />
        </div>
      )}
    </div>
  );
}

function describeRatio(
  protein: number,
  veg: number,
  _carb: number,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  if (protein >= 80) return t('nutrition.custom.summary.meatHeavy');
  if (protein >= 60) return t('nutrition.custom.summary.highMeat');
  if (protein >= 40 && veg <= 40) return t('nutrition.custom.summary.balancedMeat');
  if (veg > protein) return t('nutrition.custom.summary.vegHeavy');
  return t('nutrition.custom.summary.mixed');
}

function collectWarnings(d: CustomDiet, t: ReturnType<typeof useTranslation>['t']): string[] {
  const warnings: string[] = [];
  if (d.macros.protein < 18) {
    warnings.push(t('nutrition.custom.warn.lowProtein'));
  }
  // All-meat plans need an explicit calcium source. The schema-level Ca:P
  // engine will also fire, but the form-level warning is more actionable.
  if (d.macros.protein >= 85 && d.calciumSource === 'none') {
    warnings.push(t('nutrition.custom.warn.noCalcium'));
  }
  if (d.proteinComposition && d.proteinComposition.bone > 15) {
    warnings.push(t('nutrition.custom.warn.highBone'));
  }
  return warnings;
}
