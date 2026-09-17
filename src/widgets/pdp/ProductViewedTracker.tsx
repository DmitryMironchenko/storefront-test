"use client";

import { useEffect, useRef } from "react";

import type { ProductHit } from "@/entities/product";
import { track } from "@/shared/analytics";

// Fires the `product_viewed` analytics event once, after the PDP hydrates.
// Split out as a tiny client component so the surrounding <Pdp> stays a pure,
// server-rendered view — only this leaf needs the browser (the effect runs
// after hydration).
type Props = {
  product: Pick<ProductHit, "objectID" | "name" | "brand" | "price">;
};

export function ProductViewedTracker({ product }: Props) {
  const { objectID, name, brand, price } = product;

  // Guard by objectID so a Strict-Mode double-invoke (dev) or an incidental
  // re-render doesn't emit the view twice; a genuine navigation to a different
  // product mounts a fresh tracker and fires again.
  const trackedId = useRef<string | null>(null);

  useEffect(() => {
    if (trackedId.current === objectID) return;
    trackedId.current = objectID;
    track({
      name: "product_viewed",
      product: { objectID, name, brand, price },
    });
  }, [objectID, name, brand, price]);

  return null;
}
