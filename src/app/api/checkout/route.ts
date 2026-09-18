// POST /api/checkout — the mock order endpoint (spec req 6).
//
// It does not trust the client's prices. It fetches each submitted line's
// current catalogue record (getProducts, one batched call), re-prices the basket
// server-side (repriceBasket), and returns the authoritative total plus a fresh
// orderId (ADR 0001, ADR 0012). The client submits `objectID` + `quantity` plus
// an indicative snapshot; only the first two are trusted.

import { getProducts } from '@/entities/product/api/getProducts';
import {
  CHECKOUT_CURRENCY,
  type CheckoutResponse,
} from '@/features/checkout/model/contract';
import {
  repriceBasket,
  type RepriceLine,
} from '@/features/checkout/model/reprice';

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return badRequest('Malformed request body.');
  }

  const lineItems = extractLineItems(payload);
  if (lineItems.length === 0) {
    return badRequest('Basket is empty.');
  }

  let catalogue;
  try {
    catalogue = await getProducts(lineItems.map((item) => item.objectID));
  } catch (error) {
    // The catalogue is down / erroring: this is not the client's fault, so
    // signal a bad gateway rather than a bad request. The basket is untouched.
    console.error('[checkout] catalogue fetch failed', error);
    return Response.json(
      { error: 'Could not price the basket. Please try again.' },
      { status: 502 },
    );
  }

  const {
    lineItems: priced,
    total,
    itemCount,
  } = repriceBasket(lineItems, catalogue);

  // Nothing in the basket could be priced (every record missing / priceless).
  // The static demo index never hits this, but a submit with only stale ids
  // should not mint an order for $0.
  if (priced.length === 0) {
    return badRequest('None of the basket items are available.');
  }

  const response: CheckoutResponse = {
    orderId: crypto.randomUUID(),
    currency: CHECKOUT_CURRENCY,
    itemCount,
    total,
    lineItems: priced,
  };

  // Sanctioned mock: log the order server-side in place of persisting it.
  console.log('[checkout]', {
    orderId: response.orderId,
    total: response.total,
    itemCount: response.itemCount,
  });

  return Response.json(response);
}

function badRequest(error: string) {
  return Response.json({ error }, { status: 400 });
}

// Defensively pull the priceable fields off an untrusted body. Only `objectID`
// and `quantity` are validated and kept — the fields the server trusts (ADR
// 0001); the client's snapshot (name/price) is deliberately ignored. The
// predicate narrows to exactly what is checked, so no downstream reader is told
// a field exists that this filter never validated.
function extractLineItems(payload: unknown): RepriceLine[] {
  if (typeof payload !== 'object' || payload === null) return [];
  const raw: unknown = (payload as { lineItems?: unknown }).lineItems;
  if (!Array.isArray(raw)) return [];

  return raw.filter(
    (item: unknown): item is RepriceLine =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as RepriceLine).objectID === 'string' &&
      typeof (item as RepriceLine).quantity === 'number',
  );
}
