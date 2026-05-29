import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import type { HealthCondition } from '@pawcook/shared';
import { SectionLabel } from '../ui/section-label';
import { cn } from '../../lib/cn';

const ALL_CONDITIONS: HealthCondition[] = [
  'allergy', 'kidney', 'pancreatitis', 'diabetes', 'joint', 'gi_sensitive', 'obese',
];

export function ConditionPicker({
  value,
  onChange,
}: {
  value: HealthCondition[];
  onChange: (next: HealthCondition[]) => void;
}) {
  const { t } = useTranslation();

  function toggle(condition: HealthCondition) {
    onChange(value.includes(condition) ? value.filter((c) => c !== condition) : [...value, condition]);
  }

  return (
    <div className="space-y-3">
      <SectionLabel>{t('pets.conditions.label')}</SectionLabel>
      <p className="text-xs text-muted-fg leading-relaxed">{t('pets.conditions.help')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ALL_CONDITIONS.map((condition) => {
          const active = value.includes(condition);
          return (
            <button
              key={condition}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={() => toggle(condition)}
              className={cn(
                'flex items-start gap-3 p-3 rounded-2xl border text-left',
                'transition-colors',
                active
                  ? 'border-warning/50 bg-warning/8 text-foreground'
                  : 'border-border bg-surface-2 text-muted-fg hover:text-foreground',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center',
                  active ? 'border-warning bg-warning text-warning-fg' : 'border-border bg-surface',
                )}
              >
                {active && <Check className="h-3 w-3" aria-hidden="true" />}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-foreground">
                  {t(`pets.conditions.${condition}.label`)}
                </span>
                <span className="block text-[11px] text-muted-fg mt-0.5 leading-snug">
                  {t(`pets.conditions.${condition}.help`)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
