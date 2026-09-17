"use client";

import { Button } from "@heroui/react";

import {
  useBasketCount,
  useBasketHasHydrated,
  useBasketStore,
} from "@/entities/basket";

// "Clear basket" action for the basket page. Rendered as a leaf Client Component
// so the surrounding BasketPage view stays a server shell. Hidden until the
// basket is hydrated and non-empty, so it never appears next to an empty or
// not-yet-loaded basket. Clearing is a plain state reset (no add/remove event).
export function ClearBasketButton() {
  const hasHydrated = useBasketHasHydrated();
  const count = useBasketCount();
  const clear = useBasketStore((state) => state.clear);

  if (!hasHydrated || count === 0) return null;

  return (
    <Button variant="ghost" size="sm" onPress={() => clear()}>
      Clear basket
    </Button>
  );
}
