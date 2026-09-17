# 0010 — Adopt Prettier as the formatter, single quotes

- Status: Accepted
- Date: 2026-09-17

## Context

The repo had no code formatter. Style was maintained by hand and by whatever
ESLint's Next presets happened to enforce, which is not formatting — it leaves
quote style, wrapping, and spacing to the author. The result was a codebase
uniformly on double quotes, with no automated way to keep it consistent as it
grows.

The trigger was a direct preference: double quotes are unwanted; single quotes
are the house style going forward. Enforcing that by review is noise; a formatter
makes it mechanical and non-negotiable.

## Decision

Adopt **Prettier** as the single source of truth for formatting.

- `prettier` pinned exactly (`--save-exact`) so every dev and CI run produces
  byte-identical output; a floating minor can reflow the whole tree.
- `.prettierrc.json` sets `singleQuote: true` and `jsxSingleQuote: true`; all
  other options stay at Prettier defaults.
- `.prettierignore` excludes build output, generated files (`next-env.d.ts`,
  `*.tsbuildinfo`), coverage/report dirs, `node_modules`, and the lockfile.
- **ESLint stops fighting Prettier**: `eslint-config-prettier` is appended last
  in `eslint.config.mjs`, disabling every formatting-related lint rule. We do
  _not_ run Prettier as an ESLint rule (`eslint-plugin-prettier`) — the two tools
  run separately, which is Prettier's own recommendation and keeps lint fast.
- Scripts: `format` (`prettier --write .`) and `format:check`
  (`prettier --check .`); `verify` now runs `prettier --check .` first, so a
  misformatted file fails the same gate as lint/type/test.
- **Tailwind class order** is owned by Prettier too, via
  `prettier-plugin-tailwindcss`. It's pointed at the v4 CSS-first config
  (`tailwindStylesheet: ./src/app/globals.css`) and told about `tv()`
  (`tailwindFunctions: ["tv"]`) so classes inside tailwind-variants / HeroUI
  helpers sort with the rest. Class order stops being a review topic.
- The whole tree was reformatted (and classes sorted) in one pass so the baseline
  is clean.

Make it automatic, not remembered, and share the setup with the team:

- **Editor** — checked-in `.vscode/settings.json` turns on format-on-save with
  Prettier as the default formatter (works in desktop and browser VS Code), plus
  `tailwindCSS.classFunctions: ["tv"]` for IntelliSense/conflict linting inside
  `tv()`. `.vscode/extensions.json` recommends the Prettier, Tailwind
  IntelliSense, and ESLint extensions.
- **Agent** — a shared Claude Code `PostToolUse` hook
  (`.claude/settings.json` → `.claude/hooks/format-and-fix.sh`) runs
  `prettier --write` then `eslint --fix` on every file the agent writes or edits,
  so agent-authored code lands already formatted and lint-clean.

These are committed (not `settings.local.json` / personal) so the whole team —
humans in either editor and the agent — produces identically formatted code.

Single quotes (not double) because that is the stated preference; enforcing it in
config rather than review removes it as a thing anyone has to think about.

## Consequences

- One large mechanical diff converting the existing double-quoted code; after it,
  formatting diffs disappear from review.
- `npm run verify` fails on unformatted code — run `npm run format` (or an
  editor format-on-save wired to Prettier) before committing.
- Changing style later (e.g. print width) is a one-line config edit plus a single
  reformat pass.
