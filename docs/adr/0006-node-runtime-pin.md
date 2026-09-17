# 0006 — Pin the Node.js runtime to 24.x (Vercel's default)

- Status: Accepted
- Date: 2026-09-17

## Context

The repo had no runtime binding — no `engines`, no `.nvmrc`, no Volta. The only
"20" in sight was `@types/node@^20`, a `create-next-app` scaffold default that
types `tsc` against Node 20's APIs but does not select a runtime. The actual
floor was Next 16's own `engines: node >=20.9.0`; local dev was already on Node
26; deployments would take whatever Vercel's project default was.

Adding `vitest@5` surfaced the drift: it wants `@types/node@^22 || >=24`, which
conflicts with the `^20` pin under a flag-free `npm install`. Bumping the types
to `^24` fixed the install and prompted the question of what runtime we actually
target.

Vercel's currently selectable Node majors are **24.x (default), 22.x, 20.x**, and
**Node 20 is deprecated on 2026-10-01**. Node 26 (local) is not a Vercel option.

## Decision

Pin the runtime to **Node 24.x** — Vercel's current default and the newest
supported major:

- `package.json` → `engines.node: "24.x"` — the authoritative signal Vercel reads
  (overrides the dashboard setting); also documents intent for CI and humans.
- `.nvmrc` → `24` — so `nvm use` / `fnm` line local dev up with the deploy target.
- `@types/node` stays `^24`, matching the runtime.

24.x (not 22.x) because it is Vercel's default, avoids the imminent Node 20
deprecation, and keeps types/runtime aligned.

## Consequences

- Local, CI, and Vercel agree on a single major; deploys are deterministic rather
  than riding Vercel's shifting default.
- Devs on a different Node (e.g. 26 locally) get a non-fatal `npm warn EBADENGINE`
  and should `nvm use` to match prod; npm does not block unless `engine-strict` is
  set.
- Moving to a newer major later is a one-line change here plus the Vercel setting.
