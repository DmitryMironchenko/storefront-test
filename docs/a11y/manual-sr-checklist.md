# Manual screen-reader smoke checklist

Step 7 (issue #8) covers spec requirement 7 — _"works with a screen reader."_
Automated axe (Vitest component scans + Playwright page scans on PLP, PDP and
basket) catches machine-detectable regressions, but it cannot judge whether the
announced experience actually makes sense. This checklist is the residual manual
gate ADR 0004 always treated as a checklist item, and ADR 0013 formalises.

Run it once per release-worth of a11y-affecting change, on the critical flow:
**browse → filter → open PDP → add → checkout.**

## How to run

- **macOS / VoiceOver**: `Cmd+F5` to toggle. Navigate with `Ctrl+Option+←/→`;
  the rotor is `Ctrl+Option+U` (check Landmarks, Headings, Form controls).
- **Windows / NVDA**: `Ctrl+Alt+N` to start. `NVDA+F7` opens the elements list
  (Landmarks / Headings / Links).
- Drive with the **keyboard only** — no mouse. If focus is ever lost or invisible,
  that is a finding (WCAG 2.4.7; see the focus-visible baseline in `globals.css`).

## Critical flow

### 1. Browse (PLP `/`)

- [ ] One `search` landmark only (the site search box). No competing second one.
- [ ] Heading structure reads sensibly: a single page `<h1>` ("Products").
- [ ] Result count is announced as a status/polite update on load and after a
      filter change — focus does **not** jump to it.
- [ ] Product cards are reachable by keyboard; each link's accessible name
      identifies the product (not a bare "link").

### 2. Filter

- [ ] Each facet is announced as a named group ("Category, group" / "Brand,
      group") before its options — the `fieldset`/`legend` grouping.
- [ ] Toggling a facet updates the result-count live region; the new total is
      spoken without a focus jump.
- [ ] Pagination is reachable as a "Pagination" navigation landmark; the current
      page is announced as current (`aria-current="page"`).

### 3. Open PDP (`/product/[objectID]`)

- [ ] "Back to products" link is announced with a meaningful name.
- [ ] Product name is the page `<h1>`; brand, price and description are read in a
      sensible order.
- [ ] Rating is announced as "Rated N out of 5" (the visually-hidden text), not
      as a bare "star N".
- [ ] Product image has a descriptive `alt`; the "No image" placeholder is not
      announced (it is `aria-hidden`).

### 4. Add to basket

- [ ] "Add to basket" button has a clear accessible name and an operable state.
- [ ] After adding, the header basket control's accessible name reflects the new
      count ("Basket, N items").

### 5. Basket drawer + checkout

- [ ] Opening the drawer moves focus into the dialog; it is announced as a
      dialog titled "Your basket".
- [ ] Focus is trapped inside the drawer while open; `Esc` closes it and returns
      focus to the trigger button.
- [ ] Quantity steppers and remove controls announce which line item they act on
      ("Increase quantity of …", "Remove … from basket").
- [ ] On the `/basket` page, the subtotal and the "indicative price" note are
      reachable and read in context.
- [ ] Checkout completes the flow to the confirmation state via keyboard + SR.

## Recording findings

Log any finding as a checkbox in issue #8 (or a follow-up), note the SR + browser,
and fix in code — not by loosening the automated scans. Re-run the affected
section after the fix.
