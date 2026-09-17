import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetAnonymousIdCache } from './anonymous-id';
import type { AnalyticsSink } from './track';
import { resetAnalyticsSink, setAnalyticsSink, track } from './track';

let sink: ReturnType<typeof vi.fn>;

beforeEach(() => {
  window.localStorage.clear();
  resetAnonymousIdCache();
  sink = vi.fn();
  setAnalyticsSink(sink as unknown as AnalyticsSink);
});

afterEach(() => {
  resetAnalyticsSink();
});

describe('track', () => {
  it('emits the event through the active sink, enriched with timestamp + anonymousId', () => {
    track({
      name: 'add_to_cart',
      product: { objectID: '4397400', name: 'Chromecast', price: 35 },
      quantity: 1,
    });

    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink).toHaveBeenCalledWith({
      name: 'add_to_cart',
      product: { objectID: '4397400', name: 'Chromecast', price: 35 },
      quantity: 1,
      timestamp: expect.any(String),
      anonymousId: expect.any(String),
    });
  });

  it('stamps an ISO-8601 timestamp', () => {
    track({
      name: 'product_viewed',
      product: { objectID: '1', name: 'Echo' },
    });

    const { timestamp } = sink.mock.calls[0][0];
    expect(new Date(timestamp).toISOString()).toBe(timestamp);
  });

  it('reuses the same anonymousId across events in a session', () => {
    track({ name: 'product_viewed', product: { objectID: '1', name: 'A' } });
    track({ name: 'product_viewed', product: { objectID: '2', name: 'B' } });

    expect(sink.mock.calls[0][0].anonymousId).toBe(
      sink.mock.calls[1][0].anonymousId,
    );
  });

  it('routes to whichever sink is active (swappable behind track)', () => {
    const other = vi.fn();
    setAnalyticsSink(other as unknown as AnalyticsSink);

    track({ name: 'product_viewed', product: { objectID: '1', name: 'A' } });

    expect(other).toHaveBeenCalledTimes(1);
    expect(sink).not.toHaveBeenCalled();
  });

  it('never throws into the call site when the sink throws', () => {
    setAnalyticsSink(() => {
      throw new Error('vendor SDK is down');
    });
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() =>
      track({ name: 'product_viewed', product: { objectID: '1', name: 'A' } }),
    ).not.toThrow();
    expect(consoleError).toHaveBeenCalled();
  });

  it('carries checkout event payloads', () => {
    track({
      name: 'checkout_completed',
      orderId: 'order-1',
      currency: 'USD',
      itemCount: 3,
      total: 170,
    });

    expect(sink).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'checkout_completed',
        orderId: 'order-1',
        currency: 'USD',
        itemCount: 3,
        total: 170,
      }),
    );
  });
});
