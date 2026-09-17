import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SearchErrorBoundary } from './SearchErrorBoundary';

function Boom(): never {
  throw new Error('search crashed');
}

describe('SearchErrorBoundary', () => {
  beforeEach(() => {
    // React logs caught render errors to console.error; silence it for the test.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders its children when nothing throws', () => {
    render(
      <SearchErrorBoundary>
        <p>Results</p>
      </SearchErrorBoundary>,
    );
    expect(screen.getByText('Results')).toBeInTheDocument();
  });

  it('shows a recoverable fallback when a child throws during render', () => {
    render(
      <SearchErrorBoundary>
        <Boom />
      </SearchErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /try again/i }),
    ).toBeInTheDocument();
  });
});
