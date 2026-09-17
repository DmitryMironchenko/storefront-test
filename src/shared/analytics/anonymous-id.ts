// The anonymous (pseudonymous) visitor id that stamps every analytics event.
//
// It answers "which browser did this sequence of events come from" without any
// login or PII — a random UUID minted on first need and kept in localStorage so
// it survives reloads and return visits. Storage mirrors the basket store's
// approach (see entities/basket/model/store.ts): guard for a missing `window`
// (server render) and swallow storage failures (private mode / blocked cookies)
// rather than let analytics throw into a call site.

export const ANONYMOUS_ID_KEY = 'breitling-anonymous-id';

// Per-tab cache. Two jobs: it saves a localStorage read on every event, and —
// crucially — it keeps the id stable for the page's lifetime even when the
// *write* failed (private mode), so a session's events still correlate. Only
// ever populated on the client; see the server guard in getAnonymousId.
let cachedId: string | null = null;

function readStored(): string | null {
  try {
    return window.localStorage.getItem(ANONYMOUS_ID_KEY);
  } catch {
    return null;
  }
}

function persist(id: string): void {
  try {
    window.localStorage.setItem(ANONYMOUS_ID_KEY, id);
  } catch {
    // Blocked / full storage — the in-memory cache still gives a stable id for
    // this page load, which is enough to stitch a session's events together.
  }
}

/** A fresh id. Prefers a UUID, but `crypto.randomUUID` is only defined in secure
 *  contexts (HTTPS / localhost); on a plain-HTTP deployment it is absent and
 *  would throw. Fall back to a good-enough random string — this is a
 *  pseudonymous analytics id, not a security token. */
function mintId(): string {
  try {
    if (
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
    ) {
      return crypto.randomUUID();
    }
  } catch {
    // Fall through to the manual generator.
  }
  return `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * The stable pseudonymous id for this browser. Reads (and lazily creates) the
 * persisted id on the client; on the server it returns a throwaway id without
 * caching, since track() only ever fires from client effects and handlers and
 * module state on the server is shared across requests.
 */
export function getAnonymousId(): string {
  if (typeof window === 'undefined') {
    return mintId();
  }

  if (cachedId) return cachedId;

  const stored = readStored();
  if (stored) {
    cachedId = stored;
    return stored;
  }

  const fresh = mintId();
  cachedId = fresh;
  persist(fresh);
  return fresh;
}

/** Clears the in-memory cache. Exported for tests, which need each case to
 *  start from a clean session; not used in application code. */
export function resetAnonymousIdCache(): void {
  cachedId = null;
}
