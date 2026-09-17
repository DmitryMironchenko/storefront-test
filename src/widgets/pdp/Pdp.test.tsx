import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';

import type { ProductHit } from '@/entities/product';
import { Pdp } from './Pdp';

const product: ProductHit = {
  objectID: '4397400',
  name: 'Google - Chromecast - Black',
  brand: 'Google',
  description: 'Stream your favourite apps right to your TV.',
  categories: ['TV & Home Theater', 'Streaming Media Players'],
  price: 35,
  image: 'https://cdn-demo.algolia.com/bestbuy-0118/4397400_sb.jpg',
  rating: 4,
};

describe('Pdp', () => {
  it("names the product with the page's level-1 heading", () => {
    render(<Pdp product={product} />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Google - Chromecast - Black',
      }),
    ).toBeInTheDocument();
  });

  it('shows the brand, a currency-formatted price, and the description', () => {
    render(<Pdp product={product} />);
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('$35.00')).toBeInTheDocument();
    expect(
      screen.getByText('Stream your favourite apps right to your TV.'),
    ).toBeInTheDocument();
  });

  it("lists the product's categories", () => {
    render(<Pdp product={product} />);
    expect(screen.getByText('TV & Home Theater')).toBeInTheDocument();
    expect(screen.getByText('Streaming Media Players')).toBeInTheDocument();
  });

  it('exposes the rating to assistive tech', () => {
    render(<Pdp product={product} />);
    expect(screen.getByText('Rated 4 out of 5')).toBeInTheDocument();
  });

  it('gives the image the product name as its alt text', () => {
    render(<Pdp product={product} />);
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Google - Chromecast - Black',
    );
  });

  it('renders a sparse record without a brand, price, rating, or image', () => {
    const sparse: ProductHit = { objectID: '1', name: 'Mystery item' };
    render(<Pdp product={sparse} />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Mystery item' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    // Unsupported/absent image degrades to the placeholder, not a broken <img>.
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Pdp product={product} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
