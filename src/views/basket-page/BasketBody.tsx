'use client';

import { BackToProductsLink } from '@/shared/ui';
import {
  CheckoutButton,
  OrderConfirmation,
  useCheckout,
} from '@/features/checkout';
import { BasketContents } from '@/widgets/basket';

import { ClearBasketButton } from './ClearBasketButton';

// The interactive body of the /basket view. Owns the checkout hook and the
// single decision the page turns on: show the basket (with a checkout CTA) or,
// once an order is placed, the confirmation in its place. Kept in the view layer
// (composing the basket widget and the checkout feature) so BasketPage stays a
// thin server shell. The checkout CTA rides in BasketContents' footer, which
// only renders when the basket is non-empty — so it never shows on an empty or
// not-yet-hydrated basket.
export function BasketBody() {
  const headingId = 'basket-heading';
  const { status, order, error, submit } = useCheckout();

  if (status === 'success' && order) {
    return <OrderConfirmation order={order} />;
  }

  return (
    <>
      <nav className='mb-8'>
        <BackToProductsLink />
      </nav>

      <header className='mb-6 flex items-end justify-between gap-4'>
        <h1
          id={headingId}
          className='text-2xl font-semibold tracking-tight text-foreground'
        >
          Your basket
        </h1>
        <ClearBasketButton />
      </header>

      <BasketContents
        aria-labelledby={headingId}
        emptyLabel='Your basket is empty. Browse the catalogue to add products.'
        footer={
          <CheckoutButton
            status={status}
            error={error}
            onSubmit={() => void submit()}
          />
        }
      />
    </>
  );
}
