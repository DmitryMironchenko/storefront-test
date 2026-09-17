"use client";

import { useStats } from "react-instantsearch";

// Result count as a polite live region: when a filter changes the count, a
// screen reader announces the new total without moving focus (ADR 0004 a11y).
// `role="status"` implies `aria-live="polite"`.
export function SearchStats() {
  const { nbHits } = useStats();

  return (
    <p role="status" className="text-sm text-muted">
      {nbHits.toLocaleString()} {nbHits === 1 ? "product" : "products"}
    </p>
  );
}
