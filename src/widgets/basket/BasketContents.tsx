'use client';

import type { ReactNode } from 'react';

import {
  useBasketHasHydrated,
  useBasketItems,
  useBasketSubtotal,
} from '@/entities/basket';
import { formatPrice } from '@/entities/product';

import { BasketLineItem } from './BasketLineItem';

// The shared basket body — the same list, subtotal, and empty state rendered in
// both the drawer quick-view and the /basket page (the page passes its own
// `footer` actions). Reads are gated on `hasHydrated`: until the persisted
// basket is read back on the client, it shows a neutral loading line instead of
// flashing "empty" and then the real contents (acceptance: no hydration flash).
type Props = {
  /** Heading id to associate the region with, when a heading is rendered outside. */
  'aria-labelledby'?: string;
  /** Context-specific actions (view basket, clear, checkout…) below the subtotal. */
  footer?: ReactNode;
  /** Message shown when the basket is empty. */
  emptyLabel?: string;
};

export function BasketContents({
  'aria-labelledby': ariaLabelledby,
  footer,
  emptyLabel = 'Your basket is empty.',
}: Props) {
  const hasHydrated = useBasketHasHydrated();
  const items = useBasketItems();
  const subtotal = useBasketSubtotal();

  if (!hasHydrated) {
    return (
      <p className='py-8 text-sm text-muted' aria-busy='true'>
        Loading your basket…
      </p>
    );
  }

  if (items.length === 0) {
    return <p className='py-8 text-sm text-muted'>{emptyLabel}</p>;
  }

  return (
    <div className='flex h-full flex-col' aria-labelledby={ariaLabelledby}>
      <ul className='flex-1 divide-y divide-border'>
        {items.map((item) => (
          <BasketLineItem key={item.objectID} item={item} />
        ))}
      </ul>

      <div className='mt-4 border-t border-border pt-4'>
        <div className='flex items-center justify-between'>
          <span className='text-sm text-muted'>Subtotal</span>
          <span className='text-lg font-semibold text-foreground tabular-nums'>
            {formatPrice(subtotal)}
          </span>
        </div>
        {/* Indicative total; the final price is re-validated at checkout. */}
        <p className='mt-1 text-xs text-muted'>
          Prices are indicative and confirmed at checkout.
        </p>
        {footer ? <div className='mt-4'>{footer}</div> : null}
      </div>
    </div>
  );
}
