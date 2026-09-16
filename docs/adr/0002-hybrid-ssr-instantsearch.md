# 0002 — Hybrid SSR InstantSearch for the PLP, spike-gated with a client-only fallback

- Status: Accepted — mount spike **passed** 2026-09-16 (see Spike outcome)
- Date: 2026-09-16

## Context

The PLP needs filters, pagination, sort, and shareable filtered URLs over the
Algolia index. Three architectures were weighed:

- **A. Client-only InstantSearch** — `<InstantSearch>` in a client boundary;
  URL sync via `routing`. First paint on a shared filtered link is a skeleton
  that flashes to results once JS hydrates. Uses only `react-instantsearch`
  (already installed).
- **B. Hybrid SSR InstantSearch** — `react-instantsearch-nextjs`
  (`<InstantSearchNext>`) runs the first query on the server, renders those
  results into the initial HTML, then hydrates into a live client
  `<InstantSearch>`. No first-paint flash; crawlable. Adds a dependency that
  integrates with Next App-Router internals.
- **C. Pure RSC, no InstantSearch** — server component reads `searchParams`,
  queries Algolia, renders HTML; filters are links/forms. Keeps the search key
  server-side, but loses as-you-type filtering and requires hand-building
  refinements/pagination/facet counts.

Constraints specific to this project:

- The task requires *shareable filtered links* (all three deliver). It does
  **not** require SSR or SEO.
- This repo runs a **forked Next 16** that explicitly warns its APIs and
  conventions differ from upstream (`AGENTS.md`). Option B's dependency binds to
  the exact surface — App-Router routing/streaming — a fork is most likely to
  have changed.
- The Algolia key is a **search-only, public-by-design** key. Hybrid SSR does
  **not** hide it: after hydration the browser queries Algolia directly in both
  A and B. Only C keeps the key off the client.

## Decision

**Use B (hybrid SSR via `react-instantsearch-nextjs`), gated on a mount spike,
with A as the fallback.**

- **Primary justification: first paint.** Server-rendered results eliminate the
  skeleton-to-results flash on every PLP load, shared link or not. This is
  unconditional and is the reason we choose B.
- **Secondary: crawlability, conditionally.** The base PLP (or a curated
  category landing) can be indexed. Filtered permutations
  (e.g. `?brand=Sony&page=3`) should be `noindex` / `rel=canonical` to the base
  to avoid crawl-budget waste and duplicate content. SSR gives the *option*; the
  canonical/noindex strategy that makes it correct is **deferred** for this task.
- **Spike gate:** before building the PLP on B, mount `<InstantSearchNext>` on
  this forked Next and confirm it server-renders and hydrates cleanly. If it
  does not, **fall back to A (client-only)** — not C. A delivers every stated
  requirement; only the first-paint flash returns.
- **Key stays client-side** (search-only public key). C (RSC proxy) is rejected
  for this task; it remains a production option when the key must not reach the
  client, at the cost of an extra proxy hop that slows rendering and the loss of
  instant filtering.

## Spike outcome (2026-09-16)

`<InstantSearchNext>` (`react-instantsearch-nextjs@1.4.9`) was mounted with a
`<SearchBox>` + `<Hits>` on the forked **Next 16.3.4** (Turbopack). Verified on
both `next dev` and `next build && next start`:

- The first Algolia query is **server-rendered** — the initial HTML contains
  `ais-Hits-item` result rows (confirmed via `curl`), so there is no
  skeleton-to-results flash.
- It **hydrates cleanly** — zero React hydration mismatch errors/warnings in the
  browser console (dev, which is the strict mode, and prod).
- `routing` URL-sync works — typing reflects into `?instant_search[query]=…`.

**Decision B holds; the fallback to A is not needed.** One integration note for
#2: the browser search client must read `NEXT_PUBLIC_*` via **static** property
access (`process.env.NEXT_PUBLIC_ALGOLIA_APP_ID`) — Next only inlines those into
the client bundle for static access, so the dynamic `process.env[name]` lookup
in `src/lib/algolia/config.ts` throws in the browser and must not be imported
client-side as-is.

## Consequences

- On success, shared filtered links open with correct results already in the
  HTML — no flash — and the PLP is crawlable if we later add canonical rules.
- We take a real dependency-on-a-fork risk, contained by the spike gate: the
  fallback to A is small (swap `<InstantSearchNext>` for `<InstantSearch>`; the
  widgets and routing config are otherwise the same).
- A future reader sees why the PLP is a client-hydrated subtree rather than a
  pure RSC page, and why the search key is (correctly) in the client bundle.
- SEO is not claimed as "done" — it is an option unlocked by SSR, pending the
  deferred canonical/noindex work.
