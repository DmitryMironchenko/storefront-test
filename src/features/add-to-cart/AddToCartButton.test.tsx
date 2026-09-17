import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/shared/analytics', () => ({ track }));

import { useBasketStore } from '@/entities/basket';
import type { ProductHit } from '@/entities/product';

import { AddToCartButton } from './AddToCartButton';

const product: ProductHit = {
  objectID: '4397400',
  name: 'Google - Chromecast - Black',
  brand: 'Google',
  image: 'https://cdn-demo.algolia.com/chromecast.jpg',
  price: 35,
};

function reset() {
  localStorage.clear();
  useBasketStore.setState({ items: [], hasHydrated: true });
  track.mockReset();
}

beforeEach(reset);
afterEach(reset);

describe('AddToCartButton', () => {
  it('adds a snapshot line item to the basket on press', async () => {
    const user = userEvent.setup();
    render(<AddToCartButton product={product} />);

    await user.click(screen.getByRole('button', { name: /add to basket/i }));

    expect(useBasketStore.getState().items).toEqual([
      {
        objectID: '4397400',
        name: 'Google - Chromecast - Black',
        brand: 'Google',
        image: 'https://cdn-demo.algolia.com/chromecast.jpg',
        price: 35,
        quantity: 1,
      },
    ]);
  });

  it('fires add_to_cart with the product identity', async () => {
    const user = userEvent.setup();
    render(<AddToCartButton product={product} />);

    await user.click(screen.getByRole('button', { name: /add to basket/i }));

    expect(track).toHaveBeenCalledWith({
      name: 'add_to_cart',
      product: expect.objectContaining({
        objectID: '4397400',
        name: 'Google - Chromecast - Black',
        brand: 'Google',
        price: 35,
      }),
      quantity: 1,
    });
  });

  it('is disabled when the product has no price to snapshot', () => {
    render(<AddToCartButton product={{ ...product, price: undefined }} />);
    expect(
      screen.getByRole('button', { name: /add to basket/i }),
    ).toBeDisabled();
  });
});
