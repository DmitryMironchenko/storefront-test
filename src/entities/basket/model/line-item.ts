// A Line Item is a *display snapshot* of a Product taken at add-time (see
// CONTEXT.md and ADR 0001): the fields the Basket needs to render a row without
// re-querying the catalogue, plus a `quantity`. The snapshot `price` is
// **indicative** — what the user saw when they added the item — not the final
// charge; the Checkout route re-prices against the catalogue.
export type LineItem = {
  objectID: string;
  name: string;
  /** Add-time image URL. Optional: the catalogue may omit it (renders a
   *  placeholder), and the snapshot faithfully records what was shown. */
  image?: string;
  brand?: string;
  /** Indicative price shown at add-time, in USD. Always a number so the Basket
   *  can total lines without a catalogue round-trip. */
  price: number;
  quantity: number;
};

// The identity + display fields captured when adding a Product, before the
// Basket assigns a quantity. `add(snapshot)` turns this into a LineItem.
export type LineItemSnapshot = Omit<LineItem, "quantity">;
