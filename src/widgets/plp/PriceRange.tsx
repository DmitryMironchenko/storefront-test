'use client';

import { useState } from 'react';
import { useRange } from 'react-instantsearch';

// A custom price-range filter built on the `useRange` connector rather than the
// stock <RangeInput> widget. <RangeInput> wraps its two number inputs in EMPTY
// <label>s, so each input's only "name" is a numeric placeholder — which trips
// the PLP axe gate (`label`) and leaves a screen reader announcing two unnamed
// spinbuttons. Here each input carries a real visible label, so the control is
// navigable and axe-clean (ADR 0007 / 0013).
//
// Reads the InstantSearch *connector* (SSR-populated, like <PlpPagination>) so
// server and client agree — no hydration mismatch. Bounds are committed on
// submit, not per keystroke: one search per applied range, and a keyboard user
// can type both bounds before it queries.

const inputClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-foreground placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50';
const labelClass = 'flex flex-1 flex-col gap-1 text-xs text-muted';

// `start` echoes ±Infinity when a bound is unset and the facet's own min/max
// when a side carries no real filter — both render as an empty field.
function toFieldValue(value: number | undefined, edge: number | undefined) {
  if (value == null || !Number.isFinite(value) || value === edge) return '';
  return String(value);
}

function parseBound(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
}

// Normalize a submitted pair before it reaches `refine`. An inverted pair
// (min > max) would apply `>= a AND <= b` → an always-empty result set, and
// `connectRange` won't guard it (its only checks are per-bound facet-range
// checks), so swap it here. Out-of-facet-range bounds are already blocked at the
// inputs by their `min`/`max` attributes (native constraint validation stops the
// submit with an inline message), which is why there is no clamp step.
function normalizeBounds(
  from: string,
  to: string,
): [number | undefined, number | undefined] {
  let lo = parseBound(from);
  let hi = parseBound(to);
  if (lo != null && hi != null && lo > hi) [lo, hi] = [hi, lo];
  return [lo, hi];
}

export function PriceRange() {
  const { start, range, canRefine, refine } = useRange({ attribute: 'price' });

  const from = toFieldValue(start[0], range.min);
  const to = toFieldValue(start[1], range.max);

  // Local edits, re-synced whenever the committed refinement changes (a shared
  // link restoring a range, or "Clear all" resetting it) — the render-phase
  // reset pattern, so no effect is needed.
  const [draft, setDraft] = useState({ from, to });
  const [committed, setCommitted] = useState({ from, to });
  if (committed.from !== from || committed.to !== to) {
    setDraft({ from, to });
    setCommitted({ from, to });
  }

  return (
    <form
      className='flex items-end gap-2'
      onSubmit={(event) => {
        event.preventDefault();
        refine(normalizeBounds(draft.from, draft.to));
      }}
    >
      <label className={labelClass}>
        Min price
        <input
          type='number'
          inputMode='decimal'
          min={range.min}
          max={range.max}
          step='any'
          value={draft.from}
          placeholder={range.min != null ? String(range.min) : undefined}
          disabled={!canRefine}
          onChange={(event) =>
            setDraft((d) => ({ ...d, from: event.target.value }))
          }
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        Max price
        <input
          type='number'
          inputMode='decimal'
          min={range.min}
          max={range.max}
          step='any'
          value={draft.to}
          placeholder={range.max != null ? String(range.max) : undefined}
          disabled={!canRefine}
          onChange={(event) =>
            setDraft((d) => ({ ...d, to: event.target.value }))
          }
          className={inputClass}
        />
      </label>
      <button
        type='submit'
        disabled={!canRefine}
        className='rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-accent-text hover:border-accent disabled:cursor-not-allowed disabled:opacity-50'
      >
        Apply
      </button>
    </form>
  );
}
