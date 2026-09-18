// Server-side re-pricing: the heart of the checkout contract (ADR 0001).
//
// The client is a "dumb sender" of `objectID` + `quantity`; the authoritative
// price is whatever the catalogue says *now*. `repriceBasket` takes the
// submitted lines and the catalogue records fetched for them, and recomputes the
// total from catalogue prices — the submitted snapshot price is never trusted.
//
// A pure function (no I/O): the route fetches the records (getProducts) and hands
// them here, which keeps the money logic trivially unit-testable and the route
// thin.

import type { ProductHit } from '@/entities/product';

import type { PricedLineItem } from './contract';

export type RepriceResult = {
  lineItems: PricedLineItem[];
  total: number;
  /** Sum of the priced lines' quantities (server-authoritative unit count). */
  itemCount: number;
};

/** The only two fields the server trusts from a submitted line (ADR 0001). The
 *  snapshot the client also sends is for logging/audit and is never read here,
 *  so the input type asks for exactly what re-pricing uses. */
export type RepriceLine = {
  objectID: string;
  quantity: number;
};

/** Round a money amount to whole cents, killing IEEE-754 artifacts (e.g.
 *  19.99 * 3 → 59.970000000000006) before the value becomes the authoritative
 *  total and is forwarded verbatim into analytics. */
function toCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Recompute a basket's total from catalogue prices.
 *
 * A submitted line is priced only when its catalogue record exists and carries a
 * finite, non-negative price, and its quantity is a positive integer. Lines that
 * fail either check are skipped rather than trusted or errored — availability is
 * out of scope (ADR 0001), and the static demo index never actually drops a
 * record, so this is defensive, not user-facing. The route treats a wholly
 * unpriceable basket (no lines survive) as a bad request.
 */
export function repriceBasket(
  submitted: RepriceLine[],
  catalogue: Map<string, ProductHit>,
): RepriceResult {
  const lineItems: PricedLineItem[] = [];

  for (const line of submitted) {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) continue;

    const record = catalogue.get(line.objectID);
    // Guards NaN and Infinity too — `typeof NaN === 'number'`, and a poisoned
    // price would otherwise yield a NaN line total and a NaN order total.
    if (!record || !Number.isFinite(record.price) || record.price! < 0)
      continue;

    const unitPrice = record.price!;
    lineItems.push({
      objectID: line.objectID,
      name: record.name,
      quantity: line.quantity,
      unitPrice,
      lineTotal: toCents(unitPrice * line.quantity),
    });
  }

  const total = toCents(
    lineItems.reduce((sum, line) => sum + line.lineTotal, 0),
  );
  const itemCount = lineItems.reduce((sum, line) => sum + line.quantity, 0);

  return { lineItems, total, itemCount };
}
