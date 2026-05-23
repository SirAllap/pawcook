import { useTranslation } from 'react-i18next';
import { getIngredient } from '@pawcook/shared';

/**
 * Returns a localized label for an ingredient id. Translation keys live under
 * `meatData.<id>.label`, `vegData.<id>.label`, or `fruitData.<id>.label`
 * depending on the category — we try each in turn, falling back to the
 * English label embedded in the shared catalog, then the raw id.
 */
export function useTranslateIngredient(): (id: string) => string {
  const { t, i18n } = useTranslation();
  return (id: string) => {
    const fallback = getIngredient(id)?.label ?? id;
    for (const prefix of ['meatData', 'vegData', 'fruitData'] as const) {
      const key = `${prefix}.${id}.label`;
      if (i18n.exists(key)) return t(key, { defaultValue: fallback });
    }
    return fallback;
  };
}
