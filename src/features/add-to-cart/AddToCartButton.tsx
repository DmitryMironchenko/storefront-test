"use client";

import { Button } from "@heroui/react";

import { useBasketStore, type LineItemSnapshot } from "@/entities/basket";
import type { ProductHit } from "@/entities/product";
import { track } from "@/shared/analytics";

// The "Add to basket" affordance (the `add-to-cart` feature). Snapshots the
// Product into a Line Item, pushes it to the basket store, and fires the
// `add_to_cart` event. Analytics lives here, at the interaction seam, rather
// than in the store, so the store stays pure state and every call site that
// isn't a deliberate user action doesn't emit an event (mirrors the PDP's
// ProductViewedTracker). A Product with no price can't be snapshotted, so the
// button is disabled — the Basket totals lines and needs a number.
type Props = {
  product: Pick<ProductHit, "objectID" | "name" | "brand" | "image" | "price">;
};

export function AddToCartButton({ product }: Props) {
  const add = useBasketStore((state) => state.add);
  const { objectID, name, brand, image, price } = product;
  const canAdd = typeof price === "number";

  const handlePress = () => {
    if (!canAdd) return;
    const snapshot: LineItemSnapshot = { objectID, name, brand, image, price };
    add(snapshot);
    track({
      name: "add_to_cart",
      product: { objectID, name, brand, price },
      quantity: 1,
    });
  };

  return (
    <Button
      variant="primary"
      isDisabled={!canAdd}
      onPress={handlePress}
      className="w-full sm:w-auto"
    >
      Add to basket
    </Button>
  );
}
