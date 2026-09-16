# 0001 — Basket holds an indicative display snapshot; price is re-validated at Checkout

- Status: Accepted
- Date: 2026-09-16

## Context

A Line Item snapshots a Product at add-time so the Basket can render without
re-querying Algolia. This raises the question of *what the snapshot means* for
price and availability, both of which are catalogue truth that can change after
the item is added.

Two models were considered:

1. **Freeze** — the snapshot price is authoritative; the user is charged what
   they saw when they added the item.
2. **Re-validate** — the snapshot price is indicative (for display continuity
   only); the authoritative price is re-fetched from the catalogue at Checkout
   and reconciled with the user.

The task specification (`docs/Breitling Frontend Engineer Technical Task.docx`)
requires a persistent basket and a mock checkout. It does **not** mention stock,
inventory, or availability.

## Decision

- The Line Item stores a **display snapshot**: `objectID`, `name`, `image`,
  `brand`, `quantity`, and the **price shown at add-time**. The stored price is
  **indicative**, not the final charge.
- **The Checkout route re-prices server-side.** The client submits
  `objectID` + `quantity` (plus the indicative snapshot for logging); the
  `POST /api/checkout` route fetches current records from Algolia
  (`getObjects`, one batched call), recomputes the subtotal from catalogue
  prices, and returns the authoritative total. The client's price is never
  trusted as the charge.
- **Deferred:** surfacing price *deltas* to the user ("this item changed price,
  re-confirm"). The `instant_search` index is static, so deltas never fire in
  the demo; the reconcile UI (and any harness to force a change) is listed as
  "would add next" rather than built.
- **Product availability / stock is out of scope** — the task does not require
  it, so the basket does not model or check it.

## Consequences

- The Basket renders instantly and offline from the snapshot; no per-item
  catalogue round-trip on render.
- A future reader who sees the client submit an indicative price will find the
  rationale here (and the server re-price) rather than assuming a bug.
- Re-pricing lives entirely in the Checkout route: re-fetch by `objectID`,
  recompute the total — no change to how items are stored, and the client stays
  a dumb sender of `objectID` + `quantity`.
- Availability can be added later as a Checkout-time (or PDP-time) catalogue
  check without reshaping the Line Item.
