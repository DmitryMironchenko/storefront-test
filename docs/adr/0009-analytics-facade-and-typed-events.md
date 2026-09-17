# 0009 — Analytics: a typed façade over a swappable sink

- Status: Accepted
- Date: 2026-09-17

## Context

Spec requirement 5 (issue #6) is a small analytics layer: emit five events —
`product_viewed`, `add_to_cart`, `remove_from_cart`, `checkout_started`,
`checkout_completed` — each carrying a well-formed payload, with the transport
kept swappable. Step 4 (ADR 0008) already stood up a placeholder `track()`
façade with a loose `{ name, payload }` shape and wired `product_viewed` /
`add_to_cart` / `remove_from_cart` at their interaction seams, explicitly
deferring the typed union and the anonymous-id enrichment to this step.

Facts that shaped this:

- The catalogue product's display field is also called `name`, which collides
  with an event's own `name` discriminant if the two are spread into one flat
  object.
- There are no accounts (CONTEXT.md, "Anonymous Id"): events are correlated by a
  pseudonymous per-browser id, which must survive reloads and return visits but
  carries no PII.
- `track()` is called from client effects and handlers only, but the module it
  lives in is also imported into server-rendered trees, so it must be safe to
  *load* on the server even though it never *runs* there.
- The checkout submit UI does not exist yet — it is issue #7 (step 6), which
  owns the `/basket` checkout action and, per its acceptance, fires
  `checkout_completed` on success.

## Decision

- **Typed discriminated union (`events.ts`).** `AnalyticsEvent` is a union keyed
  on `name`; each arm carries exactly its payload, so a call site can only emit a
  known event with the right data. Cart events keep the industry-standard
  `add_to_cart` / `remove_from_cart` wire names (CONTEXT.md).
- **Item identity is nested under `product`, not spread flat.** A `ProductRef`
  (`objectID`, `name`, optional `brand`/`price`) keeps the item's `name` from
  colliding with the event discriminant, and mirrors the nested-item convention
  of standard e-commerce analytics schemas.
- **`track()` enriches, then delegates (`track.ts`).** It stamps every event with
  `timestamp` (ISO-8601 UTC) and `anonymousId`, producing the `TrackedEvent`
  shape `{ name, …data, timestamp, anonymousId }`, then hands it to the active
  *sink*.
- **Fire-and-forget: analytics never throws into a call site.** The whole
  enrich-and-emit path is wrapped in a `try/catch` that logs and swallows, so a
  flaky vendor sink or a failed id mint can never break the add-to-cart / remove
  / view action that emitted the event. This makes the invariant the module
  advertises actually hold at the façade, not just in the storage helpers.
- **The sink is swappable behind `track()`.** A module-level sink defaults to a
  console logger (the brief sanctions console logging); `setAnalyticsSink(fn)`
  replaces it for a real vendor SDK, a buffer, or a test spy, and no call site
  changes. This is the acceptance criterion ("sink is swappable behind
  `track()`") made literal.
- **Anonymous id (`anonymous-id.ts`).** A random UUID minted on first need and
  persisted in `localStorage` under `breitling-anonymous-id`, so it survives
  reloads and return visits. Storage mirrors the basket store (ADR 0008): guard
  for a missing `window`, and swallow storage failures. An in-memory cache keeps
  the id stable for the page's lifetime even when the *write* fails (private
  mode), so a session's events still correlate. Id minting falls back to a
  non-UUID random string outside a secure context (`crypto.randomUUID` is
  undefined on plain HTTP) so it never throws. On the server it returns a
  throwaway, uncached id — module state there is shared across requests, and
  `track()` never runs server-side anyway.

## Consequences

- Call sites depend only on `track(event)` and the typed union; the transport,
  the timestamp, and the id are invisible to them. Adding a vendor is one
  `setAnalyticsSink` call plus a mapping of five known shapes.
- The three live touchpoints (`product_viewed`, `add_to_cart`,
  `remove_from_cart`) now emit fully-typed, enriched payloads. Their component
  tests assert the *input* to a mocked `track`; the enrichment is unit-tested
  once, at the façade.
- Migrating the placeholder shape (`{ name, payload }` → typed union with nested
  `product`) touched the three existing call sites and their test assertions;
  no behavioural change, caught by the type checker.

## Why the two checkout events are defined here but fired in step 6

This step defines and exports `checkout_started` and `checkout_completed` as part
of the union, but does **not** wire them, because their only touchpoint is the
`/basket` checkout action, which is issue #7's deliverable (step 6:
"Checkout action from `/basket`", "on success: fire `checkout_completed`"). The
two steps meet at exactly this seam — the same seam-then-fill pattern step 4 used
to hand this step its placeholder façade.

Building a throwaway checkout button here to fire the events, only for step 6 to
replace it with the re-pricing submit flow, would duplicate and then discard
work and collide with #7. Instead, step 6 imports the ready-made events and
calls `track({ name: "checkout_started", … })` at submit and
`track({ name: "checkout_completed", … })` on the server's authoritative
response. Note `checkout_started` is not otherwise mentioned by #7's tasks; it is
defined here so that seam is already typed when #7 wires the submit.

## Accepted limitations

- **Console-only sink.** No event is delivered anywhere durable; the sink is a
  logger by design for this exercise. A real destination is a `setAnalyticsSink`
  adapter, added when there is somewhere to send events.
- **No delivery guarantees / batching / retry.** `track()` is fire-and-forget.
  Buffering, retry, and flush-on-unload belong to a real sink adapter, not the
  façade, and are out of scope for a demo.
- **Pseudonymous id is per-browser, not per-user.** With no accounts it cannot
  follow a person across devices; that is inherent to the anonymous model and
  revisited only if accounts arrive (same trigger as ADR 0008).
