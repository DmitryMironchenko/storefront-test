# 0008 — Basket persistence: client store, deferred hydration, cross-tab sync

- Status: Accepted
- Date: 2026-09-17

## Context

Spec requirement 4 is a basket that persists **between sessions** and stays
consistent **across tabs**, with **no hydration flash** (issue #5 acceptance).
ADR 0001 already fixed *what* a Line Item holds (an indicative display snapshot);
this ADR covers *where the basket lives* and *how it loads* on the client.

Facts that shaped this:

- The basket is client state with no server component: there are no accounts
  (CONTEXT.md "Anonymous Id"), and the snapshot exists precisely so the basket
  renders without a catalogue round-trip. Persisting it server-side would add a
  backend the task does not ask for.
- The app server-renders its routes (ADR 0003). Any client store that loads from
  `localStorage` *during render* produces HTML on the server (empty basket) that
  disagrees with the client's first render (restored basket) — a hydration
  mismatch, visible as a flash.
- Zustand's `persist` middleware writes to `localStorage` but does **not** listen
  for other tabs' writes, so cross-tab consistency is not free.

## Decision

- **Store:** a single Zustand store (`entities/basket`) with the `persist`
  middleware, `createJSONStorage(() => localStorage)`, under one shared key
  (`breitling-basket`). `partialize` persists only `items`; the transient
  `hasHydrated` flag is never written.
- **Deferred hydration to kill the flash:** `skipHydration: true`, so the store
  starts empty on both the server and the client's *first* render (they agree).
  A mount effect (`useHydrateBasket`, run once by the header `BasketTrigger`)
  calls `persist.rehydrate()` post-commit, which fills `items` and flips
  `hasHydrated`. UI reads gate on `hasHydrated`: until it is true they render a
  neutral "Loading…" line and no count badge, never an "empty" state that then
  pops to full.
- **Cross-tab sync:** a module-level `window` `storage` listener (client-only,
  behind a `typeof window` guard) re-runs `persist.rehydrate()` whenever the
  shared key changes, so a write in one tab is reflected in the others.
- **Analytics at the interaction seam, not in the store:** `add_to_cart` fires in
  `AddToCartButton`, `remove_from_cart` in the line-item Remove control — the
  store stays pure state (mirrors the PDP's `ProductViewedTracker`, ADR-free
  precedent). Quantity nudges (`increment`/`decrement`) are silent; the stepper
  is floored at one and removal is explicit, so the two events map cleanly to
  deliberate user actions.

## Consequences

- No hydration mismatch or flash: first paint is deterministic, the restored
  basket appears one commit later, gated behind `hasHydrated`.
- The basket survives reload and new sessions (localStorage) and stays in step
  across tabs (the storage listener) with no server involvement.
- The store is trivially unit-testable as pure logic; analytics is mocked only
  in the component tests that own the events.
- Trade-off: `skipHydration` means data is unavailable for exactly one render.
  That is the price of correctness under SSR and is hidden by the `hasHydrated`
  gate. A future server-persisted basket (accounts) would revisit this, not the
  Line Item shape.
- Hydration is made **fault-tolerant**: if the storage read throws (blocked or
  private-mode `localStorage`) or the stored JSON is corrupt, hydration still
  completes and the basket degrades to empty, rather than pinning the UI on
  "Loading…" forever.

## Why a module-global store, not the Next.js provider pattern

Zustand's Next.js guide warns against a module-global store and recommends a
`createStore` factory behind a React-context provider (a fresh store per
request). That warning targets one hazard: a module singleton is shared across
every request on the Node server, so writing **request-specific data** into it
on the server leaks one user's state into another's request.

This store never hits that hazard **as built**: `skipHydration` + an empty
initial state means the server creates it empty and never mutates it (every
write comes from a `"use client"` component in the browser), and `persist` uses
a no-op storage on the server. Every request sees the same empty basket, so the
singleton is stateless and safe, and SSR HTML matches the first client render.
A context provider now would be complexity with no payoff (YAGNI).

**Migration trigger:** the day the basket is *seeded from server-fetched,
request-specific data* — SSR-ing a logged-in user's server-persisted basket, or
passing any per-request initial state — the singleton would leak across users
and we would want those items in the SSR HTML. That is when we move to the
`createStore` + context-provider pattern. The change is self-contained:
consumers resolve the store from context instead of importing the singleton; the
`LineItem` shape, selectors, and component logic are untouched. It arrives with
accounts / server-persistence, not before.

## Accepted limitations

- **Last-writer-wins across tabs.** Cross-tab sync re-reads `localStorage`
  wholesale, so a basket written in one tab replaces the other tab's in-memory
  basket. Two tabs editing at the same instant can drop one edit. Merging
  concurrent cross-tab edits (a CRDT / per-line reconcile) is out of scope for a
  demo basket; the spec asks that updates *reflect* across tabs, which this does.
- **No `migrate` yet.** The persisted store carries `version: 1` but no
  migration. There is no legacy persisted shape in the wild, so a version bump
  currently discards old data by design; a `migrate` function is added together
  with the first change to the `LineItem` shape, not pre-emptively.
