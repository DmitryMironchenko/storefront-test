// Analytics façade.
//
// A thin, typed seam over "how events leave the app". For this exercise the sink
// is the console (the brief says console logging is fine); the point of the
// façade is that call sites depend on `track(event)` and typed payloads, not on
// the transport. The full event union (view_item, add_to_cart, etc.) and the
// anonymous-id enrichment land in the analytics step (issue #6); this is the
// seam they build on.

export type AnalyticsEvent = {
  /** Event name. Wire form for cart events keeps the industry-standard
   *  `add_to_cart` / `remove_from_cart` spelling (see CONTEXT.md). */
  name: string;
  /** Arbitrary, event-specific payload. Typed per-event in issue #6. */
  payload?: Record<string, unknown>;
};

export function track(event: AnalyticsEvent): void {
  // Console is the sanctioned sink for this exercise (see brief / CONTEXT.md).
  console.log("[analytics]", event.name, event.payload ?? {});
}
