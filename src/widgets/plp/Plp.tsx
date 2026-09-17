'use client';

import { Configure, SearchBox, SortBy } from 'react-instantsearch';
import { InstantSearchNext } from 'react-instantsearch-nextjs';

import { getPlpSearchClient } from '@/shared/api/algolia/search-client';

import { FilterPanel } from './FilterPanel';
import { PlpPagination } from './PlpPagination';
import { PlpResults } from './PlpResults';
import { SearchErrorBoundary } from './SearchErrorBoundary';
import { SearchStats } from './SearchStats';
import { PLP_INDEX_NAME, SORT_ITEMS, plpStateMapping } from './routing';

const HITS_PER_PAGE = 12;

// The one canonical PLP (ADR 0003). Hybrid SSR via <InstantSearchNext>: the first
// query renders on the server (no skeleton flash, shareable links open with
// results in the HTML), then hydrates (ADR 0002). `routing` + our flat
// stateMapping keep filters/sort/page in the URL and restore them on load.
export function Plp() {
  return (
    <SearchErrorBoundary>
      <InstantSearchNext
        searchClient={getPlpSearchClient()}
        indexName={PLP_INDEX_NAME}
        routing={{ stateMapping: plpStateMapping }}
        future={{ preserveSharedStateOnUnmount: true }}
      >
        <Configure hitsPerPage={HITS_PER_PAGE} />

        <SearchBox
          placeholder='Search products'
          classNames={{
            root: 'mb-6',
            form: 'relative',
            input:
              'w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-foreground placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            submit: 'absolute right-3 top-1/2 -translate-y-1/2 text-muted',
            reset: 'hidden',
            loadingIndicator: 'hidden',
          }}
        />

        <div className='flex flex-col gap-6 lg:flex-row'>
          <aside className='lg:w-64 lg:shrink-0'>
            <FilterPanel />
          </aside>

          <div className='min-w-0 flex-1'>
            <div className='mb-4 flex items-center justify-between gap-4'>
              <SearchStats />
              <label className='flex items-center gap-2 text-sm text-muted'>
                <span>Sort</span>
                <SortBy
                  items={SORT_ITEMS}
                  classNames={{
                    select:
                      'rounded-lg border border-border bg-surface px-3 py-1.5 text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                  }}
                />
              </label>
            </div>

            <PlpResults />

            <PlpPagination />
          </div>
        </div>
      </InstantSearchNext>
    </SearchErrorBoundary>
  );
}
