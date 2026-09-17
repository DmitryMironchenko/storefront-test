// Public API of the shared analytics slice.
export { track, setAnalyticsSink, resetAnalyticsSink } from './track';
export { getAnonymousId } from './anonymous-id';
export type {
  AnalyticsEvent,
  AnalyticsEventName,
  TrackedEvent,
  ProductRef,
} from './events';
export type { AnalyticsSink } from './track';
