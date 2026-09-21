# 0014 — PLP: a labelled numeric price-range filter, mapped to a flat URL token

- Status: Accepted
- Date: 2026-09-21

## Context

The PLP already filters by category and brand, with filters serialized to flat,
shareable, refresh-safe URL params through the hand-written `stateMapping`
(ADR 0007). That ADR explicitly anticipated this step: _"the custom stateMapping
must keep the round-trip invariant as facets are added (e.g. a price range in a
later step); ... any new facet must extend both directions."_ This adds price as
that next facet. `price` is the numeric attribute on the Algolia demo index, so
the natural filter is a numeric range rather than a checkbox list.

## Decision

### 1. A custom `<PriceRange>` on the `useRange` connector — not stock `<RangeInput>`
react-instantsearch ships two range widgets; both are unsuitable as-is:

- **`<RangeSlider>`** is a drag interaction with poor keyboard/screen-reader
  ergonomics and no obvious way to type an exact bound.
- **`<RangeInput>`** is two number inputs — the right control — but it wraps each
  input in an **empty** `<label>`, so the input's only "name" is a numeric
  placeholder. That trips the PLP page-level axe gate (`label`) and leaves a
  screen reader announcing two unnamed spinbuttons. The widget spreads extra
  props onto its root `<div>`, not the inputs, so there is no way to inject an
  `aria-label` from outside.

So `<PriceRange>` is a small custom component on the `useRange` connector, the
same connector-hook pattern the codebase already uses for `<SearchStats>`
(`useStats`) and `<PlpPagination>` (`usePagination`). Each input gets a real
visible label ("Min price" / "Max price"), so the control is keyboard- and
screen-reader-navigable and the axe gate stays clean.

Two behavioural choices worth noting:

- **Reads the connector, not `useInstantSearch().results`** — same reason as
  `<PlpPagination>`: the connector participates in InstantSearch's SSR state so
  server and client agree; `results` is not populated during the server render
  and reading it would cause a hydration mismatch.
- **Commits on submit, not per keystroke** — one search per applied range, and a
  keyboard user can type both bounds before it queries. An unset side is sent as
  `undefined`, i.e. an open-ended range (`min` only, or `max` only).
- **Guards the two ways a range goes wrong.** Out-of-facet-range bounds are
  blocked at the inputs by their `min`/`max` attributes — native constraint
  validation stops the submit with an inline message, rather than letting
  `connectRange` silently reject the *whole* refinement (it returns `null` if
  either bound is out of range, which would drop a valid Min alongside a bad
  Max). An inverted pair (min > max, both in range) isn't caught by either, so
  it is swapped in JS before `refine`. Decimals are allowed
  (`inputMode='decimal'`, `step='any'`) since catalogue prices can carry cents.

### 2. URL token: the widget's native `min:max` string as a flat `price` param
The range is serialized as `?price=100:500` — the same `min:max` string
InstantSearch keeps internally (`100:` = min only, `:500` = max only). This
keeps the URL flat and legible per ADR 0007 and round-trips trivially. A bare
`:` (both bounds cleared) is **not** a real filter and is omitted, so a pristine
PLP keeps an empty URL — the same empty-state invariant the other facets honour.
On the way back in, `routeToState` accepts only a `min:max`-shaped token and
drops a garbled one (`?price=abc`, `1:2:3`) rather than forwarding NaN bounds —
consistent with the module's defensive URL coercion.

## Consequences

- Price joins category/brand as a shareable, refresh-safe filter; the routing
  round-trip test now covers it (including open-ended and empty ranges), and a
  Playwright test drives the apply → URL → reload path end to end.
- `<PriceRange>` carries its own unit test (mocked `useRange`) locking the a11y
  contract (labelled inputs, axe-clean) and the submit → `refine` wiring.
- One more custom widget instead of a stock one is the accepted cost of clearing
  the a11y bar the rest of the PLP already meets.

## Risks

- The price range depends on `price` being filterable on the Algolia index; the
  demo `instant_search` index configures it, but a re-indexed catalogue must keep
  `price` in `attributesForFaceting` (as `filterOnly` or a numeric facet) or the
  control silently stops narrowing (`canRefine` goes false and it disables).
