'use client';

import { Button } from '@heroui/react';

import type { CheckoutStatus } from '../model/useCheckout';

// The checkout call-to-action, rendered in the basket footer. Presentational:
// the basket-page view owns the useCheckout hook and passes the state down, so
// this component is trivial to render in isolation. Busy while submitting;
// surfaces a retryable error message inline (the basket is left intact on
// failure, see useCheckout).
type Props = {
  status: CheckoutStatus;
  error: string | null;
  onSubmit: () => void;
};

export function CheckoutButton({ status, error, onSubmit }: Props) {
  const isSubmitting = status === 'submitting';

  return (
    <div>
      <Button
        variant='primary'
        className='w-full'
        isPending={isSubmitting}
        onPress={onSubmit}
      >
        {isSubmitting ? 'Placing order…' : 'Checkout'}
      </Button>
      {error ? (
        <p role='alert' className='mt-2 text-sm text-danger'>
          {error}
        </p>
      ) : null}
    </div>
  );
}
