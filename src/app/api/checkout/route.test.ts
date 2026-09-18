import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProductHit } from '@/entities/product';

// Mock the catalogue accessor so the route is tested without a network call.
// The route's job is validation + re-price orchestration; getProducts has its
// own unit tests.
const getProducts = vi.fn();
vi.mock('@/entities/product/api/getProducts', () => ({
  getProducts: (ids: string[]) => getProducts(ids),
}));

import { POST } from './route';

const post = (body: unknown) =>
  POST(
    new Request('http://localhost/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );

const line = (objectID: string, quantity: number, price: number) => ({
  objectID,
  quantity,
  name: `snapshot-${objectID}`,
  price,
});

const catalogue = (...records: ProductHit[]) =>
  new Map(records.map((r) => [r.objectID, r]));

beforeEach(() => {
  getProducts.mockReset();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /api/checkout', () => {
  it('re-prices from the catalogue and returns an authoritative total + orderId', async () => {
    getProducts.mockResolvedValue(
      catalogue(
        { objectID: 'a', name: 'Camera', price: 100 },
        { objectID: 'b', name: 'Lens', price: 250 },
      ),
    );

    const res = await post({
      anonymousId: 'anon-1',
      currency: 'USD',
      submittedAt: '2026-09-18T00:00:00.000Z',
      itemCount: 3,
      // Client sends deliberately wrong (stale) prices — must be ignored.
      lineItems: [line('a', 2, 1), line('b', 1, 1)],
    });

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.total).toBe(450); // 100*2 + 250*1 from catalogue, not client's 1s
    expect(body.itemCount).toBe(3);
    expect(body.currency).toBe('USD');
    expect(typeof body.orderId).toBe('string');
    expect(body.orderId.length).toBeGreaterThan(0);
    expect(body.lineItems).toEqual([
      {
        objectID: 'a',
        name: 'Camera',
        quantity: 2,
        unitPrice: 100,
        lineTotal: 200,
      },
      {
        objectID: 'b',
        name: 'Lens',
        quantity: 1,
        unitPrice: 250,
        lineTotal: 250,
      },
    ]);
  });

  it('requests exactly the submitted objectIDs from the catalogue', async () => {
    getProducts.mockResolvedValue(
      catalogue({ objectID: 'a', name: 'A', price: 5 }),
    );

    await post({
      anonymousId: 'anon-1',
      currency: 'USD',
      submittedAt: '2026-09-18T00:00:00.000Z',
      itemCount: 1,
      lineItems: [line('a', 1, 5)],
    });

    expect(getProducts).toHaveBeenCalledWith(['a']);
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await post('{not json');
    expect(res.status).toBe(400);
    expect(getProducts).not.toHaveBeenCalled();
  });

  it('rejects an empty basket with 400', async () => {
    const res = await post({
      anonymousId: 'anon-1',
      currency: 'USD',
      submittedAt: '2026-09-18T00:00:00.000Z',
      itemCount: 0,
      lineItems: [],
    });
    expect(res.status).toBe(400);
    expect(getProducts).not.toHaveBeenCalled();
  });

  it('rejects a basket with no priceable lines with 400', async () => {
    getProducts.mockResolvedValue(catalogue()); // nothing resolves

    const res = await post({
      anonymousId: 'anon-1',
      currency: 'USD',
      submittedAt: '2026-09-18T00:00:00.000Z',
      itemCount: 1,
      lineItems: [line('gone', 1, 10)],
    });

    expect(res.status).toBe(400);
  });

  it('returns 502 when the catalogue fetch fails', async () => {
    getProducts.mockRejectedValue(new Error('index outage'));

    const res = await post({
      anonymousId: 'anon-1',
      currency: 'USD',
      submittedAt: '2026-09-18T00:00:00.000Z',
      itemCount: 1,
      lineItems: [line('a', 1, 10)],
    });

    expect(res.status).toBe(502);
  });
});
