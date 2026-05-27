import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'pawcook_onboarding_v1';

// Onboarding state lives in localStorage like the other contexts so that a
// returning user keeps their "I've already done this" memory across reloads.
// Single source of truth for: which starter-flow steps have been seen,
// which template (if any) seeded the household, and a first-run timestamp.
interface OnboardingStore {
  version: 1;
  completedSteps: string[];
  appliedTemplateId?: string;
  firstRunAt?: number;
}

interface Ctx {
  store: OnboardingStore;
  markStep: (step: string) => void;
  hasStep: (step: string) => boolean;
  setAppliedTemplate: (templateId: string | undefined) => void;
  reset: () => void;
  ready: boolean;
}

const OnboardingContext = createContext<Ctx | null>(null);

function emptyStore(): OnboardingStore {
  return { version: 1, completedSteps: [] };
}

function loadStore(): OnboardingStore {
  if (typeof localStorage === 'undefined') return emptyStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return emptyStore();
    const obj = parsed as Partial<OnboardingStore>;
    return {
      version: 1,
      completedSteps: Array.isArray(obj.completedSteps)
        ? obj.completedSteps.filter((s): s is string => typeof s === 'string')
        : [],
      appliedTemplateId:
        typeof obj.appliedTemplateId === 'string' ? obj.appliedTemplateId : undefined,
      firstRunAt: typeof obj.firstRunAt === 'number' ? obj.firstRunAt : undefined,
    };
  } catch {
    return emptyStore();
  }
}

function saveStore(store: OnboardingStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage may be full or unavailable in private mode — silently ignore
  }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<OnboardingStore>(emptyStore);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadStore();
    if (!loaded.firstRunAt) loaded.firstRunAt = Date.now();
    setStore(loaded);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveStore(store);
  }, [store, ready]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      setStore(loadStore());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const markStep = useCallback((step: string) => {
    setStore((prev) =>
      prev.completedSteps.includes(step)
        ? prev
        : { ...prev, completedSteps: [...prev.completedSteps, step] },
    );
  }, []);

  const hasStep = useCallback(
    (step: string) => store.completedSteps.includes(step),
    [store.completedSteps],
  );

  const setAppliedTemplate = useCallback((templateId: string | undefined) => {
    setStore((prev) => ({ ...prev, appliedTemplateId: templateId }));
  }, []);

  const reset = useCallback(() => {
    setStore({ ...emptyStore(), firstRunAt: Date.now() });
  }, []);

  const value = useMemo<Ctx>(
    () => ({ store, markStep, hasStep, setAppliedTemplate, reset, ready }),
    [store, markStep, hasStep, setAppliedTemplate, reset, ready],
  );

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}

export function useOnboarding(): Ctx {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>');
  return ctx;
}
