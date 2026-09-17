import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/shared/analytics', () => ({ track }));

import { useBasketStore, type LineItem } from '@/entities/basket';

import { BasketContents } from './BasketContents';

const chromecast: LineItem = {
  objectID: '4397400',
  name: 'Google - Chromecast - Black',
  brand: 'Google',
  price: 35,
  quantity: 2,
};

const echo: LineItem = {
  objectID: '5477500',
  name: 'Amazon - Echo - Charcoal',
  brand: 'Amazon',
  price: 100,
  quantity: 1,
};

function setBasket(items: LineItem[], hasHydrated = true) {
  act(() => useBasketStore.setState({ items, hasHydrated }));
}

function reset() {
  localStorage.clear();
  act(() => useBasketStore.setState({ items: [], hasHydrated: false }));
  track.mockReset();
}

beforeEach(reset);
afterEach(reset);

describe('BasketContents', () => {
  it('shows a loading line before hydration (no empty flash)', () => {
    setBasket([], false);
    render(<BasketContents />);
    expect(screen.getByText(/loading your basket/i)).toBeInTheDocument();
    expect(screen.queryByText(/your basket is empty/i)).not.toBeInTheDocument();
  });

  it('shows the empty message once hydrated and empty', () => {
    setBasket([]);
    render(<BasketContents />);
    expect(screen.getByText(/your basket is empty/i)).toBeInTheDocument();
  });

  it('renders each line item and the subtotal from add-time prices', () => {
    setBasket([chromecast, echo]); // 2×35 + 1×100 = 170
    render(<BasketContents />);

    expect(screen.getByText('Google - Chromecast - Black')).toBeInTheDocument();
    expect(screen.getByText('Amazon - Echo - Charcoal')).toBeInTheDocument();
    expect(screen.getByText('$170.00')).toBeInTheDocument();
  });

  it('removes a line and fires remove_from_cart', async () => {
    const user = userEvent.setup();
    setBasket([chromecast, echo]);
    render(<BasketContents />);

    await user.click(
      screen.getByRole('button', {
        name: /remove google - chromecast - black from basket/i,
      }),
    );

    expect(useBasketStore.getState().items).toEqual([echo]);
    expect(track).toHaveBeenCalledWith({
      name: 'remove_from_cart',
      product: expect.objectContaining({
        objectID: '4397400',
      }),
      quantity: 2,
    });
  });

  it('increments and decrements quantity (floored at one)', async () => {
    const user = userEvent.setup();
    setBasket([echo]); // quantity 1
    render(<BasketContents />);

    const decrease = screen.getByRole('button', {
      name: /decrease quantity of amazon - echo - charcoal/i,
    });
    expect(decrease).toBeDisabled(); // floored at 1

    await user.click(
      screen.getByRole('button', {
        name: /increase quantity of amazon - echo - charcoal/i,
      }),
    );
    expect(useBasketStore.getState().items[0].quantity).toBe(2);
  });
});
