import { describe, expect, it } from "vitest";

import { algoliaConfig } from "@/shared/api/algolia/config";

import {
  PLP_INDEX_NAME,
  SORT_ITEMS,
  plpStateMapping,
} from "./routing";

const INDEX = algoliaConfig.indexName;
const { stateToRoute, routeToState } = plpStateMapping;

describe("plp routing / stateMapping", () => {
  it("exposes the base index as the PLP index name", () => {
    expect(PLP_INDEX_NAME).toBe(INDEX);
  });

  it("lists relevance first, then the two price replicas", () => {
    expect(SORT_ITEMS.map((s) => s.value)).toEqual([
      INDEX,
      `${INDEX}_price_asc`,
      `${INDEX}_price_desc`,
    ]);
  });

  it("maps a fully-populated UI state to clean, flat route params", () => {
    const route = stateToRoute({
      [INDEX]: {
        query: "watch",
        hierarchicalMenu: { "hierarchicalCategories.lvl0": ["Audio"] },
        refinementList: { brand: ["Apple", "Sony"] },
        sortBy: `${INDEX}_price_asc`,
        page: 3,
      },
    });

    expect(route).toEqual({
      q: "watch",
      category: ["Audio"],
      brand: ["Apple", "Sony"],
      sort: "price_asc", // short token, not the raw replica index name
      page: 3,
    });
  });

  it("omits empty/default facets so a pristine PLP has an empty URL", () => {
    expect(
      stateToRoute({
        [INDEX]: {
          query: "",
          refinementList: { brand: [] },
          hierarchicalMenu: { "hierarchicalCategories.lvl0": [] },
          sortBy: INDEX, // relevance is the default → no `sort` param
        },
      }),
    ).toEqual({});

    expect(stateToRoute({})).toEqual({});
  });

  it("round-trips any UI state through the route and back", () => {
    const uiState = {
      [INDEX]: {
        query: "camera",
        hierarchicalMenu: { "hierarchicalCategories.lvl0": ["Cameras"] },
        refinementList: { brand: ["Canon"] },
        sortBy: `${INDEX}_price_desc`,
        page: 2,
      },
    };

    expect(routeToState(stateToRoute(uiState))).toEqual(uiState);
  });

  it("restores a shared link and coerces the string page from the URL", () => {
    // The history router hands route values back as strings / string[] (qs.parse).
    const ui = routeToState({
      brand: ["Apple"],
      page: "2" as unknown as number,
    });

    expect(ui[INDEX].refinementList).toEqual({ brand: ["Apple"] });
    expect(ui[INDEX].page).toBe(2);
    expect(ui[INDEX].sortBy).toBeUndefined();
  });

  it("normalizes a single facet value delivered without an array index", () => {
    // `?brand=Apple` (no `[0]`) parses to a bare string; restore it as an array.
    const ui = routeToState({ brand: "Apple" as unknown as string[] });
    expect(ui[INDEX].refinementList).toEqual({ brand: ["Apple"] });
  });

  it("ignores an unknown sort token instead of forwarding a bad index", () => {
    const ui = routeToState({ sort: "bogus" });
    expect(ui[INDEX].sortBy).toBeUndefined();
  });
});
