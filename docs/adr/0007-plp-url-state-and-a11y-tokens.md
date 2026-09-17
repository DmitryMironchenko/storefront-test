# 0007 — PLP: clean shareable URLs, a single search landmark, and AA-safe text tokens

- Status: Accepted
- Date: 2026-09-17

## Context

Step 2 (issue #3) builds the one canonical PLP on the hybrid-SSR
`<InstantSearchNext>` stack gated in ADR 0002, with category/brand filters, sort,
pagination, and **shareable, refresh-safe** filtered links. Three decisions on
that path are worth recording because a reviewer will question them.

## Decision

### 1. A flat, hand-written URL `stateMapping` — not InstantSearch's default
InstantSearch's default routing serializes to nested keys
(`?instant_search[refinementList][brand][0]=Apple`). We instead map search state
to flat, legible params — `?q=&category=&brand=&sort=&page=` — via a custom
`stateMapping` (`widgets/plp/routing.ts`):

- The mapping is a pair of **pure functions** (`stateToRoute` / `routeToState`),
  unit-tested for the round-trip invariant `ui === routeToState(stateToRoute(ui))`,
  empty-state omission (a pristine PLP has an empty URL), string→number page
  coercion, and bare-value normalization (`?brand=Apple` with no `[0]`). This is
  the seam the "shareable link" acceptance rests on, so it is tested directly
  rather than only through the browser.
- Sort is exposed as short tokens (`price_asc`/`price_desc`) rather than leaking
  the raw Algolia replica index names (`instant_search_price_asc`) into links;
  relevance is the base index and is simply absent from the URL.
- `react-instantsearch-nextjs` injects its own Next-aware history router for SSR;
  we pass only `{ stateMapping }` and let it own the router (verified in its
  source — it merges our mapping and builds the router itself).

### 2. One `role="search"` landmark: brand is a plain filter list
The brand facet is a `<RefinementList>` **without** `searchable`. Its built-in
search box would add a second `role="search"` landmark competing with the site
search, which axe flags (`landmark-is-unique`) and which is semantically wrong —
a facet filter is not site search. `showMore` (limit 8 → 20) covers the long tail
of brands instead. The single site `<SearchBox>` remains the one search landmark.

### 3. Derive text-`muted` and text-`accent` so they clear WCAG AA
HeroUI's raw `--muted` (4.43:1 on the greyer `--background`) and `--accent`
(3.37:1 as text) are tuned to sit on the white `--surface` / behind white
`--accent-foreground`; used as small text on the page background they fail AA.
Rather than hardcode hex overrides (ADR 0003: build against tokens), the Tailwind
**text** utilities are re-derived with `color-mix(... var(--foreground) ...)` in
`globals.css`, so they clear AA on both surfaces and stay theme-aware (they
re-mix under `[data-theme="dark"]`). Borders/outlines/fills still use the vivid
brand accent, where the 3:1 non-text threshold applies.

### Error handling: inline query error + a render boundary
The realistic PLP failure — a failed Algolia request — is surfaced through
InstantSearch's own `useInstantSearch().status === "error"` with a retry
(`refresh()`), not a thrown error. A class `SearchErrorBoundary` wraps the subtree
as defence-in-depth for unexpected render exceptions. Both are covered: the
boundary by unit test, the happy path + a11y by Playwright.

## Consequences

- Shared filtered links are short and legible, open with results already in the
  server HTML, and restore filters/sort/page on refresh (Playwright-verified).
- The a11y decisions are driven by the automated axe gate (ADR 0004), which now
  passes clean on the PLP; a manual screen-reader pass remains a checklist item.
- Re-deriving two text tokens is a small, contained deviation from "use HeroUI's
  tokens verbatim"; the raw tokens remain for non-text use. If HeroUI tightens its
  palette later, these overrides can be dropped.

## Risks

- The custom `stateMapping` must keep the round-trip invariant as facets are added
  (e.g. a price range in a later step); the unit test guards it, and any new facet
  must extend both directions.
