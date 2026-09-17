// The analytics event vocabulary: a discriminated union keyed on `name`, so a
// call site can only emit a known event and TypeScript checks the payload it
// carries. Adding a vendor later means mapping these five shapes — not hunting
// down `track()` calls.
//
// Wire names: cart events keep the industry-standard `add_to_cart` /
// `remove_from_cart` spelling (see CONTEXT.md) so downstream tools recognise
// them without a translation layer.

/** The identity + display fields an item carries into product/cart events.
 *  Nested (rather than spread flat) so the item's `name` never collides with
 *  the event's own `name` discriminant. */
export type ProductRef = {
  objectID: string;
  name: string;
  brand?: string;
  /** Indicative price shown to the user, in USD; absent when the catalogue
   *  omits a price (the item can't be added to the basket then). */
  price?: number;
};

/** Discriminant + payload for one event. */
type Event<Name extends string, Data> = { name: Name } & Data;

export type AnalyticsEvent =
  | Event<"product_viewed", { product: ProductRef }>
  | Event<"add_to_cart", { product: ProductRef; quantity: number }>
  | Event<"remove_from_cart", { product: ProductRef; quantity: number }>
  | Event<
      "checkout_started",
      { currency: string; itemCount: number; subtotal: number }
    >
  | Event<
      "checkout_completed",
      { orderId: string; currency: string; itemCount: number; total: number }
    >;

/** The event name literals, useful for narrowing/typing at the boundaries. */
export type AnalyticsEventName = AnalyticsEvent["name"];

/** What actually leaves the app: the event plus the enrichment `track()` adds.
 *  This is the shape a sink receives. */
export type TrackedEvent = AnalyticsEvent & {
  /** ISO-8601 UTC instant the event was recorded. */
  timestamp: string;
  /** Stable pseudonymous browser id (see getAnonymousId). */
  anonymousId: string;
};
