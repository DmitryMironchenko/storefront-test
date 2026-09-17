'use client';

import {
  ClearRefinements,
  HierarchicalMenu,
  RefinementList,
} from 'react-instantsearch';

import { FilterGroup } from './FilterGroup';

// react-instantsearch widgets ship no CSS (BYO). These class maps style them
// with the same Tailwind/HeroUI tokens as the rest of the app (ADR 0003), so
// the two styling worlds stay visually consistent.
const listClass = 'flex flex-col gap-1.5 text-sm';
const countClass =
  'ml-1.5 rounded bg-background px-1.5 py-0.5 text-xs text-muted';
const showMoreClass =
  'mt-2 text-sm font-medium text-accent-text hover:underline disabled:opacity-50';

const refinementListClassNames = {
  list: listClass,
  label: 'flex cursor-pointer items-center gap-2',
  labelText: 'text-foreground',
  count: countClass,
  showMore: showMoreClass,
};

const hierarchicalMenuClassNames = {
  list: listClass,
  childList: 'ml-3 mt-1 flex flex-col gap-1 border-l border-border pl-2',
  link: 'flex items-center text-foreground hover:text-accent-text',
  selectedItemLink: 'font-semibold text-accent-text',
  count: countClass,
  showMore: showMoreClass,
};

// Facets for the single PLP: the primary browse facet is the hierarchical
// category (lvl0 → lvl1), plus a brand list. Each is wrapped in a
// <fieldset>/<legend> for grouping semantics.
//
// ⚠️ Adding a facet here? Also map it in `plpStateMapping` (./routing.ts) — the
// URL mapping is a whitelist, so an unmapped facet won't be shareable or survive
// a refresh. See the "ADDING A FILTER" checklist at the top of ./routing.ts.
export function FilterPanel() {
  return (
    <div className='flex flex-col gap-5'>
      <div className='flex items-center justify-between'>
        <h2 className='text-base font-semibold text-foreground'>Filters</h2>
        <ClearRefinements
          translations={{ resetButtonText: 'Clear all' }}
          classNames={{
            button:
              'text-sm font-medium text-accent-text hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline',
            disabledButton: 'opacity-60',
          }}
        />
      </div>

      <FilterGroup legend='Category'>
        <HierarchicalMenu
          attributes={[
            'hierarchicalCategories.lvl0',
            'hierarchicalCategories.lvl1',
          ]}
          limit={8}
          showMore
          classNames={hierarchicalMenuClassNames}
        />
      </FilterGroup>

      <FilterGroup legend='Brand'>
        {/* A plain filter list, not `searchable`: a nested search box would add a
            second `role="search"` landmark competing with the site search.
            `showMore` still reveals the long tail of brands. */}
        <RefinementList
          attribute='brand'
          limit={8}
          showMore
          showMoreLimit={20}
          classNames={refinementListClassNames}
        />
      </FilterGroup>
    </div>
  );
}
