'use client';

import { Button } from '@heroui/react';
import {
  ClearRefinements,
  useHits,
  useInstantSearch,
} from 'react-instantsearch';

import { ProductCard, type ProductHit } from '@/entities/product';

// Results region: renders the product grid, or an inline error (a failed Algolia
// query — the realistic failure, surfaced through InstantSearch's own status),
// or an empty state with a reset. Uncaught render exceptions are handled one
// level up by <SearchErrorBoundary>.
export function PlpResults() {
  const { status, error, refresh } = useInstantSearch();
  const { items } = useHits<ProductHit>();

  if (status === 'error') {
    return (
      <div
        role='alert'
        className='rounded-xl border border-border bg-surface p-6 text-surface-foreground'
      >
        <h2 className='text-base font-semibold text-foreground'>
          Couldn’t load products
        </h2>
        <p className='mt-1 text-sm text-muted'>
          {error?.message ?? 'The search request failed.'}
        </p>
        <Button className='mt-4' variant='primary' onPress={() => refresh()}>
          Try again
        </Button>
      </div>
    );
  }

  // Only a *settled* zero-result search is "empty". While loading/stalled with no
  // retained hits (e.g. a client navigation before results arrive), fall through
  // and render the — briefly empty — grid rather than flashing "no products".
  if (items.length === 0 && status !== 'loading' && status !== 'stalled') {
    return (
      <div className='rounded-xl border border-border bg-surface p-10 text-center text-surface-foreground'>
        <p className='text-base font-medium text-foreground'>
          No products match your filters
        </p>
        <p className='mt-1 text-sm text-muted'>
          Try removing a filter to see more.
        </p>
        <div className='mt-4 flex justify-center'>
          <ClearRefinements
            translations={{ resetButtonText: 'Clear filters' }}
            classNames={{
              button:
                'rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-accent disabled:cursor-not-allowed disabled:text-muted',
              disabledButton: 'opacity-60',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <ol className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
      {items.map((hit) => (
        <li key={hit.objectID}>
          <ProductCard product={hit} />
        </li>
      ))}
    </ol>
  );
}
