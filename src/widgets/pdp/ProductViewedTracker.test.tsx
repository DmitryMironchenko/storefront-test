import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// `vi.mock` is hoisted above imports, so the fn it returns must be created in a
// `vi.hoisted` block (the factory reads `track` at hoist time).
const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/shared/analytics', () => ({ track }));

import { ProductViewedTracker } from './ProductViewedTracker';

const product = {
  objectID: '4397400',
  name: 'Google - Chromecast - Black',
  brand: 'Google',
  price: 35,
};

beforeEach(() => {
  track.mockReset();
});

describe('ProductViewedTracker', () => {
  it("fires product_viewed once on mount with the product's identity", () => {
    render(<ProductViewedTracker product={product} />);
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith({
      name: 'product_viewed',
      product: expect.objectContaining({
        objectID: '4397400',
        name: 'Google - Chromecast - Black',
        brand: 'Google',
        price: 35,
      }),
    });
  });

  it('does not re-fire when the same product re-renders', () => {
    const { rerender } = render(<ProductViewedTracker product={product} />);
    rerender(<ProductViewedTracker product={product} />);
    expect(track).toHaveBeenCalledTimes(1);
  });

  it('renders nothing', () => {
    const { container } = render(<ProductViewedTracker product={product} />);
    expect(container).toBeEmptyDOMElement();
  });
});
