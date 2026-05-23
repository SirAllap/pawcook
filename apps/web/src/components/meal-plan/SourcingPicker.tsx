import { useTranslation } from 'react-i18next';
import type {
  AccessibilityTier, SourcingPrefs, VarietyTier,
} from '@pawcook/shared';
import { SectionLabel } from '../ui/section-label';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Switch } from '../ui/switch';

const VARIETY_OPTIONS: VarietyTier[] = ['standard', 'diverse', 'novel'];
const ACCESS_OPTIONS: AccessibilityTier[] = ['easy', 'specialty'];

export function SourcingPicker({
  value,
  onChange,
}: {
  value: SourcingPrefs;
  onChange: (next: SourcingPrefs) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SectionLabel>{t('mealPlan.sourcing.varietyLabel')}</SectionLabel>
        <p className="text-xs text-muted-fg leading-relaxed">
          {t('mealPlan.sourcing.varietyHelp')}
        </p>
        <ToggleGroup
          type="single"
          value={value.variety}
          onValueChange={(v) => v && onChange({ ...value, variety: v as VarietyTier })}
          className="grid grid-cols-3 w-full"
        >
          {VARIETY_OPTIONS.map((opt) => (
            <ToggleGroupItem key={opt} value={opt}>
              {t(`mealPlan.sourcing.variety.${opt}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="space-y-2">
        <SectionLabel>{t('mealPlan.sourcing.accessLabel')}</SectionLabel>
        <p className="text-xs text-muted-fg leading-relaxed">
          {t('mealPlan.sourcing.accessHelp')}
        </p>
        <ToggleGroup
          type="single"
          value={value.accessibility}
          onValueChange={(v) => v && onChange({ ...value, accessibility: v as AccessibilityTier })}
          className="grid grid-cols-2 w-full"
        >
          {ACCESS_OPTIONS.map((opt) => (
            <ToggleGroupItem key={opt} value={opt}>
              {t(`mealPlan.sourcing.access.${opt}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="space-y-2.5">
        <SectionLabel>{t('mealPlan.sourcing.prefsLabel')}</SectionLabel>
        <SourcingFlag
          label={t('mealPlan.sourcing.preferWildFish')}
          checked={value.preferWildFish}
          onChange={(v) => onChange({ ...value, preferWildFish: v })}
        />
        <SourcingFlag
          label={t('mealPlan.sourcing.preferGrassFed')}
          checked={value.preferGrassFed}
          onChange={(v) => onChange({ ...value, preferGrassFed: v })}
        />
        <SourcingFlag
          label={t('mealPlan.sourcing.preferOrganic')}
          checked={value.preferOrganic}
          onChange={(v) => onChange({ ...value, preferOrganic: v })}
        />
      </div>
    </div>
  );
}

function SourcingFlag({
  label, checked, onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-2 p-3 cursor-pointer">
      <span className="text-sm font-bold text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
