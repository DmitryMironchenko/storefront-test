'use client';

import { useCallback, useRef, useState } from 'react';

import {
  useBasketCount,
  useBasketItems,
  useBasketStore,
  useBasketSubtotal,
} from '@/entities/basket';
import { getAnonymousId, track } from '@/shared/analytics';

import { submitCheckout } from '../api/submitCheckout';
import {
  CHECKOUT_CURRENCY,
  type CheckoutRequest,
  type CheckoutResponse,
} from './contract';

/** Where the checkout interaction is in its lifecycle. Drives the UI: the CTA
 *  (idle/error), a busy CTA (submitting), or the confirmation (success). */
export type CheckoutStatus = 'idle' | 'submitting' | 'success' | 'error';

export type UseCheckout = {
  status: CheckoutStatus;
  /** The authoritative order, once the server has confirmed it. */
  order: CheckoutResponse | null;
  /** A human-readable message when status is 'error'. */
  error: string | null;
  /** Submit the current basket. No-op while submitting or when empty. */
  submit: () => Promise<void>;
};

// The checkout interaction, as a hook so the basket-page view can own the
// idle/submitting/success/error toggle while this owns the actual sequence:
// build the payload from the basket, fire `checkout_started`, POST, and on
// success fire `checkout_completed`, clear the basket, and expose the order for
// the confirmation. Analytics lives here at the interaction seam (mirrors
// AddToCartButton) — the store stays pure state.
export function useCheckout(): UseCheckout {
  const items = useBasketItems();
  const subtotal = useBasketSubtotal();
  const itemCount = useBasketCount();
  const clear = useBasketStore((state) => state.clear);

  const [status, setStatus] = useState<CheckoutStatus>('idle');
  const [order, setOrder] = useState<CheckoutResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A ref, not `status`, guards re-entry: `status` state updates asynchronously,
  // so two clicks in the same tick would both read 'idle' and fire twice. The
  // ref flips synchronously, so the second call bails immediately.
  const inFlight = useRef(false);

  const submit = useCallback(async () => {
    if (inFlight.current || items.length === 0) return;
    inFlight.current = true;

    setStatus('submitting');
    setError(null);

    const payload: CheckoutRequest = {
      anonymousId: getAnonymousId(),
      currency: CHECKOUT_CURRENCY,
      submittedAt: new Date().toISOString(),
      itemCount,
      lineItems: items.map((item) => ({
        objectID: item.objectID,
        quantity: item.quantity,
        name: item.name,
        brand: item.brand,
        image: item.image,
        price: item.price,
      })),
    };

    // Fire *before* the request: `checkout_started` records intent with the
    // indicative subtotal the user saw; `checkout_completed` later carries the
    // server's authoritative total.
    track({
      name: 'checkout_started',
      currency: CHECKOUT_CURRENCY,
      itemCount,
      subtotal,
    });

    try {
      const result = await submitCheckout(payload);

      track({
        name: 'checkout_completed',
        orderId: result.orderId,
        currency: result.currency,
        itemCount: result.itemCount,
        total: result.total,
      });

      // Order confirmed: empty the basket (the confirmation, not the basket, is
      // now the surface) and expose the result.
      clear();
      setOrder(result);
      setStatus('success');
    } catch (err) {
      // Leave the basket intact so the user can retry; prefer the server's own
      // message (via submitCheckout) and always reassure that nothing was lost.
      const reason =
        err instanceof Error && err.message
          ? err.message
          : 'Something went wrong at checkout.';
      setError(`${reason} Your basket is unchanged.`);
      setStatus('error');
    } finally {
      inFlight.current = false;
    }
  }, [items, itemCount, subtotal, clear]);

  return { status, order, error, submit };
}
