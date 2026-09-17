"use client";

import { Button } from "@heroui/react";
import Image from "next/image";

import { useBasketStore, type LineItem } from "@/entities/basket";
import { formatPrice, isSupportedProductImage } from "@/entities/product";
import { track } from "@/shared/analytics";

// One Basket row: the add-time snapshot (image, brand, name, indicative price),
// a quantity stepper, and a remove control. Quantity nudges (`increment` /
// `decrement`) are silent state changes; removal is a deliberate user action,
// so it fires `remove_from_cart` at this seam (mirrors AddToCartButton). The
// decrement is floored at one by the store — removing is done via Remove.
export function BasketLineItem({ item }: { item: LineItem }) {
  const increment = useBasketStore((state) => state.increment);
  const decrement = useBasketStore((state) => state.decrement);
  const remove = useBasketStore((state) => state.remove);

  const { objectID, name, brand, image, price, quantity } = item;

  const handleRemove = () => {
    track({
      name: "remove_from_cart",
      payload: { objectID, name, brand, price, quantity },
    });
    remove(objectID);
  };

  return (
    <li className="flex gap-4 py-4">
      <div className="relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
        {isSupportedProductImage(image) ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="80px"
            className="object-contain p-1"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-full items-center justify-center text-xs text-muted"
          >
            No image
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {brand ? (
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {brand}
          </p>
        ) : null}
        <p className="line-clamp-2 text-sm font-medium text-foreground">
          {name}
        </p>
        <p className="text-sm text-muted">{formatPrice(price)}</p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div
            className="inline-flex items-center rounded-lg border border-border"
            role="group"
            aria-label={`Quantity for ${name}`}
          >
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              isDisabled={quantity <= 1}
              onPress={() => decrement(objectID)}
              aria-label={`Decrease quantity of ${name}`}
            >
              <span aria-hidden="true">−</span>
            </Button>
            <span
              className="min-w-8 text-center text-sm font-medium tabular-nums text-foreground"
              aria-live="polite"
            >
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              onPress={() => increment(objectID)}
              aria-label={`Increase quantity of ${name}`}
            >
              <span aria-hidden="true">+</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onPress={handleRemove}
            aria-label={`Remove ${name} from basket`}
          >
            Remove
          </Button>
        </div>
      </div>

      <p className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
        {formatPrice(price * quantity)}
      </p>
    </li>
  );
}
