import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

import type { LineItem, LineItemSnapshot } from "./line-item";

export type { LineItem, LineItemSnapshot } from "./line-item";

// One key, shared by every tab, so a basket written in one tab is the basket
// read in another (the cross-tab sync below listens for writes to it).
export const BASKET_STORAGE_KEY = "breitling-basket";
const STORAGE_VERSION = 1;

type BasketState = {
  items: LineItem[];
  /** False until the persisted basket has been read back on the client. UI
   *  gates on this so the server HTML and the first client render agree
   *  (empty), then the real count appears — no hydration mismatch or flash. */
  hasHydrated: boolean;

  /** Add a Product to the basket, or bump its quantity if already present. */
  add: (snapshot: LineItemSnapshot, quantity?: number) => void;
  /** Raise a line's quantity by one. */
  increment: (objectID: string) => void;
  /** Lower a line's quantity by one, never below one — removal is explicit. */
  decrement: (objectID: string) => void;
  /** Remove a line entirely, whatever its quantity. */
  remove: (objectID: string) => void;
  /** Empty the basket (e.g. after a successful checkout). */
  clear: () => void;
};

// persist calls the storage getter during `create()`, which also runs on the
// server while a client component is server-rendered. `localStorage` is absent
// there, so fall back to a no-op store; real reads/writes only happen in the
// browser (and hydration is deferred to the client via `skipHydration`).
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const storage = createJSONStorage<Pick<BasketState, "items">>(() =>
  typeof window !== "undefined" ? window.localStorage : noopStorage,
);

export const useBasketStore = create<BasketState>()(
  persist(
    (set) => ({
      items: [],
      hasHydrated: false,

      add: (snapshot, quantity = 1) =>
        set((state) => {
          const existing = state.items.find(
            (item) => item.objectID === snapshot.objectID,
          );
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.objectID === snapshot.objectID
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              ),
            };
          }
          return { items: [...state.items, { ...snapshot, quantity }] };
        }),

      increment: (objectID) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.objectID === objectID
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        })),

      decrement: (objectID) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.objectID === objectID
              ? { ...item, quantity: Math.max(1, item.quantity - 1) }
              : item,
          ),
        })),

      remove: (objectID) =>
        set((state) => ({
          items: state.items.filter((item) => item.objectID !== objectID),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: BASKET_STORAGE_KEY,
      version: STORAGE_VERSION,
      storage,
      // Persist only the basket contents; `hasHydrated` is a per-load UI flag.
      partialize: (state) => ({ items: state.items }),
      // Hydrate in a client effect (see useHydrateBasket), not during create(),
      // so the first client render matches the server's empty basket.
      skipHydration: true,
      // Always mark hydration complete — including when reading storage threw
      // (blocked / private-mode localStorage) or the stored JSON was corrupt.
      // In those cases persist calls back with `state` undefined and leaves the
      // basket empty, so flipping the flag off `state` would no-op and the UI
      // would hang on "Loading…" forever; read the flag off the store instead.
      // The guard also means a cross-tab rehydrate (already hydrated) doesn't
      // trigger a redundant write-back of the flag.
      onRehydrateStorage: () => () => {
        if (!useBasketStore.getState().hasHydrated) {
          useBasketStore.setState({ hasHydrated: true });
        }
      },
    },
  ),
);

// Cross-tab sync: `persist` writes to localStorage but does not listen for other
// tabs' writes. When another tab changes the shared key, re-read it so this
// tab's basket stays in step. Registered once, on the client only.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === BASKET_STORAGE_KEY) {
      void useBasketStore.persist.rehydrate();
    }
  });
}
