import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Species } from '@pawcook/shared';

export type { Species };

const STORAGE_KEY = 'pawcook_species';

interface SpeciesContextValue {
  species: Species;
  setSpecies: (s: Species) => void;
  toggle: () => void;
  hasChosen: boolean; // false until user explicitly picks
}

const SpeciesContext = createContext<SpeciesContextValue | null>(null);

function readStored(): { value: Species; hasChosen: boolean } {
  if (typeof window === 'undefined') return { value: 'dog', hasChosen: false };
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === 'dog' || raw === 'cat') return { value: raw, hasChosen: true };
  return { value: 'dog', hasChosen: false };
}

export function SpeciesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(readStored);

  // Sync across tabs
  useEffect(() => {
    const handle = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'dog' || e.newValue === 'cat')) {
        setState({ value: e.newValue, hasChosen: true });
      }
    };
    window.addEventListener('storage', handle);
    return () => window.removeEventListener('storage', handle);
  }, []);

  const setSpecies = useCallback((s: Species) => {
    window.localStorage.setItem(STORAGE_KEY, s);
    setState({ value: s, hasChosen: true });
  }, []);

  const toggle = useCallback(() => {
    setSpecies(state.value === 'dog' ? 'cat' : 'dog');
  }, [state.value, setSpecies]);

  return (
    <SpeciesContext.Provider
      value={{ species: state.value, setSpecies, toggle, hasChosen: state.hasChosen }}
    >
      {children}
    </SpeciesContext.Provider>
  );
}

export function useSpecies(): SpeciesContextValue {
  const ctx = useContext(SpeciesContext);
  if (!ctx) throw new Error('useSpecies must be used inside <SpeciesProvider>');
  return ctx;
}
