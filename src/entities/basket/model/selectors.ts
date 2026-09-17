import { useBasketStore } from "./store";
import type { LineItem } from "./line-item";

// Derived reads over the basket. Each is a hook selecting from the store, so a
// component re-renders only when the slice it reads changes. Kept beside the
// store (not inline at call sites) so "count" and "subtotal" have one
// definition the whole app agrees on.

const countItems = (items: LineItem[]) =>
  items.reduce((total, item) => total + item.quantity, 0);

const subtotalItems = (items: LineItem[]) =>
  items.reduce((total, item) => total + item.price * item.quantity, 0);

/** The line items, in insertion order. */
export const useBasketItems = () => useBasketStore((state) => state.items);

/** Total number of units across all lines (the badge count). */
export const useBasketCount = () =>
  useBasketStore((state) => countItems(state.items));

/** Indicative subtotal from add-time prices; re-priced at checkout (ADR 0001). */
export const useBasketSubtotal = () =>
  useBasketStore((state) => subtotalItems(state.items));

/** Whether the persisted basket has been read back (see store `hasHydrated`). */
export const useBasketHasHydrated = () =>
  useBasketStore((state) => state.hasHydrated);
