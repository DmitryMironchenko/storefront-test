import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/shared/analytics', () => ({
  track,
  getAnonymousId: () => 'anon-test',
}));

const { submitCheckout } = vi.hoisted(() => ({ submitCheckout: vi.fn() }));
vi.mock('../api/submitCheckout', () => ({ submitCheckout }));

import { useBasketStore } from '@/entities/basket';
import type { CheckoutResponse } from './contract';
import { useCheckout } from './useCheckout';

const order: CheckoutResponse = {
  orderId: 'order-123',
  currency: 'USD',
  itemCount: 3,
  total: 450,
  lineItems: [
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
  ],
};

function seedBasket() {
  useBasketStore.setState({
    hasHydrated: true,
    items: [
      { objectID: 'a', name: 'Camera', price: 90, quantity: 2 },
      { objectID: 'b', name: 'Lens', price: 200, quantity: 1 },
    ],
  });
}

function reset() {
  localStorage.clear();
  useBasketStore.setState({ items: [], hasHydrated: true });
  track.mockReset();
  submitCheckout.mockReset();
}

beforeEach(reset);
afterEach(reset);

describe('useCheckout', () => {
  it('submits the basket as objectID + quantity + snapshot with USD currency', async () => {
    seedBasket();
    submitCheckout.mockResolvedValue(order);
    const { result } = renderHook(() => useCheckout());

    await act(async () => {
      await result.current.submit();
    });

    expect(submitCheckout).toHaveBeenCalledTimes(1);
    const payload = submitCheckout.mock.calls[0][0];
    expect(payload).toMatchObject({
      anonymousId: 'anon-test',
      currency: 'USD',
      itemCount: 3,
      lineItems: [
        { objectID: 'a', quantity: 2, name: 'Camera', price: 90 },
        { objectID: 'b', quantity: 1, name: 'Lens', price: 200 },
      ],
    });
    expect(typeof payload.submittedAt).toBe('string');
  });

  it('fires checkout_started (indicative subtotal) then checkout_completed (server total)', async () => {
    seedBasket();
    submitCheckout.mockResolvedValue(order);
    const { result } = renderHook(() => useCheckout());

    await act(async () => {
      await result.current.submit();
    });

    expect(track).toHaveBeenNthCalledWith(1, {
      name: 'checkout_started',
      currency: 'USD',
      itemCount: 3,
      subtotal: 380, // 90*2 + 200*1, the indicative add-time prices
    });
    expect(track).toHaveBeenNthCalledWith(2, {
      name: 'checkout_completed',
      orderId: 'order-123',
      currency: 'USD',
      itemCount: 3,
      total: 450, // authoritative server total
    });
  });

  it('clears the basket and exposes the order on success', async () => {
    seedBasket();
    submitCheckout.mockResolvedValue(order);
    const { result } = renderHook(() => useCheckout());

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.status).toBe('success');
    expect(result.current.order).toEqual(order);
    expect(useBasketStore.getState().items).toEqual([]);
  });

  it('sets an error and leaves the basket intact when the request fails', async () => {
    seedBasket();
    submitCheckout.mockRejectedValue(
      new Error('None of the basket items are available.'),
    );
    const { result } = renderHook(() => useCheckout());

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.status).toBe('error');
    // Surfaces the thrown (server) message, with the basket-intact reassurance.
    expect(result.current.error).toContain(
      'None of the basket items are available.',
    );
    expect(result.current.error).toContain('Your basket is unchanged.');
    expect(useBasketStore.getState().items).toHaveLength(2);
    // checkout_completed must not fire on failure.
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'checkout_started' }),
    );
  });

  it('does nothing when the basket is empty', async () => {
    const { result } = renderHook(() => useCheckout());

    await act(async () => {
      await result.current.submit();
    });

    expect(submitCheckout).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('does not double-submit when clicked twice in the same tick', async () => {
    seedBasket();
    let resolve!: (value: CheckoutResponse) => void;
    submitCheckout.mockReturnValue(
      new Promise<CheckoutResponse>((r) => {
        resolve = r;
      }),
    );
    const { result } = renderHook(() => useCheckout());

    await act(async () => {
      // Two synchronous calls, before any state update flushes: the ref guard
      // must block the second even though `status` is still 'idle'.
      void result.current.submit();
      void result.current.submit();
      resolve(order);
    });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(submitCheckout).toHaveBeenCalledTimes(1);
  });
});
