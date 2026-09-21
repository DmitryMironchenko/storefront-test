import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PriceRange } from './PriceRange';

// Drive the component through a mocked `useRange` connector so the a11y contract
// and the submit → refine wiring can be unit-tested without mounting a live
// InstantSearch tree.
const refine = vi.fn();
const useRange = vi.fn();

vi.mock('react-instantsearch', () => ({
  useRange: (...args: unknown[]) => useRange(...args),
}));

const RANGE_STATE = {
  start: [undefined, undefined] as [number | undefined, number | undefined],
  range: { min: 0, max: 1000 },
  canRefine: true,
  refine,
};

beforeEach(() => {
  refine.mockClear();
  useRange.mockReturnValue(RANGE_STATE);
});

describe('PriceRange', () => {
  it('refines the price attribute', () => {
    render(<PriceRange />);
    expect(useRange).toHaveBeenCalledWith({ attribute: 'price' });
  });

  it('labels both inputs so each has an accessible name', () => {
    render(<PriceRange />);
    expect(screen.getByLabelText(/min/i)).toHaveAttribute('type', 'number');
    expect(screen.getByLabelText(/max/i)).toHaveAttribute('type', 'number');
  });

  it('has no axe violations', async () => {
    const { container } = render(<PriceRange />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('submits the typed bounds as numbers', async () => {
    const user = userEvent.setup();
    render(<PriceRange />);

    await user.type(screen.getByLabelText(/min/i), '100');
    await user.type(screen.getByLabelText(/max/i), '500');
    await user.click(screen.getByRole('button', { name: /apply/i }));

    expect(refine).toHaveBeenCalledWith([100, 500]);
  });

  it('sends an open-ended bound as undefined when a field is left blank', async () => {
    const user = userEvent.setup();
    render(<PriceRange />);

    await user.type(screen.getByLabelText(/min/i), '100');
    await user.click(screen.getByRole('button', { name: /apply/i }));

    expect(refine).toHaveBeenCalledWith([100, undefined]);
  });

  it('constrains each input to the facet range via native min/max attributes', () => {
    // Out-of-range bounds are blocked at the input (constraint validation), not
    // in JS — an over-generous Max shows an inline message instead of silently
    // dropping a valid Min (which is what connectRange would do).
    render(<PriceRange />);
    for (const field of [/min/i, /max/i]) {
      const input = screen.getByLabelText(field);
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '1000');
    }
  });

  it('swaps an inverted range so it cannot produce an always-empty result set', async () => {
    const user = userEvent.setup();
    render(<PriceRange />);

    await user.type(screen.getByLabelText(/min/i), '500');
    await user.type(screen.getByLabelText(/max/i), '100');
    await user.click(screen.getByRole('button', { name: /apply/i }));

    expect(refine).toHaveBeenCalledWith([100, 500]);
  });

  it('reflects a restored refinement in the fields', () => {
    useRange.mockReturnValue({
      ...RANGE_STATE,
      start: [100, 500],
    });
    render(<PriceRange />);

    expect(screen.getByLabelText(/min/i)).toHaveValue(100);
    expect(screen.getByLabelText(/max/i)).toHaveValue(500);
  });

  it('shows an empty field for an unbounded side (facet edge, not a filter)', () => {
    // `start` echoes the facet's own min/max when that side carries no real
    // filter — that must render as an empty field, not a pre-filled bound.
    useRange.mockReturnValue({
      ...RANGE_STATE,
      start: [0, 1000],
    });
    render(<PriceRange />);

    expect(screen.getByLabelText(/min/i)).toHaveValue(null);
    expect(screen.getByLabelText(/max/i)).toHaveValue(null);
  });

  it('disables the control when the facet cannot be refined', () => {
    useRange.mockReturnValue({ ...RANGE_STATE, canRefine: false });
    render(<PriceRange />);

    expect(screen.getByLabelText(/min/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /apply/i })).toBeDisabled();
  });
});
