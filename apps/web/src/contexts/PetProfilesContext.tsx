import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from 'react';
import { PetProfileSchema, type PetProfile } from '@pawcook/shared';

const STORAGE_KEY = 'pawcook_pets_v1';

type Store = {
  version: 1;
  pets: PetProfile[];
};

type Ctx = {
  pets: PetProfile[];
  getPet: (id: string) => PetProfile | undefined;
  addPet: (pet: PetProfile) => void;
  updatePet: (id: string, patch: Partial<PetProfile>) => void;
  removePet: (id: string) => void;
  ready: boolean;
};

const PetProfilesContext = createContext<Ctx | null>(null);

function loadStore(): Store {
  if (typeof localStorage === 'undefined') return { version: 1, pets: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, pets: [] };
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'pets' in parsed && Array.isArray((parsed as Store).pets)) {
      const validPets: PetProfile[] = [];
      for (const candidate of (parsed as Store).pets) {
        const result = PetProfileSchema.safeParse(candidate);
        if (result.success) validPets.push(result.data);
      }
      return { version: 1, pets: validPets };
    }
    return { version: 1, pets: [] };
  } catch {
    return { version: 1, pets: [] };
  }
}

function saveStore(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage may be full or unavailable in private mode — silently ignore
  }
}

export function PetProfilesProvider({ children }: { children: ReactNode }) {
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const store = loadStore();
    setPets(store.pets);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveStore({ version: 1, pets });
  }, [pets, ready]);

  // Sync across tabs
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      setPets(loadStore().pets);
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addPet = useCallback((pet: PetProfile) => {
    setPets((prev) => [...prev.filter((p) => p.id !== pet.id), pet]);
  }, []);

  const updatePet = useCallback((id: string, patch: Partial<PetProfile>) => {
    setPets((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      const merged = { ...p, ...patch, id: p.id, updatedAt: new Date().toISOString() };
      const parsed = PetProfileSchema.safeParse(merged);
      return parsed.success ? parsed.data : p;
    }));
  }, []);

  const removePet = useCallback((id: string) => {
    setPets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getPet = useCallback((id: string) => pets.find((p) => p.id === id), [pets]);

  const value = useMemo<Ctx>(() => ({
    pets, getPet, addPet, updatePet, removePet, ready,
  }), [pets, getPet, addPet, updatePet, removePet, ready]);

  return <PetProfilesContext.Provider value={value}>{children}</PetProfilesContext.Provider>;
}

export function usePets(): Ctx {
  const ctx = useContext(PetProfilesContext);
  if (!ctx) throw new Error('usePets must be used inside <PetProfilesProvider>');
  return ctx;
}
