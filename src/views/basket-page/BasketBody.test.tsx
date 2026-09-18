import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/analytics', () => ({
  track: vi.fn(),
  getAnonymousId: () => 'anon-test',
}));

const { submitCheckout } = vi.hoisted(() => ({ submitCheckout: vi.fn() }));
vi.mock('@/features/checkout/api/submitCheckout', () => ({ submitCheckout }));

import { useBasketStore } from '@/entities/basket';
import type { CheckoutResponse } from '@/features/checkout/model/contract';

import { BasketBody } from './BasketBody';

const order: CheckoutResponse = {
  orderId: 'order-abc',
  currency: 'USD',
  itemCount: 1,
  total: 100,
  lineItems: [
    {
      objectID: 'a',
      name: 'Camera',
      quantity: 1,
      unitPrice: 100,
      lineTotal: 100,
    },
  ],
};

function seedBasket() {
  useBasketStore.setState({
    hasHydrated: true,
    items: [{ objectID: 'a', name: 'Camera', price: 100, quantity: 1 }],
  });
}

function reset() {
  localStorage.clear();
  useBasketStore.setState({ items: [], hasHydrated: true });
  submitCheckout.mockReset();
}

beforeEach(reset);
afterEach(reset);

describe('BasketBody', () => {
  it('shows the checkout CTA when the basket has items', () => {
    seedBasket();
    render(<BasketBody />);

    expect(
      screen.getByRole('heading', { name: /your basket/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /checkout/i }),
    ).toBeInTheDocument();
  });

  it('hides the checkout CTA when the basket is empty', () => {
    render(<BasketBody />);
    expect(
      screen.queryByRole('button', { name: /checkout/i }),
    ).not.toBeInTheDocument();
  });

  it('swaps the basket for the order confirmation on success', async () => {
    seedBasket();
    submitCheckout.mockResolvedValue(order);
    const user = userEvent.setup();
    render(<BasketBody />);

    await user.click(screen.getByRole('button', { name: /checkout/i }));

    expect(
      await screen.findByRole('heading', { name: /order confirmed/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/order-abc/)).toBeInTheDocument();
    // The basket surface is gone once confirmed.
    expect(
      screen.queryByRole('heading', { name: /your basket/i }),
    ).not.toBeInTheDocument();
    expect(useBasketStore.getState().items).toEqual([]);
  });

  it('surfaces a retryable error and keeps the basket on failure', async () => {
    seedBasket();
    submitCheckout.mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    render(<BasketBody />);

    await user.click(screen.getByRole('button', { name: /checkout/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /your basket/i }),
    ).toBeInTheDocument();
    expect(useBasketStore.getState().items).toHaveLength(1);
  });
});
