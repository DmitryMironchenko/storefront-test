import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it } from 'vitest';

import type { ProductHit } from '../model/product';
import { ProductCard } from './ProductCard';

const baseProduct: ProductHit = {
  objectID: '4397400',
  name: 'Google - Chromecast - Black',
  brand: 'Google',
  price: 35,
  image: 'https://cdn-demo.algolia.com/bestbuy-0118/4397400_sb.jpg',
  rating: 4,
};

describe('ProductCard', () => {
  it('names the product with a heading', () => {
    render(<ProductCard product={baseProduct} />);
    expect(
      screen.getByRole('heading', { name: 'Google - Chromecast - Black' }),
    ).toBeInTheDocument();
  });

  it("links to the product's PDP by objectID", () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/product/4397400',
    );
  });

  it('shows the brand and a currency-formatted price', () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('$35.00')).toBeInTheDocument();
  });

  it('gives the image the product name as its alt text', () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Google - Chromecast - Black',
    );
  });

  it('renders without a brand or price when the record omits them', () => {
    const sparse: ProductHit = {
      objectID: '1',
      name: 'Mystery item',
    };
    render(<ProductCard product={sparse} />);
    expect(
      screen.getByRole('heading', { name: 'Mystery item' }),
    ).toBeInTheDocument();
    // No price node should be rendered for a priceless record.
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    // Rendered as an <article> so it nests cleanly inside a <Hits> list item.
    const { container } = render(<ProductCard product={baseProduct} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
