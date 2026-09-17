import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useBasketCount, useBasketSubtotal } from './selectors';
import { useBasketStore, type LineItemSnapshot } from './store';

const chromecast: LineItemSnapshot = {
  objectID: '4397400',
  name: 'Google - Chromecast - Black',
  brand: 'Google',
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
  useBasketStore.setState({ items: [], hasHydrated: false });
}

beforeEach(reset);
afterEach(reset);

describe('basket selectors', () => {
  it('count sums quantities across lines', () => {
    const { result } = renderHook(() => useBasketCount());
    expect(result.current).toBe(0);

    act(() => {
      useBasketStore.getState().add(chromecast, 2);
      useBasketStore.getState().add(echo);
    });

    expect(result.current).toBe(3);
  });

  it('subtotal sums price × quantity from add-time snapshots', () => {
    const { result } = renderHook(() => useBasketSubtotal());

    act(() => {
      useBasketStore.getState().add(chromecast, 2); // 70
      useBasketStore.getState().add(echo); // 99.99
    });

    expect(result.current).toBeCloseTo(169.99, 2);
  });
});
