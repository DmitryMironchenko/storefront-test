import { BackToProductsLink } from '@/shared/ui';
import { formatPrice } from '@/entities/product';

import type { CheckoutResponse } from '../model/contract';

// Shown in place of the basket after a successful checkout. Presentational: it
// renders the authoritative order the server returned (id, priced lines, total)
// — the source of truth for what was "charged", derived from the catalogue, not
// the client's indicative subtotal (ADR 0001).
type Props = {
  order: CheckoutResponse;
};

export function OrderConfirmation({ order }: Props) {
  const unitLabel = order.itemCount === 1 ? 'item' : 'items';

  return (
    <section aria-labelledby='order-confirmation-heading' className='py-4'>
      <h1
        id='order-confirmation-heading'
        className='text-2xl font-semibold tracking-tight text-foreground'
      >
        Order confirmed
      </h1>
      <p className='mt-2 text-sm text-muted'>
        Thank you — your order is placed. A confirmation would normally be on
        its way. Order reference{' '}
        <span className='font-medium text-foreground'>{order.orderId}</span>.
      </p>

      <ul className='mt-6 divide-y divide-border border-y border-border'>
        {order.lineItems.map((line) => (
          <li
            key={line.objectID}
            className='flex items-baseline justify-between gap-4 py-3'
          >
            <span className='text-sm text-foreground'>
              {line.name}
              <span className='text-muted'> × {line.quantity}</span>
            </span>
            <span className='text-sm font-medium text-foreground tabular-nums'>
              {formatPrice(line.lineTotal)}
            </span>
          </li>
        ))}
      </ul>

      <div className='mt-4 flex items-center justify-between'>
        <span className='text-sm text-muted'>
          Total ({order.itemCount} {unitLabel})
        </span>
        <span className='text-lg font-semibold text-foreground tabular-nums'>
          {formatPrice(order.total)}
        </span>
      </div>

      <nav className='mt-8'>
        <BackToProductsLink />
      </nav>
    </section>
  );
}
