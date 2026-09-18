import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CheckoutRequest, CheckoutResponse } from '../model/contract';
import { submitCheckout } from './submitCheckout';

const request: CheckoutRequest = {
  anonymousId: 'anon-1',
  currency: 'USD',
  submittedAt: '2026-09-18T00:00:00.000Z',
  itemCount: 1,
  lineItems: [{ objectID: 'a', quantity: 1, name: 'Camera', price: 100 }],
};

const order: CheckoutResponse = {
  orderId: 'order-1',
  currency: 'USD',
  itemCount: 1,
  total: 100,
  lineItems: [
    {
      objectID: 'a',
      name: 'Camera',
      quantity: 1,
      unitPrice: 100,
      lineTotal: 100,
    },
  ],
};

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('submitCheckout', () => {
  it('POSTs the payload to /api/checkout and returns the parsed order', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(order), { status: 200 }),
    );

    await expect(submitCheckout(request)).resolves.toEqual(order);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/checkout');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(request);
  });

  it("throws the server's own error message when the response carries one", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ error: 'None of the basket items are available.' }),
        {
          status: 400,
        },
      ),
    );

    await expect(submitCheckout(request)).rejects.toThrow(
      'None of the basket items are available.',
    );
  });

  it('falls back to a status message when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(
      new Response('gateway timeout', { status: 502 }),
    );

    await expect(submitCheckout(request)).rejects.toThrow(
      'Checkout failed (502).',
    );
  });
});
