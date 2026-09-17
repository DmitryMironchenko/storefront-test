import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));

import {
  BASKET_STORAGE_KEY,
  useBasketStore,
  type LineItem,
} from '@/entities/basket';

import { BasketTrigger } from './BasketTrigger';

const echo: LineItem = {
  objectID: '5477500',
  name: 'Amazon - Echo - Charcoal',
  brand: 'Amazon',
  price: 100,
  quantity: 3,
};

function reset() {
  localStorage.clear();
  useBasketStore.setState({ items: [], hasHydrated: false });
}

beforeEach(reset);
afterEach(reset);

describe('BasketTrigger', () => {
  it('shows no count badge when the basket is empty', async () => {
    render(<BasketTrigger />);
    // Hydrates from empty storage → the trigger is present but carries no
    // numeric badge (the badge only appears for a non-empty basket).
    await waitFor(() => {
      expect(useBasketStore.getState().hasHydrated).toBe(true);
    });
    expect(screen.getByRole('button', { name: /basket/i })).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows the persisted count in the badge and label after hydration', async () => {
    // Simulate a basket persisted from a previous session / another tab.
    localStorage.setItem(
      BASKET_STORAGE_KEY,
      JSON.stringify({ state: { items: [echo] }, version: 1 }),
    );

    render(<BasketTrigger />);

    // useHydrateBasket rehydrates after mount → count appears (no flash).
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /basket, 3 items/i }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
