# 0011 — Run the verification loop as a GitHub Actions merge gate

- Status: Accepted
- Date: 2026-09-17

## Context

ADR 0004 defines a three-tier verification loop (static → unit → E2E) and a
`verify` script, but until now it only ran on developer machines. Nothing
enforced it before merge, so a red tree could reach `main`. The task is to add
CI guards — test, lint, E2E — as an automated gate.

Constraints that shape the design:

- The app reads three `NEXT_PUBLIC_ALGOLIA_*` values. These are Algolia's public
  demo credentials (`latency` / `instant_search`), already committed in
  `.env.example` — not secrets, so CI needs no repository secrets to boot.
- `.env` is gitignored, so a runner has no env file until one is provided.
- E2E (Playwright) drives a real browser and boots `next dev`; it is slow and
  needs a browser download, so it should not block the fast static/unit signal.
- The runtime is pinned to Node 24.x via `.nvmrc` (ADR 0006).

## Decision

Add `.github/workflows/ci.yml` running on every `pull_request` and on `push` to
`main`, as two parallel jobs mirroring the ADR 0004 tiers:

1. **`verify`** — tiers 1–2 as discrete steps (`format:check`, `lint`,
   `typecheck`, `test`) rather than the single `verify` script, so each failure
   is annotated independently. This is the fast inner loop.
2. **`e2e`** — tier 3. Copies `.env.example` → `.env` for the demo creds,
   installs the Chromium browser, and runs `test:e2e`. The Playwright HTML
   report is uploaded as an artifact on any non-cancelled run for post-mortem.

Cross-cutting choices:

- Node comes from `.nvmrc` (`node-version-file`) so CI, local, and Vercel agree.
- `npm` cache keyed on the lockfile; `npm ci` for reproducible installs.
- A `concurrency` group cancels superseded runs on the same ref.
- Playwright already sets `forbidOnly` and `retries: 2` under `process.env.CI`;
  its reporter now adds an `html` reporter when `CI` is set (see
  `playwright.config.ts`), feeding the uploaded artifact.

## Consequences

- `main` is protected by the same loop developers run locally; a red gate blocks
  merge (branch protection can now require these checks).
- No secrets to manage while the app uses the public demo index; a real index
  would move these to repository secrets and drop the `.env.example` copy.
- Deployment (Vercel) is intentionally out of scope here and left for a later
  change; the workflow leaves room for a deploy job to be added alongside.
