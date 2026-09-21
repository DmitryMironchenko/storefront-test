# 0003 — Frontend architecture: HeroUI, light Feature-Sliced Design, dark mode

- Status: Accepted — HeroUI mount spike **passed** 2026-09-16 (see Risks)
- Date: 2026-09-16

## Context

Beyond the search/basket/checkout decisions (ADR 0001, ADR 0002), the app needs
a component library, a design/token strategy, and a folder architecture. Facts
that shaped this:

- The data is BestBuy **consumer electronics**; the task is Breitling's; the
  extracted `DESIGN.md` tokens are from **gallet.com**. None align, so there is
  no real brand system to honour — the visual layer is decorative and should be
  clean and accessible, not brand-faithful.
- Accessibility (screen-reader support) is a **graded requirement**. The riskiest
  a11y surfaces are interactive overlays (basket drawer/modal, toasts) where
  hand-rolled focus management commonly fails.
- The repo runs **upstream Next 16.3.4** (newer than most published docs); its
  generated `AGENTS.md` warns agents their training data may be stale.
- Current styling is Tailwind 4 (CSS-first `@theme`); no component library is
  installed; `DESIGN.md` is not wired into the code.

## Decision

### Component library — HeroUI v3, spike-gated
Use **HeroUI v3** (`@heroui/react`), which is built on **React Aria** (Adobe's
accessibility primitives) and is Tailwind-v4-native with React 19 support
(verified peer ranges). It provides accessible `Drawer`, `Modal`, and form
controls out of the box, covering the exact overlays where hand-rolled a11y is
risky. Rejected alternatives: hand-rolling everything (a11y risk on overlays);
Radix-only + custom styling (more assembly, weaker default coverage than React
Aria); a full non-a11y-first kit.

HeroUI's own theme system provides the design tokens; a small neutral brand
palette is defined in that theme. `DESIGN.md` is marked **non-authoritative**
and kept only as a reference artifact.

### Design tokens & dark mode
Keep the existing **auto dark mode** (`prefers-color-scheme`), delivered
first-class by HeroUI's light/dark theme. Constraint: every component is built
against theme tokens (never hardcoded colours) and QA'd in both schemes,
including product imagery on dark surfaces.

### Folder architecture — light Feature-Sliced Design
Adopt FSD's **layers, slices, and downward-only dependency direction as a
convention**, without the enforcement machinery (no `steiger` /
`eslint-plugin-boundaries`, no mandatory per-slice public API for trivial
slices). Reconcile with the App Router by keeping Next `app/` as thin routing
shells and renaming FSD's `pages` layer to **`views`** to avoid the `app/` and
`pages/` collision.

```
src/
├── app/        # Next routes — thin shells
├── views/      # FSD "pages": plp-page, pdp-page, basket-page
├── widgets/    # plp, pdp, basket-drawer, header
├── features/   # search (if it grows), add-to-cart, checkout
├── entities/   # product (type, card, api/getProduct), basket (store, LineItem)
└── shared/     # api/algolia (client+config), analytics, ui (HeroUI wrappers), config
```

**Algolia is split three ways by concern:**
- `shared/api/algolia` — the domain-agnostic `searchClient` + config (credentials,
  index names). Imported by both PLP and PDP.
- `entities/product/api` — `getProduct(objectID)` (single-record `getObject`) for
  the PDP.
- `features/search` — the `<InstantSearchNext>` provider, refinements, sort, and
  pagination wiring. **Created only if custom search UI proliferates**; otherwise
  InstantSearch is assembled directly in `widgets/plp` with the client from
  `shared`.

### Basket surface
The `/basket` **page** is the core surface (URL-addressable, refresh-safe, hosts
checkout). A HeroUI `Drawer` provides a quick-view; the core flow never depends
on the drawer.

## Consequences

- Accessible overlays and controls come from React Aria rather than hand-rolled
  focus traps — directly serving the graded a11y requirement.
- Two styling worlds must be reconciled: HeroUI components and react-instantsearch's
  BYO-CSS widgets are styled with Tailwind to share HeroUI's tokens.
- FSD gives a legible, scalable structure and interview signal without the
  boundary-enforcement tax; the trade-off (boundaries can erode unenforced) is
  accepted at this route count and revisited with `steiger` if the app grows.
- The three-way Algolia split keeps infrastructure, entity data access, and the
  search capability at their correct layers instead of a single `lib/algolia`
  catch-all.

## Risks

- **Spike stack:** HeroUI and `<InstantSearchNext>` (ADR 0002) both do
  SSR/hydration on this newer Next 16. A single combined smoke-test page had to
  confirm both server-render and hydrate cleanly before building. Fallbacks if
  either failed: Radix primitives for overlays (HeroUI); client-only
  InstantSearch (ADR 0002).
- HeroUI setup follows its current skill/docs (`npx skills add heroui-inc/heroui`)
  rather than remembered configuration, since Tailwind-v4 wiring is recent.

### Spike outcome (2026-09-16) — passed, with one correction

Verified `@heroui/react@3.2.5` + `react-instantsearch-nextjs@1.4.9` on **Next
16.3.4** (`next dev` and `next build && next start`): a HeroUI `<Button>` and an
`<InstantSearchNext>` search box both server-render and hydrate with **zero**
console errors/warnings. **No fallbacks needed.**

**Correction to this ADR's assumption:** HeroUI **v3 has no provider** — the
`HeroUIProvider` + `@react-aria/ssr` wrapper referenced above is the **v2
(NextUI)** API and does not exist in v3. v3 setup is CSS-only: `@import
"tailwindcss";` then `@import "@heroui/styles";` in `globals.css` (order
matters), components used directly, `variant`-based semantic props, `onPress`
(not `onClick`). This is exactly the "follow current docs, not remembered
config" reason the ADR flagged. Dark mode via `prefers-color-scheme` (this ADR's
choice) is deferred to #2 — v3 defaults to a `.dark`/`data-theme` class strategy
that #2 must reconcile with the auto-scheme intent.
