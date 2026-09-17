'use client';

import { useEffect } from 'react';

import { useBasketStore } from './store';

// Reads the persisted basket back into the store, once, after mount. The store
// uses `skipHydration` so the first client render matches the server's empty
// basket (no mismatch); this effect then loads localStorage post-commit, which
// flips `hasHydrated` and fills `items`. Mount it once on a client surface that
// is always present — the header basket trigger — so every route benefits.
export function useHydrateBasket(): void {
  useEffect(() => {
    void useBasketStore.persist.rehydrate();
  }, []);
}
