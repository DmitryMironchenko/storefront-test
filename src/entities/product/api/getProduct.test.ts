import { beforeEach, describe, expect, it, vi } from 'vitest';

// getProduct is server-only (it pulls the full Algolia client). Stub the
// `server-only` guard so the data-access logic can be unit-tested in isolation,
// and mock the client so no real network call is made.
vi.mock('server-only', () => ({}));

const getObject = vi.fn();
vi.mock('@/shared/api/algolia/client', () => ({
  getSearchClient: () => ({ getObject }),
}));

import { getProduct } from './getProduct';

const record = {
  objectID: '4397400',
  name: 'Google - Chromecast - Black',
  brand: 'Google',
  price: 35,
};

beforeEach(() => {
  getObject.mockReset();
});

describe('getProduct', () => {
  it('returns the product record for a known objectID', async () => {
    getObject.mockResolvedValue(record);
    await expect(getProduct('4397400')).resolves.toEqual(record);
    expect(getObject).toHaveBeenCalledWith(
      expect.objectContaining({ objectID: '4397400' }),
    );
  });

  it('returns null when the record does not exist (404)', async () => {
    getObject.mockRejectedValue(
      Object.assign(new Error('ObjectID does not exist'), { status: 404 }),
    );
    await expect(getProduct('missing')).resolves.toBeNull();
  });

  it('rethrows non-404 failures (e.g. a 5xx / index outage)', async () => {
    getObject.mockRejectedValue(
      Object.assign(new Error('Internal error'), { status: 500 }),
    );
    await expect(getProduct('4397400')).rejects.toThrow('Internal error');
  });

  it('rethrows errors that carry no status (e.g. a network drop)', async () => {
    getObject.mockRejectedValue(new Error('network down'));
    await expect(getProduct('4397400')).rejects.toThrow('network down');
  });
});
