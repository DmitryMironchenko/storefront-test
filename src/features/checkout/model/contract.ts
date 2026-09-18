// The wire contract between the client checkout action and POST /api/checkout.
//
// The client submits `objectID` + `quantity` plus the add-time snapshot (for
// logging/audit only); the server re-prices against the catalogue and returns
// the authoritative total (ADR 0001, ADR 0012). Both sides import these types,
// so the shape can only drift in one place. This module is pure types + a
// constant — no `server-only`, no React — so the route (server) and the hook
// (client) can both depend on it.

/** The single currency this storefront transacts in (the demo catalogue is USD;
 *  see entities/product/lib/format). Centralised so the request, the response,
 *  and the analytics events never disagree on it. */
export const CHECKOUT_CURRENCY = 'USD';

/** One line as the client submits it: identity + quantity, plus the indicative
 *  add-time snapshot. The server trusts only `objectID` and `quantity`; the
 *  snapshot `price` is echoed for logging and is never used as the charge. */
export type SubmittedLineItem = {
  objectID: string;
  quantity: number;
  name: string;
  brand?: string;
  image?: string;
  /** Indicative add-time price (USD). Logged, not charged. */
  price: number;
};

/** The checkout request body POSTed to /api/checkout. */
export type CheckoutRequest = {
  /** Pseudonymous browser id stamped by the client (see shared/analytics). */
  anonymousId: string;
  currency: string;
  /** ISO-8601 instant the basket was submitted, set client-side. */
  submittedAt: string;
  /** Client's own unit count; the server recomputes its own authoritative one. */
  itemCount: number;
  lineItems: SubmittedLineItem[];
};

/** One re-priced line in the response: the quantity charged at the catalogue
 *  unit price, with the line total the server computed. */
export type PricedLineItem = {
  objectID: string;
  name: string;
  quantity: number;
  /** Authoritative unit price from the catalogue at checkout time (USD). */
  unitPrice: number;
  /** `unitPrice * quantity`. */
  lineTotal: number;
};

/** The authoritative checkout result returned on success. */
export type CheckoutResponse = {
  orderId: string;
  currency: string;
  /** Units actually priced (sum of priced line quantities). */
  itemCount: number;
  /** Authoritative order total, summed from catalogue prices — never the
   *  client's indicative subtotal. */
  total: number;
  lineItems: PricedLineItem[];
};
