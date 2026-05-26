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

type LoadResult = { store: Store; ok: boolean };

function loadStore(): LoadResult {
  if (typeof localStorage === 'undefined') return { store: { version: 1, pets: [] }, ok: true };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { store: { version: 1, pets: [] }, ok: true };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'pets' in parsed && Array.isArray((parsed as Store).pets)) {
      const validPets: PetProfile[] = [];
      for (const candidate of (parsed as Store).pets) {
        const result = PetProfileSchema.safeParse(candidate);
        if (result.success) validPets.push(result.data);
      }
      return { store: { version: 1, pets: validPets }, ok: true };
    }
  } catch { /* fall through */ }
  // Parse / shape failure: stash a backup so the next save effect doesn't
  // permanently overwrite the corrupt-but-recoverable bytes with an empty
  // pets array.
  try { localStorage.setItem(`${STORAGE_KEY}_corrupt`, raw); } catch { /* ignore */ }
  return { store: { version: 1, pets: [] }, ok: false };
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
  // See MealPlansContext for the rationale — when load fails we hold off
  // auto-persisting the empty pets array so transient corruption doesn't
  // permanently destroy the user's data. Flipped by any mutator below.
  const [persistOk, setPersistOk] = useState(true);

  useEffect(() => {
    const { store, ok } = loadStore();
    setPets(store.pets);
    setPersistOk(ok);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !persistOk) return;
    saveStore({ version: 1, pets });
  }, [pets, ready, persistOk]);

  // Sync across tabs
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      const { store, ok } = loadStore();
      setPets(store.pets);
      setPersistOk(ok);
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const armPersist = useCallback(() => setPersistOk(true), []);

  const addPet = useCallback((pet: PetProfile) => {
    armPersist();
    setPets((prev) => [...prev.filter((p) => p.id !== pet.id), pet]);
  }, [armPersist]);

  const updatePet = useCallback((id: string, patch: Partial<PetProfile>) => {
    armPersist();
    setPets((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      const merged = { ...p, ...patch, id: p.id, updatedAt: new Date().toISOString() };
      const parsed = PetProfileSchema.safeParse(merged);
      return parsed.success ? parsed.data : p;
    }));
  }, [armPersist]);

  const removePet = useCallback((id: string) => {
    armPersist();
    setPets((prev) => prev.filter((p) => p.id !== id));
  }, [armPersist]);

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
