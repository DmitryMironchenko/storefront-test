# 0013 — Accessibility verification: layered axe + a keyboard-focus baseline + a manual SR gate

- Status: Accepted
- Date: 2026-09-18

## Context

Spec requirement 7 — _"works with a screen reader"_ — is a graded requirement,
and Step 7 (issue #8) is the cross-cutting pass that has to _demonstrate_ it,
not just assert it. The a11y affordances themselves were built into the earlier
steps as they landed (ADR 0007): the single `search` landmark, the
`fieldset`/`legend` facet grouping, the `role="status"` result-count live region,
`aria-current` pagination, labelled icon buttons, the React Aria drawer. What was
missing was the _verification_ that ties them together and guards them against
regression, plus one genuine gap automated tooling structurally cannot see.

Two constraints shape the decision:

- **axe can only see machine-detectable failures.** It cannot judge whether an
  announced experience makes sense, and — critically — it cannot see a _missing_
  focus indicator (WCAG 2.4.7). A "clean axe" run is necessary, not sufficient.
- **The split from ADR 0004 stands**: Vitest for synchronous components, Playwright
  for the async Server Component pages and real navigation/overlay behaviour.

## Decision

### 1. axe runs at two layers, mirroring the ADR 0004 test split

- **Component (`vitest-axe`)** on the synchronous components where labelling and
  semantics regress — the filter `fieldset`, product card, PDP body, and now the
  **populated basket** (list + quantity steppers + remove controls), rendered in
  a `<main>` landmark so the scan reflects how it mounts.
- **Page (`@axe-core/playwright`)** on all three core pages — PLP, **PDP** (added
  here), and the populated basket page — the full-document scans that catch
  landmark/contrast/heading issues only a real render exposes. The PDP spec
  resolves a real product link from the live PLP rather than hardcoding an
  `objectID`, so it follows the catalogue.

### 2. The affordances axe under-tests get explicit E2E assertions

axe does not fully prove the _behaviour_ of a live region or the current-page
marker, so the PLP spec asserts the `role="status"` count region and that exactly
one pagination control carries `aria-current="page"`; the basket spec asserts the
drawer's React Aria focus management — focus moves **into** the dialog on open and
**returns to the trigger** on `Esc`. These are the seams a refactor would silently
break; the E2E gate now trips instead.

### 3. A single global keyboard-focus baseline, not per-element patches

axe cannot flag a missing focus ring, so it is fixed once in `globals.css`:

```css
:where(a, button):focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

`:where()` keeps specificity at zero so HeroUI/React Aria components keep their
own richer focus styles; the rule only backstops the **native** `<a>`/`<button>`
the app and InstantSearch render (product cards, facet options, pagination),
which otherwise fall back to a thin, easily-reset UA outline. It is deliberately
_not_ widened to `[tabindex]`, which would also match the `tabindex="-1"` focus
containers React Aria manages itself. `--accent` clears the 3:1 non-text
threshold (ADR 0007) and re-mixes with the theme. `:focus-visible` shows it for
keyboard focus only, never on mouse click.

### 4. The manual screen-reader pass is a written, run-once checklist

VoiceOver/NVDA judgement can't be automated, so the residual manual gate ADR 0004
named is now a concrete checklist — `docs/a11y/manual-sr-checklist.md` — covering
the critical flow (browse → filter → PDP → add → checkout) with the exact SR
gestures. It is run per a11y-affecting change; findings are fixed in code, never
by loosening the automated scans.

## Consequences

- The three core pages have both component- and page-level axe coverage; the two
  behavioural affordances (live region, focus trap) and the current-page marker
  are guarded by E2E, so the CI merge gate (ADR 0011) now enforces a11y regressions.
- Keyboard focus is visible and AA-contrast across every native interactive
  element from one low-specificity rule, with no double rings on HeroUI controls.
- "Works with a screen reader" is demonstrated by automated scans _plus_ a
  repeatable manual pass, not asserted.

## Risks

- The global focus rule assumes HeroUI components carry their own focus styling;
  if a future HeroUI version drops that on some control, the zero-specificity
  backstop still applies a valid outline — degraded, not broken.
- The manual checklist only has value if actually run; it is scoped to the one
  critical flow to keep that cost low and the habit sustainable.
