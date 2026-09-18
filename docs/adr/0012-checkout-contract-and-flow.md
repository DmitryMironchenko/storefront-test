# 0012 — Checkout: server-authoritative re-price, wire contract, and confirmation flow

- Status: Accepted
- Date: 2026-09-18

## Context

Spec requirement 6 (issue #7, step 6) is a mock checkout submitted from
`/basket`: the basket goes to `POST /api/checkout`, the server returns an order
id, the basket empties, and a confirmation shows. Two earlier ADRs set the
ground rules this step implements:

- **ADR 0001** decided the basket holds an *indicative* display snapshot and the
  Checkout route **re-prices server-side** — the client is a "dumb sender" of
  `objectID` + `quantity`, the authoritative price is fetched from the catalogue
  (`getObjects`, one batched call) and the client's price is never the charge. It
  also deferred a price-*delta* reconcile UI.
- **ADR 0009** defined `checkout_started` and `checkout_completed` as typed
  events but explicitly left them unwired, handing this step the seam.

Before this step, `POST /api/checkout` was a stub that echoed a random `orderId`
and logged the payload; there was no submit action on `/basket`.

## Decision

- **One wire contract, shared by both sides (`features/checkout/model/contract.ts`).**
  `CheckoutRequest` / `CheckoutResponse` / `SubmittedLineItem` / `PricedLineItem`
  plus a `CHECKOUT_CURRENCY` constant live in a pure types module (no
  `server-only`, no React) so the route and the client hook depend on the same
  shapes. The request carries `{ anonymousId, currency, submittedAt, itemCount,
  lineItems:[{ objectID, quantity, + snapshot }] }`; the response carries the
  authoritative `{ orderId, currency, itemCount, total, lineItems }`.

- **A batched catalogue accessor in the entity layer (`entities/product/api/getProducts.ts`).**
  Mirrors `getProduct` but calls `getObjects` once for all ids and returns a
  `Map<objectID, ProductHit>` of the records that resolved (Algolia returns
  `null` for a missing id; those are simply absent from the map). `server-only`,
  so it can never reach a client bundle. This is ADR 0001's "one batched call"
  made literal, and keeps catalogue access in one typed home.

- **Re-pricing is a pure function (`features/checkout/model/reprice.ts`).**
  `repriceBasket(submitted, catalogue)` recomputes the total from catalogue
  prices — never the submitted snapshot — and returns the priced lines, total,
  and a server-authoritative `itemCount`. A line is priced only when its record
  exists, has a **finite, non-negative** price (so `NaN`/`Infinity` can't poison
  the total), and its quantity is a positive integer; others are skipped
  (availability is out of scope, ADR 0001). Money is rounded to whole cents, so
  the authoritative total is free of IEEE-754 artifacts before it is returned and
  forwarded into `checkout_completed`. `repriceBasket` accepts only the two fields
  it trusts (`objectID` + `quantity`), so the route's untrusted-body filter narrows
  to exactly what it validates. Keeping the money logic pure makes it trivially
  unit-testable and the route thin.

- **The route orchestrates and validates (`app/api/checkout/route.ts`).** It
  parses the body (`400` on malformed JSON), extracts well-formed line items
  (`400` on an empty basket), fetches their records via `getProducts`, re-prices,
  and — if nothing priced — returns `400` rather than minting a `$0` order. A
  catalogue failure is a `502` (not the client's fault; the basket is untouched),
  distinct from the client-error `400`s. On success it mints `crypto.randomUUID()`
  and returns the authoritative response.

- **The client action is a hook at the interaction seam (`features/checkout/model/useCheckout.ts`).**
  It builds the payload from the basket, fires `checkout_started` with the
  *indicative* subtotal (intent, pre-request), POSTs via a thin
  `submitCheckout` caller, and on success fires `checkout_completed` with the
  server's *authoritative* total, clears the basket, and exposes the order. This
  mirrors AddToCartButton: analytics lives at the seam, the store stays pure
  state. Re-entry is blocked by a `useRef` flag (not `status` state, which
  updates asynchronously), so a double-click cannot submit twice. A failed
  request sets a retryable error and leaves the basket intact.

- **Confirmation replaces the basket, decided in the view layer.** `CheckoutButton`
  (the CTA, in the basket footer) and `OrderConfirmation` (the success panel) are
  presentational feature components; the view-layer `BasketBody` owns the
  `useCheckout` hook and the single toggle — basket-with-CTA, or confirmation in
  its place. The CTA rides in `BasketContents`' existing `footer` slot, which
  only renders when the basket is non-empty, so it never shows on an empty or
  not-yet-hydrated basket. `BasketPage` stays a thin server shell over
  `BasketBody` (ADR 0003).

## Consequences

- The charge is catalogue truth: a stale or tampered client price cannot change
  the total, and this is asserted directly (the route test sends deliberately
  wrong prices and expects the catalogue total).
- The two checkout events defined in ADR 0009 are now live; the seam that step
  left typed is filled exactly as predicted there.
- The basket empties only after the server confirms the order, so a failed
  checkout is fully retryable with the basket intact.
- Money logic (`repriceBasket`) and catalogue access (`getProducts`) are unit
  tested in isolation; the route and the `/basket` flow are tested against mocks
  of them, so no test touches the network.

## Deferred: price-delta reconcile UI

Carried forward from ADR 0001 and named as deferred by issue #7. The server
already computes the authoritative total and returns per-line `unitPrice`, so a
future reconcile screen ("this item changed price since you added it — re-confirm")
can diff the submitted snapshot price against the returned `unitPrice` with no
change to the contract or the re-price. It is not built because the
`instant_search` demo index is static, so a delta never actually fires; building
the diff UI (and a harness to force a price change) is "would add next", not part
of this step.

## Accepted limitations

- **Mock order, no persistence.** The route logs the order and returns an id in
  place of writing it anywhere; there is no payment, no order store, no email.
  This is the brief's "mock checkout".
- **No stock / availability check.** Out of scope per ADR 0001; an unpriceable
  line is skipped, and a wholly unpriceable basket is a `400`, but availability
  is never modelled.
- **Single currency.** `CHECKOUT_CURRENCY` is `USD` (the demo catalogue's
  currency); multi-currency is not modelled.
