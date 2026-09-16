# 0004 — Testing strategy and the verification feedback loop

- Status: Accepted
- Date: 2026-09-16

## Context

Accessibility is a graded requirement and decisions "must survive questioning,"
so the build needs a real verification loop, not ad-hoc checking — while the task
also says not to over-invest in polish, so the suite must be lean and targeted.

A hard technical constraint shapes the tool choice. The App Router testing guide
bundled with this Next
(`node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`) states:

> Since `async` Server Components are new to the React ecosystem, Vitest
> currently does not support them ... we recommend using **E2E tests** for
> `async` components.

This is a lack of *first-class* support, not an impossibility: an `async` Server
Component can be unit-tested with workarounds — invoke it, `await` the resolved
element, render that with Testing Library, and mock its data deps (e.g.
`getObject`). So Vitest can cover Server Component *logic* where it is worth it;
Playwright is chosen for full-page integration and a11y coverage of the
server-rendered pages, not because they are otherwise untestable.

## Decision

Three tiers, treated as a feedback loop and run as the closing gate after
implementation (iterate until green):

1. **Static** — `eslint` (installed) + `tsc --noEmit` typecheck. First, fastest.
2. **Unit / component — Vitest + React Testing Library (jsdom) + an axe matcher**
   (`vitest-axe`). Targets the logic where bugs hide and synchronous components:
   - `entities/basket` store — add / increment / remove / clear-on-checkout,
     snapshot shape, hydration guard.
   - `shared/analytics` — `track()` emits the correct typed payloads.
   - `features/checkout` — server re-price recomputes subtotal from catalogue
     prices (mocked `getObjects`).
   - synchronous client components — filter `fieldset/legend`, product card,
     basket line item — with axe assertions.
3. **E2E — Playwright + `@axe-core/playwright`.** Covers the async Server
   Component pages (PDP, PLP) end-to-end — where Vitest needs awkward workarounds
   and can't exercise real navigation/hydration — plus one happy-path critical flow
   (PLP → filter → PDP → add to basket → checkout → confirmation), and a
   page-level a11y scan. One smoke path, not an exhaustive suite.

A single `verify` script chains the loop — `eslint && tsc --noEmit &&
vitest run` — with `playwright test` as the E2E gate (pnpm; the user's `p`
alias). It is run after finishing an implementation task and its failures are the
signal to iterate.

## Consequences

- Fast inner loop (static + unit) plus a thin outer loop (E2E) that also serves
  as the a11y check the task grades on.
- The Vitest/Playwright split is a deliberate division of labour: Vitest for
  logic and synchronous components (and Server Component logic via workarounds),
  Playwright for real navigation, hydration, and a11y on the server-rendered
  pages — not a claim that Server Components are untestable in Vitest.
- Automated axe covers regressions; it does not replace a manual screen-reader
  pass, which stays a checklist item.
- Scope stays lean: representative unit coverage + one E2E path, not full
  coverage of a demo.

## Risks

- Playwright drives a real browser against `next dev`/`next start`, so it is
  framework-fork-agnostic; the residual risk is the same SSR/hydration spike the
  other ADRs already gate on.
