import { describe, expect, it } from 'vitest';

import { algoliaConfig } from '@/shared/api/algolia/config';

import { PLP_INDEX_NAME, SORT_ITEMS, plpStateMapping } from './routing';

const INDEX = algoliaConfig.indexName;
const { stateToRoute, routeToState } = plpStateMapping;

describe('plp routing / stateMapping', () => {
  it('exposes the base index as the PLP index name', () => {
    expect(PLP_INDEX_NAME).toBe(INDEX);
  });

  it('lists relevance first, then the two price replicas', () => {
    expect(SORT_ITEMS.map((s) => s.value)).toEqual([
      INDEX,
      `${INDEX}_price_asc`,
      `${INDEX}_price_desc`,
    ]);
  });

  it('maps a fully-populated UI state to clean, flat route params', () => {
    const route = stateToRoute({
      [INDEX]: {
        query: 'watch',
        hierarchicalMenu: { 'hierarchicalCategories.lvl0': ['Audio'] },
        refinementList: { brand: ['Apple', 'Sony'] },
        range: { price: '100:500' },
        sortBy: `${INDEX}_price_asc`,
        page: 3,
      },
    });

    expect(route).toEqual({
      q: 'watch',
      category: ['Audio'],
      brand: ['Apple', 'Sony'],
      price: '100:500', // widget's native `min:max` token
      sort: 'price_asc', // short token, not the raw replica index name
      page: 3,
    });
  });

  it('omits empty/default facets so a pristine PLP has an empty URL', () => {
    expect(
      stateToRoute({
        [INDEX]: {
          query: '',
          refinementList: { brand: [] },
          hierarchicalMenu: { 'hierarchicalCategories.lvl0': [] },
          sortBy: INDEX, // relevance is the default → no `sort` param
        },
      }),
    ).toEqual({});

    expect(stateToRoute({})).toEqual({});
  });

  it('round-trips any UI state through the route and back', () => {
    const uiState = {
      [INDEX]: {
        query: 'camera',
        hierarchicalMenu: { 'hierarchicalCategories.lvl0': ['Cameras'] },
        refinementList: { brand: ['Canon'] },
        range: { price: '250:750' },
        sortBy: `${INDEX}_price_desc`,
        page: 2,
      },
    };

    expect(routeToState(stateToRoute(uiState))).toEqual(uiState);
  });

  it('round-trips an open-ended price range (only a min, or only a max)', () => {
    for (const price of ['100:', ':500']) {
      const uiState = { [INDEX]: { range: { price } } };
      expect(routeToState(stateToRoute(uiState))).toEqual(uiState);
    }
  });

  it('omits an empty (unbounded) price range from the URL', () => {
    // Both bounds cleared → InstantSearch emits ":"; that is not a filter, so it
    // must not leak into the URL (a pristine PLP stays empty).
    expect(stateToRoute({ [INDEX]: { range: { price: ':' } } })).toEqual({});
  });

  it('restores a price range from a shared link', () => {
    const ui = routeToState({ price: '100:500' });
    expect(ui[INDEX].range).toEqual({ price: '100:500' });
  });

  it('drops a garbled price token from a hand-edited link', () => {
    // Only a `min:max` shape reaches the refinement; anything else (no colon,
    // extra colons, non-numeric) would become NaN bounds, so ignore it.
    for (const price of ['abc', '1:2:3', ':', 'NaN:10', '10-20']) {
      expect(routeToState({ price })[INDEX].range).toBeUndefined();
    }
  });

  it('restores a shared link and coerces the string page from the URL', () => {
    // The history router hands route values back as strings / string[] (qs.parse).
    const ui = routeToState({
      brand: ['Apple'],
      page: '2' as unknown as number,
    });

    expect(ui[INDEX].refinementList).toEqual({ brand: ['Apple'] });
    expect(ui[INDEX].page).toBe(2);
    expect(ui[INDEX].sortBy).toBeUndefined();
  });

  it('normalizes a single facet value delivered without an array index', () => {
    // `?brand=Apple` (no `[0]`) parses to a bare string; restore it as an array.
    const ui = routeToState({ brand: 'Apple' as unknown as string[] });
    expect(ui[INDEX].refinementList).toEqual({ brand: ['Apple'] });
  });

  it('ignores an unknown sort token instead of forwarding a bad index', () => {
    const ui = routeToState({ sort: 'bogus' });
    expect(ui[INDEX].sortBy).toBeUndefined();
  });
});
