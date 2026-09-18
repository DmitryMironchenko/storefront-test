// Client-side caller for POST /api/checkout. The one place that knows the URL
// and the fetch mechanics, so the hook stays about *when* to check out, not
// *how* to reach the endpoint. A plain async function (no React), mockable in
// the hook's tests.

import type { CheckoutRequest, CheckoutResponse } from '../model/contract';

/**
 * Submit the basket for checkout.
 *
 * @throws when the endpoint responds non-2xx (bad request, catalogue down, …)
 *   so the caller can surface an error state and leave the basket intact.
 */
export async function submitCheckout(
  payload: CheckoutRequest,
): Promise<CheckoutResponse> {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // Surface the route's own message ({ error }) when it sent one, so the user
    // sees "None of the basket items are available." rather than a bare status.
    throw new Error(
      (await readErrorMessage(response)) ??
        `Checkout failed (${response.status}).`,
    );
  }

  return (await response.json()) as CheckoutResponse;
}

/** Best-effort read of the `{ error }` message the route returns on failure;
 *  `null` when the body is absent, not JSON, or carries no string message. */
async function readErrorMessage(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === 'object' &&
      body !== null &&
      typeof (body as { error?: unknown }).error === 'string'
    ) {
      return (body as { error: string }).error;
    }
  } catch {
    // Non-JSON / empty body — fall back to the status message.
  }
  return null;
}
