import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  BASKET_STORAGE_KEY,
  useBasketStore,
  type LineItemSnapshot,
} from './store';

const chromecast: LineItemSnapshot = {
  objectID: '4397400',
  name: 'Google - Chromecast - Black',
  brand: 'Google',
  image: 'https://cdn-demo.algolia.com/chromecast.jpg',
  price: 35,
};

const echo: LineItemSnapshot = {
  objectID: '5477500',
  name: 'Amazon - Echo - Charcoal',
  brand: 'Amazon',
  price: 99.99,
};

function reset() {
  localStorage.clear();
  // Back to the initial, pre-hydration state between tests.
  useBasketStore.setState({ items: [], hasHydrated: false });
}

beforeEach(reset);
afterEach(reset);

describe('basket store — mutations', () => {
  it('add() inserts a new line item with the given quantity (default 1)', () => {
    const { add } = useBasketStore.getState();
    act(() => add(chromecast));

    expect(useBasketStore.getState().items).toEqual([
      { ...chromecast, quantity: 1 },
    ]);
  });

  it('add() increments quantity when the product is already in the basket', () => {
    const { add } = useBasketStore.getState();
    act(() => {
      add(chromecast);
      add(chromecast, 2);
    });

    const items = useBasketStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  it("increment() raises a line's quantity by one", () => {
    const { add, increment } = useBasketStore.getState();
    act(() => {
      add(chromecast);
      increment(chromecast.objectID);
    });

    expect(useBasketStore.getState().items[0].quantity).toBe(2);
  });

  it('decrement() lowers quantity but floors at one (remove is explicit)', () => {
    const { add, decrement } = useBasketStore.getState();
    act(() => {
      add(chromecast, 2);
      decrement(chromecast.objectID);
      decrement(chromecast.objectID);
      decrement(chromecast.objectID);
    });

    expect(useBasketStore.getState().items[0].quantity).toBe(1);
  });

  it('remove() deletes the whole line regardless of quantity', () => {
    const { add, remove } = useBasketStore.getState();
    act(() => {
      add(chromecast, 3);
      add(echo);
      remove(chromecast.objectID);
    });

    const items = useBasketStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].objectID).toBe(echo.objectID);
  });

  it('clear() empties the basket', () => {
    const { add, clear } = useBasketStore.getState();
    act(() => {
      add(chromecast);
      add(echo);
      clear();
    });

    expect(useBasketStore.getState().items).toEqual([]);
  });
});

describe('basket store — persistence & cross-tab sync', () => {
  it('writes the basket to localStorage under the shared key', () => {
    act(() => useBasketStore.getState().add(chromecast));

    const raw = localStorage.getItem(BASKET_STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string).state.items).toEqual([
      { ...chromecast, quantity: 1 },
    ]);
  });

  it('does not persist the transient hasHydrated flag', () => {
    act(() => {
      useBasketStore.setState({ hasHydrated: true });
      useBasketStore.getState().add(chromecast);
    });

    const persisted = JSON.parse(
      localStorage.getItem(BASKET_STORAGE_KEY) as string,
    ).state;
    expect(persisted).not.toHaveProperty('hasHydrated');
  });

  it('rehydrate() picks up a basket written by another tab', async () => {
    // Simulate another tab having written the shared key.
    localStorage.setItem(
      BASKET_STORAGE_KEY,
      JSON.stringify({
        state: { items: [{ ...echo, quantity: 4 }] },
        version: 1,
      }),
    );

    await act(async () => {
      await useBasketStore.persist.rehydrate();
    });

    const items = useBasketStore.getState().items;
    expect(items).toEqual([{ ...echo, quantity: 4 }]);
  });

  it('marks hasHydrated true after rehydration', async () => {
    expect(useBasketStore.getState().hasHydrated).toBe(false);

    await act(async () => {
      await useBasketStore.persist.rehydrate();
    });

    expect(useBasketStore.getState().hasHydrated).toBe(true);
  });

  it('still completes hydration (empty basket) when the stored JSON is corrupt', async () => {
    // A blocked/corrupt read must not hang the UI on "Loading…": hydration
    // finishes, degrading to an empty basket rather than never resolving.
    localStorage.setItem(BASKET_STORAGE_KEY, '{ not valid json');

    await act(async () => {
      await useBasketStore.persist.rehydrate();
    });

    expect(useBasketStore.getState().hasHydrated).toBe(true);
    expect(useBasketStore.getState().items).toEqual([]);
  });
});
