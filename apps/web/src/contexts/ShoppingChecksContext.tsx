import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'pawcook_shopping_checks_v1';

type ChecksByPlan = Record<string, string[]>;

interface Ctx {
  getChecks: (planId: string) => Set<string>;
  toggle: (planId: string, itemKey: string) => void;
  ready: boolean;
}

const ShoppingChecksContext = createContext<Ctx | null>(null);

function loadStore(): ChecksByPlan {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object') {
      const out: ChecksByPlan = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (Array.isArray(v) && v.every((x) => typeof x === 'string')) out[k] = v as string[];
      }
      return out;
    }
    return {};
  } catch {
    return {};
  }
}

function saveStore(store: ChecksByPlan) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

export function ShoppingChecksProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<ChecksByPlan>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setStore(loadStore());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveStore(store);
  }, [store, ready]);

  const getChecks = useCallback(
    (planId: string) => new Set(store[planId] ?? []),
    [store],
  );

  const toggle = useCallback((planId: string, itemKey: string) => {
    setStore((prev) => {
      const current = new Set(prev[planId] ?? []);
      if (current.has(itemKey)) current.delete(itemKey);
      else current.add(itemKey);
      return { ...prev, [planId]: Array.from(current) };
    });
  }, []);

  const value = useMemo<Ctx>(() => ({ getChecks, toggle, ready }), [getChecks, toggle, ready]);

  return (
    <ShoppingChecksContext.Provider value={value}>
      {children}
    </ShoppingChecksContext.Provider>
  );
}

export function useShoppingChecks(): Ctx {
  const ctx = useContext(ShoppingChecksContext);
  if (!ctx) throw new Error('useShoppingChecks must be used inside <ShoppingChecksProvider>');
  return ctx;
}
