import { useEffect, useState } from 'react';

const REPO = 'SirAllap/pawcook';
const CACHE_KEY = `pawcook_github_stars_${REPO}`;
const TTL_MS = 60 * 60 * 1000; // 1 hour

type Cached = { value: number; at: number };

/**
 * Fetches the live GitHub star count, cached in localStorage for an
 * hour. Falls back to `null` on error or rate-limit so callers can
 * render a static label ("Star on GitHub") instead of a broken number.
 * Pure client-side — no API key, no proxy.
 */
export function useGithubStars(): number | null {
  const [stars, setStars] = useState<number | null>(() => readCache());

  useEffect(() => {
    const cached = readCache();
    if (cached !== null) {
      setStars(cached);
      return;
    }
    let abandoned = false;
    fetch(`https://api.github.com/repos/${REPO}`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (abandoned || !data) return;
        const count = typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
        if (count === null) return;
        setStars(count);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ value: count, at: Date.now() } satisfies Cached));
        } catch { /* ignore */ }
      })
      .catch(() => { /* rate limit, offline, etc — render fallback */ });
    return () => { abandoned = true; };
  }, []);

  return stars;
}

function readCache(): number | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cached;
    if (!parsed || typeof parsed.value !== 'number' || typeof parsed.at !== 'number') return null;
    if (Date.now() - parsed.at > TTL_MS) return null;
    return parsed.value;
  } catch {
    return null;
  }
}
