import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSpecies } from './species';

/**
 * Species-aware translation hook.
 *
 * Returns a `t` function that prefers a `${key}_cat` variant when the
 * current species is `cat`, and falls back to the base `key`. Lets us
 * keep the dog copy as the canonical key while overriding individual
 * strings for cats without forking every page.
 *
 * Usage:
 *   const t = useSpeciesT();
 *   t('cooking.subtitle')   // → cooking.subtitle_cat for cats, base for dogs
 *
 * Interpolation values still work: t('foo', { count: 3 }).
 */
export function useSpeciesT() {
  const { t, i18n } = useTranslation();
  const { species } = useSpecies();
  return useCallback(
    (key: string, opts?: Record<string, unknown>) => {
      if (species === 'cat') {
        const catKey = `${key}_cat`;
        if (i18n.exists(catKey)) return t(catKey, opts) as string;
      }
      return t(key, opts) as string;
    },
    [t, i18n, species]
  );
}
