'use client';

import { Pagination, usePagination } from 'react-instantsearch';

// Numbered pagination, wrapped in a labelled navigation landmark (the widget
// itself renders a bare list). Hidden when there is nothing to page through.
//
// `nbPages` is read from the pagination *connector*, not `useInstantSearch().results`:
// the connector participates in InstantSearch's SSR state so server and client
// agree, whereas `results` is not populated during the server render and reading
// it here produces a hydration mismatch (the server omits the <nav>, the client
// adds it). The extra connector alongside <Pagination> is the accepted cost.
export function PlpPagination() {
  const { nbPages } = usePagination();
  if (nbPages <= 1) return null;

  return (
    <nav aria-label='Pagination' className='mt-8 flex justify-center'>
      <Pagination
        padding={2}
        classNames={{
          list: 'flex flex-wrap items-center gap-1',
          item: '',
          link: 'flex min-w-9 items-center justify-center rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent',
          // Border + weight (not a filled accent) marks the current page, so the
          // page number keeps foreground-on-background AA contrast.
          selectedItem:
            '[&_a]:border-accent [&_a]:font-semibold [&_a]:text-accent-text',
          disabledItem: 'opacity-40 [&_a]:pointer-events-none',
        }}
      />
    </nav>
  );
}
