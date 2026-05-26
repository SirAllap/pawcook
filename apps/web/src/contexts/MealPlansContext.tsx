import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from 'react';
import { MealPlanSchema, migratePlan, type MealPlan } from '@pawcook/shared';

const STORAGE_KEY = 'pawcook_meal_plans_v1';

type Store = { version: 1; plans: MealPlan[] };

type Ctx = {
  plans: MealPlan[];
  getPlan: (id: string) => MealPlan | undefined;
  addPlan: (plan: MealPlan) => void;
  updatePlan: (id: string, patch: Partial<MealPlan>) => void;
  replacePlan: (plan: MealPlan) => void;
  removePlan: (id: string) => void;
  /**
   * Strip a deleted pet from every plan, dropping plans that referenced only
   * that pet. Called from the PetProfiles flow so we never persist plans that
   * point at a vanished pet.
   */
  removePetReferences: (petId: string) => void;
  ready: boolean;
};

const MealPlansContext = createContext<Ctx | null>(null);

type LoadResult = { store: Store; ok: boolean };

function loadStore(): LoadResult {
  if (typeof localStorage === 'undefined') return { store: { version: 1, plans: [] }, ok: true };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { store: { version: 1, plans: [] }, ok: true };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'plans' in parsed && Array.isArray((parsed as Store).plans)) {
      const validPlans: MealPlan[] = [];
      for (const candidate of (parsed as Store).plans) {
        // Run migrations before Zod parse — older saved plans are
        // missing v2 fields and would otherwise be silently dropped.
        const migrated = migratePlan(candidate) ?? candidate;
        const result = MealPlanSchema.safeParse(migrated);
        if (result.success) validPlans.push(result.data);
      }
      return { store: { version: 1, plans: validPlans }, ok: true };
    }
  } catch { /* fall through */ }
  // Parse / shape failure: stash the raw bytes under a sibling key so the
  // user has a recoverable copy when their next save effect would
  // otherwise blow over the corrupt-but-present data with an empty array.
  try { localStorage.setItem(`${STORAGE_KEY}_corrupt`, raw); } catch { /* ignore */ }
  return { store: { version: 1, plans: [] }, ok: false };
}

function saveStore(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota / private-mode failures
  }
}

export function MealPlansProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [ready, setReady] = useState(false);
  // When loadStore() couldn't parse the saved blob we still hand the app an
  // empty plans array so it renders, but we hold off auto-persisting that
  // empty array — otherwise a transiently-corrupt file gets blown away on
  // mount. The first real user action (add/update/remove) flips this and
  // resumes normal persistence.
  const [persistOk, setPersistOk] = useState(true);

  useEffect(() => {
    const { store, ok } = loadStore();
    setPlans(store.plans);
    setPersistOk(ok);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !persistOk) return;
    saveStore({ version: 1, plans });
  }, [plans, ready, persistOk]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      const { store, ok } = loadStore();
      setPlans(store.plans);
      setPersistOk(ok);
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Any mutating callback below must re-enable persistence — the user has
  // shown intent, so it's safe to overwrite the corrupt backup now.
  const armPersist = useCallback(() => setPersistOk(true), []);

  const addPlan = useCallback((plan: MealPlan) => {
    armPersist();
    setPlans((prev) => [plan, ...prev.filter((p) => p.id !== plan.id)]);
  }, [armPersist]);

  const updatePlan = useCallback((id: string, patch: Partial<MealPlan>) => {
    armPersist();
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)));
  }, [armPersist]);

  const replacePlan = useCallback((plan: MealPlan) => {
    armPersist();
    setPlans((prev) => prev.map((p) => (p.id === plan.id ? plan : p)));
  }, [armPersist]);

  const removePlan = useCallback((id: string) => {
    armPersist();
    setPlans((prev) => prev.filter((p) => p.id !== id));
  }, [armPersist]);

  const removePetReferences = useCallback((petId: string) => {
    armPersist();
    setPlans((prev) =>
      prev
        .map((p) =>
          p.petIds.includes(petId)
            ? { ...p, petIds: p.petIds.filter((id) => id !== petId) }
            : p,
        )
        .filter((p) => p.petIds.length > 0),
    );
  }, [armPersist]);

  const getPlan = useCallback((id: string) => plans.find((p) => p.id === id), [plans]);

  const value = useMemo<Ctx>(() => ({
    plans, getPlan, addPlan, updatePlan, replacePlan, removePlan, removePetReferences, ready,
  }), [plans, getPlan, addPlan, updatePlan, replacePlan, removePlan, removePetReferences, ready]);

  return <MealPlansContext.Provider value={value}>{children}</MealPlansContext.Provider>;
}

export function useMealPlans(): Ctx {
  const ctx = useContext(MealPlansContext);
  if (!ctx) throw new Error('useMealPlans must be used inside <MealPlansProvider>');
  return ctx;
}
