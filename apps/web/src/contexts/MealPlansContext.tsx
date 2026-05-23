import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from 'react';
import { MealPlanSchema, type MealPlan } from '@pawcook/shared';

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

function loadStore(): Store {
  if (typeof localStorage === 'undefined') return { version: 1, plans: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, plans: [] };
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'plans' in parsed && Array.isArray((parsed as Store).plans)) {
      const validPlans: MealPlan[] = [];
      for (const candidate of (parsed as Store).plans) {
        const result = MealPlanSchema.safeParse(candidate);
        if (result.success) validPlans.push(result.data);
      }
      return { version: 1, plans: validPlans };
    }
  } catch {
    // fall through
  }
  return { version: 1, plans: [] };
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

  useEffect(() => {
    setPlans(loadStore().plans);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveStore({ version: 1, plans });
  }, [plans, ready]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      setPlans(loadStore().plans);
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addPlan = useCallback((plan: MealPlan) => {
    setPlans((prev) => [plan, ...prev.filter((p) => p.id !== plan.id)]);
  }, []);

  const updatePlan = useCallback((id: string, patch: Partial<MealPlan>) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)));
  }, []);

  const replacePlan = useCallback((plan: MealPlan) => {
    setPlans((prev) => prev.map((p) => (p.id === plan.id ? plan : p)));
  }, []);

  const removePlan = useCallback((id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const removePetReferences = useCallback((petId: string) => {
    setPlans((prev) =>
      prev
        .map((p) =>
          p.petIds.includes(petId)
            ? { ...p, petIds: p.petIds.filter((id) => id !== petId) }
            : p,
        )
        .filter((p) => p.petIds.length > 0),
    );
  }, []);

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
