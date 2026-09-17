// Analytics façade.
//
// Call sites depend on exactly one thing: `track(event)` with a typed event
// (see events.ts). Everything else — how the event is stamped, where it goes —
// lives behind this seam. `track()` enriches each event with a timestamp and
// the anonymous visitor id, then hands it to the current *sink*. The default
// sink is the console (the brief sanctions console logging); swapping in a real
// vendor SDK, a buffer, or a test spy is `setAnalyticsSink(fn)` and touches no
// call site (acceptance: sink is swappable behind track()).

import { getAnonymousId } from "./anonymous-id";
import type { AnalyticsEvent, TrackedEvent } from "./events";

export type { AnalyticsEvent, TrackedEvent, ProductRef } from "./events";

/** Where enriched events go. A vendor adapter would implement this. */
export type AnalyticsSink = (event: TrackedEvent) => void;

// The sanctioned sink for this exercise. Logs the name for scanability and the
// full enriched payload for inspection.
const consoleSink: AnalyticsSink = (event) => {
  console.log("[analytics]", event.name, event);
};

let sink: AnalyticsSink = consoleSink;

/**
 * Replace the analytics sink. Call sites are unaffected — they only ever see
 * `track()`. Pass no thought to ordering: the newest sink wins for subsequent
 * events. Used to wire a real destination, or a spy in tests.
 */
export function setAnalyticsSink(next: AnalyticsSink): void {
  sink = next;
}

/** Restore the default console sink (primarily for test isolation). */
export function resetAnalyticsSink(): void {
  sink = consoleSink;
}

/**
 * Record an analytics event. Stamps it with `timestamp` (now, ISO-8601) and the
 * `anonymousId`, then emits through the active sink. The event's own fields are
 * spread first so the enrichment always lands with well-known keys.
 *
 * Fire-and-forget: analytics must never break the user action that emitted the
 * event, so a throwing sink (a flaky vendor SDK) or id generation is caught and
 * logged, not propagated into the call site.
 */
export function track(event: AnalyticsEvent): void {
  try {
    const enriched: TrackedEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      anonymousId: getAnonymousId(),
    };
    sink(enriched);
  } catch (error) {
    console.error("[analytics] track failed", error);
  }
}
