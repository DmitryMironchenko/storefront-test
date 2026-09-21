// URL <-> search-state mapping for the PLP.
//
// This is the seam that makes filtered PLP links shareable and refresh-safe
// (issue #3 acceptance). It is a pair of pure functions so it can be unit-tested
// without mounting InstantSearch; the widget only wires them into
// `<InstantSearchNext routing>`.
//
// Design: keep the URL flat and human-legible (`?q=&category=&brand=&sort=&page=`)
// instead of InstantSearch's default nested `instant_search[refinementList]...`.
// Route values come back from the history router as strings / string[] (qs.parse),
// so `routeToState` coerces defensively.
//
// ┌─ ADDING A FILTER — READ THIS ────────────────────────────────────────────┐
// │ This mapping is a WHITELIST: any search state it does not explicitly map  │
// │ is silently dropped from the URL — not shareable, not restored on         │
// │ refresh. So when you add a facet widget to <FilterPanel> you MUST also:   │
// │   1. add its param to `PlpRouteState`;                                    │
// │   2. read it from `uiState` in `stateToRoute` (omit when empty/default);  │
// │   3. write it back into `uiState` in `routeToState` (coerce URL strings); │
// │   4. add a case to the round-trip test in `routing.test.ts`.              │
// │ The round-trip invariant is `ui === routeToState(stateToRoute(ui))`.      │
// └──────────────────────────────────────────────────────────────────────────┘
import type { StateMapping, UiState } from 'instantsearch.js';

import { algoliaConfig } from '@/shared/api/algolia/config';

/** The base (relevance) index; price sorts are its replicas. */
export const PLP_INDEX_NAME = algoliaConfig.indexName;

/** Top level of `hierarchicalCategories` — the primary browse facet (CONTEXT.md). */
const CATEGORY_ATTRIBUTE = 'hierarchicalCategories.lvl0';
const BRAND_ATTRIBUTE = 'brand';
/** Numeric attribute the price-range filter refines (CONTEXT.md: price Facet). */
const PRICE_ATTRIBUTE = 'price';

export type SortItem = { value: string; label: string };

/**
 * Sort options for the `<SortBy>` widget. `value` is the Algolia index/replica
 * name; relevance is the base index and stays first (its default).
 */
export const SORT_ITEMS: SortItem[] = [
  { value: PLP_INDEX_NAME, label: 'Relevance' },
  { value: `${PLP_INDEX_NAME}_price_asc`, label: 'Price: low to high' },
  { value: `${PLP_INDEX_NAME}_price_desc`, label: 'Price: high to low' },
];

// Short URL tokens for the sort replicas — the raw replica index names would
// leak Algolia internals into shareable links. Relevance (the base index) has no
// token: it is the default, so it is simply absent from the URL.
const SORT_VALUE_TO_TOKEN: Record<string, string> = {
  [`${PLP_INDEX_NAME}_price_asc`]: 'price_asc',
  [`${PLP_INDEX_NAME}_price_desc`]: 'price_desc',
};
const SORT_TOKEN_TO_VALUE: Record<string, string> = {
  price_asc: `${PLP_INDEX_NAME}_price_asc`,
  price_desc: `${PLP_INDEX_NAME}_price_desc`,
};

/** The flat, shareable shape persisted in the query string. */
export type PlpRouteState = {
  q?: string;
  category?: string[];
  brand?: string[];
  /** Price range as the widget's native `min:max` token, e.g. `100:500`,
   *  `100:` (min only), `:500` (max only). Absent when unbounded. */
  price?: string;
  sort?: string;
  page?: number;
};

/**
 * A price token is `min:max`, either side optionally empty (`100:`, `:500`),
 * each a plain number. Reject anything else from a hand-edited/garbled link
 * (`abc`, `1:2:3`) so it doesn't reach the range refinement as NaN bounds. `:`
 * alone (no numbers) is not a filter either.
 */
function isPriceToken(value: string): boolean {
  return /^\d*\.?\d*:\d*\.?\d*$/.test(value) && /\d/.test(value);
}

/** A refinement value may arrive as a bare string (`?brand=x`) — normalize it. */
function toArray(value: string[] | string | undefined): string[] | undefined {
  if (value == null) return undefined;
  const arr = Array.isArray(value) ? value : [value];
  return arr.length ? arr : undefined;
}

function stateToRoute(uiState: UiState): PlpRouteState {
  const state = uiState[PLP_INDEX_NAME] ?? {};
  const route: PlpRouteState = {};

  if (state.query) route.q = state.query;

  const category = state.hierarchicalMenu?.[CATEGORY_ATTRIBUTE];
  if (category?.length) route.category = category;

  const brand = state.refinementList?.[BRAND_ATTRIBUTE];
  if (brand?.length) route.brand = brand;

  // A bare `:` (both bounds cleared) is not a real filter — omit it so a
  // pristine PLP keeps an empty URL.
  const price = state.range?.[PRICE_ATTRIBUTE];
  if (price && price !== ':') route.price = price;

  if (state.sortBy && SORT_VALUE_TO_TOKEN[state.sortBy]) {
    route.sort = SORT_VALUE_TO_TOKEN[state.sortBy];
  }

  if (state.page) route.page = state.page;

  return route;
}

function routeToState(routeState: PlpRouteState): UiState {
  const indexUiState: UiState[string] = {};

  if (routeState.q) indexUiState.query = routeState.q;

  const category = toArray(routeState.category);
  if (category) {
    indexUiState.hierarchicalMenu = { [CATEGORY_ATTRIBUTE]: category };
  }

  const brand = toArray(routeState.brand);
  if (brand) {
    indexUiState.refinementList = { [BRAND_ATTRIBUTE]: brand };
  }

  if (routeState.price && isPriceToken(routeState.price)) {
    indexUiState.range = { [PRICE_ATTRIBUTE]: routeState.price };
  }

  if (routeState.sort && SORT_TOKEN_TO_VALUE[routeState.sort]) {
    indexUiState.sortBy = SORT_TOKEN_TO_VALUE[routeState.sort];
  }

  if (routeState.page) indexUiState.page = Number(routeState.page);

  return { [PLP_INDEX_NAME]: indexUiState };
}

export const plpStateMapping: StateMapping<UiState, PlpRouteState> = {
  stateToRoute,
  routeToState,
};
