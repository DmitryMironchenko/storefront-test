import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ANONYMOUS_ID_KEY,
  getAnonymousId,
  resetAnonymousIdCache,
} from './anonymous-id';

beforeEach(() => {
  window.localStorage.clear();
  resetAnonymousIdCache();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getAnonymousId', () => {
  it('mints an id and persists it under the storage key', () => {
    const id = getAnonymousId();

    expect(id).toEqual(expect.any(String));
    expect(id.length).toBeGreaterThan(0);
    expect(window.localStorage.getItem(ANONYMOUS_ID_KEY)).toBe(id);
  });

  it('returns the same id across calls in one session', () => {
    expect(getAnonymousId()).toBe(getAnonymousId());
  });

  it('reuses an id already stored from a previous session', () => {
    window.localStorage.setItem(ANONYMOUS_ID_KEY, 'prior-visitor');
    expect(getAnonymousId()).toBe('prior-visitor');
  });

  it('still mints a usable id outside a secure context (no crypto.randomUUID)', () => {
    // Plain-HTTP deployments have no crypto.randomUUID; getAnonymousId must fall
    // back rather than throw into the analytics call site.
    vi.spyOn(crypto, 'randomUUID').mockImplementation(() => {
      throw new TypeError('randomUUID is not available');
    });

    const id = getAnonymousId();

    expect(id).toEqual(expect.any(String));
    expect(id.length).toBeGreaterThan(0);
    expect(window.localStorage.getItem(ANONYMOUS_ID_KEY)).toBe(id);
  });

  it('stays stable for the page load even when storage writes throw', () => {
    // Private-mode / blocked storage: setItem throws. The id must still be
    // stable within the session via the in-memory cache.
    vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(
      () => {
        throw new DOMException('blocked', 'SecurityError');
      },
    );

    const first = getAnonymousId();
    const second = getAnonymousId();

    expect(first).toBe(second);
  });
});
