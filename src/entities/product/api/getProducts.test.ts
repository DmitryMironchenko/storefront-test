import { beforeEach, describe, expect, it, vi } from 'vitest';

// getProducts is server-only (it pulls the full Algolia client). Stub the
// `server-only` guard so the accessor can be unit-tested, and mock the client so
// no real network call is made. Mirrors getProduct.test.
vi.mock('server-only', () => ({}));

const getObjects = vi.fn();
vi.mock('@/shared/api/algolia/client', () => ({
  getSearchClient: () => ({ getObjects }),
}));

import { getProducts } from './getProducts';

const record = (objectID: string, price: number) => ({
  objectID,
  name: `catalogue-${objectID}`,
  price,
});

beforeEach(() => {
  getObjects.mockReset();
});

describe('getProducts', () => {
  it('fetches the requested ids in one batched call, keyed by objectID', async () => {
    getObjects.mockResolvedValue({
      results: [record('a', 10), record('b', 20)],
    });

    const map = await getProducts(['a', 'b']);

    expect(getObjects).toHaveBeenCalledTimes(1);
    expect(getObjects).toHaveBeenCalledWith({
      requests: [
        expect.objectContaining({ objectID: 'a' }),
        expect.objectContaining({ objectID: 'b' }),
      ],
    });
    expect(map.get('a')).toEqual(record('a', 10));
    expect(map.get('b')).toEqual(record('b', 20));
  });

  it('de-duplicates ids before requesting', async () => {
    getObjects.mockResolvedValue({ results: [record('a', 10)] });

    await getProducts(['a', 'a', 'a']);

    expect(getObjects).toHaveBeenCalledWith({
      requests: [expect.objectContaining({ objectID: 'a' })],
    });
  });

  it('omits records Algolia returns as null (missing)', async () => {
    getObjects.mockResolvedValue({ results: [record('a', 10), null] });

    const map = await getProducts(['a', 'gone']);

    expect(map.has('a')).toBe(true);
    expect(map.has('gone')).toBe(false);
    expect(map.size).toBe(1);
  });

  it('returns an empty map without calling Algolia for no ids', async () => {
    const map = await getProducts([]);

    expect(map.size).toBe(0);
    expect(getObjects).not.toHaveBeenCalled();
  });

  it('rethrows client failures (e.g. a 5xx / index outage)', async () => {
    getObjects.mockRejectedValue(new Error('index outage'));

    await expect(getProducts(['a'])).rejects.toThrow('index outage');
  });
});
