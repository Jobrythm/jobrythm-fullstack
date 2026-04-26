/**
 * Real Jobrythm API base URLs (no mock layer). The app always talks to the backend
 * for one of these roots; which one is used depends on VITE_API_URL or the
 * current frontend hostname.
 */
export const JOBRYTHM_API_BASE_URLS = [
  'http://localhost:8080/api',
  'https://api.jobrythm.aricummings.com/api',
  'https://api.jobrythm.com/api',
] as const;

const normalizeBase = (url: string) => url.replace(/\/$/, '');

/**
 * Picks the API base for this session. Set `VITE_API_URL` in `.env` to override
 * (e.g. `http://localhost:8080/api` for local development).
 */
export const resolveApiBaseUrl = (): string => {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv) {
    return normalizeBase(fromEnv);
  }

  if (typeof window === 'undefined') {
    return JOBRYTHM_API_BASE_URLS[0];
  }

  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return JOBRYTHM_API_BASE_URLS[0];
  }
  if (host.includes('aricummings')) {
    return JOBRYTHM_API_BASE_URLS[1];
  }
  if (host.includes('jobrythm.com')) {
    return JOBRYTHM_API_BASE_URLS[2];
  }

  return JOBRYTHM_API_BASE_URLS[2];
};
