import { useTranslation } from 'react-i18next';
import { X, Plus } from 'lucide-react';
import { useState } from 'react';
import { INGREDIENTS } from '@pawcook/shared';
import { SectionLabel } from '../ui/section-label';
import { useTranslateIngredient } from '../../lib/translate-ingredient';
import { cn } from '../../lib/cn';

const COMMON_ALLERGENS = ['beef', 'chicken', 'pork', 'lamb', 'salmon', 'whitefish'];

export function AllergyPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useTranslation();
  const translateIngredient = useTranslateIngredient();
  const [adding, setAdding] = useState(false);

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  const otherCandidates = INGREDIENTS.filter(
    (i) => !value.includes(i.id) && !COMMON_ALLERGENS.includes(i.id),
  );
  const customSelected = value.filter((id) => !COMMON_ALLERGENS.includes(id));

  return (
    <div className="space-y-3">
      <SectionLabel>{t('pets.allergies.label')}</SectionLabel>
      <p className="text-xs text-muted-fg leading-relaxed">{t('pets.allergies.help')}</p>

      <div className="flex flex-wrap gap-2">
        {COMMON_ALLERGENS.map((id) => {
          const active = value.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              aria-pressed={active}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold',
                'min-h-[36px] border transition-colors',
                active
                  ? 'bg-danger/15 border-danger/40 text-danger'
                  : 'bg-surface-2 border-border text-muted-fg hover:text-foreground',
              )}
            >
              {active
                ? <X className="h-3 w-3" aria-hidden />
                : <Plus className="h-3 w-3" aria-hidden />}
              {translateIngredient(id)}
            </button>
          );
        })}
      </div>

      {customSelected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customSelected.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              aria-label={t('pets.allergies.removeOne', {
                defaultValue: 'Remove {{name}}',
                name: translateIngredient(id),
              })}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-danger/15 border border-danger/40 text-danger min-h-[36px]"
            >
              <X className="h-3 w-3" aria-hidden />
              {translateIngredient(id)}
            </button>
          ))}
        </div>
      )}

      {!adding ? (
        otherCandidates.length > 0 && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-surface-2 border border-dashed border-border text-muted-fg hover:text-foreground transition-colors min-h-[36px]"
          >
            <Plus className="h-3 w-3" aria-hidden />
            {t('pets.allergies.addOther')}
          </button>
        )
      ) : (
        <div className="rounded-2xl border border-border bg-surface-2 p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-fg">
            {t('pets.allergies.pickOther')}
          </p>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {otherCandidates.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => { toggle(i.id); setAdding(false); }}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-surface border border-border text-foreground hover:bg-surface-3 transition-colors min-h-[36px]"
              >
                {translateIngredient(i.id)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="text-[11px] font-bold uppercase tracking-wider text-muted-fg hover:text-foreground"
          >
            {t('pets.allergies.done')}
          </button>
        </div>
      )}
    </div>
  );
}
