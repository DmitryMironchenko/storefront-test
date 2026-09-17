# 0005 — Dark mode: bridge `prefers-color-scheme` to HeroUI's attribute strategy

- Status: Accepted
- Date: 2026-09-17

## Context

ADR 0003 chose **auto dark mode** driven by `prefers-color-scheme`, with **no
manual toggle**, and deferred the mechanism to "#2" (Step 1, this foundation).
The spike correction in ADR 0003 then found that HeroUI **v3 activates dark mode
by an attribute/class**, not by a media query: its theme CSS defines the dark
token values under `.dark, [data-theme="dark"]` and the light values under
`:root, [data-theme="light"]`. With no attribute set, HeroUI renders **light**
regardless of the OS preference. So "auto dark via `prefers-color-scheme`" and
"HeroUI's attribute strategy" have to be reconciled — that is this step's job.

## Decision

**Bridge the OS preference to HeroUI's attribute with a tiny pre-paint inline
script.** In `app/layout.tsx` a blocking `<script>` (first child of `<body>`)
reads `matchMedia('(prefers-color-scheme: dark)')`, sets
`document.documentElement.dataset.theme` to `dark`/`light` before first paint,
and registers a `change` listener so a live OS switch re-themes the app. `<html>`
carries `suppressHydrationWarning` because the script writes the attribute before
React hydrates.

`prefers-color-scheme` remains the **single source of truth**; the script only
translates it into the attribute HeroUI reads. There is no manual toggle and no
persisted preference — consistent with ADR 0003's intent. HeroUI keeps ownership
of the token values; `globals.css` only re-exposes them as Tailwind utilities
(`bg-background`, `text-foreground`, …) and no longer hardcodes colours.

## Alternatives considered

- **Pure-CSS re-declaration** — copy HeroUI's dark token values into a
  `@media (prefers-color-scheme: dark) { :root { … } }` block. Zero runtime JS,
  but duplicates ~40 `oklch` variables and silently drifts when HeroUI updates
  its theme. Rejected: brittle, high-maintenance.
- **`next-themes`** — the canonical toggle library. Heavier than needed for a
  no-toggle, media-query-only requirement; revisit if a user-facing theme switch
  is ever added (the bridge already leaves `data-theme` as the seam it would
  drive).
- **No bridge** — accept light-only. Fails ADR 0003's graded-a11y-adjacent
  intent to honour the user's OS preference.

## Consequences

- Auto dark mode works with the OS preference as the source of truth, no FOUC
  (the attribute is set before paint), and HeroUI stays the token owner so its
  updates flow through without edits here.
- One small piece of inline JS runs on every page and `<html>` needs
  `suppressHydrationWarning`. Under a strict CSP this inline script would need a
  nonce/hash — noted for if a CSP is added later.
- A future manual toggle is a small change: write `data-theme` from user state
  instead of (or layered over) the media query; the rest of the theming is
  already attribute-driven.
