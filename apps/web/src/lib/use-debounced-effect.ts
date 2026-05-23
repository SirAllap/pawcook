import { useEffect, type DependencyList } from 'react';

/**
 * Run `effect` after `delay` ms of inactivity on `deps`. Useful for
 * persisting form state to localStorage without writing on every keystroke.
 */
export function useDebouncedEffect(
  effect: () => void,
  deps: DependencyList,
  delay = 250,
): void {
  // We intentionally re-run when any dep changes; eslint-disable below.
  useEffect(() => {
    const id = window.setTimeout(effect, delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}
