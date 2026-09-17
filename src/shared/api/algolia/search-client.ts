// Browser-safe Algolia client for the PLP's client-side InstantSearch.
//
// Uses the lightweight `liteClient` (search-only) — the full `algoliasearch`
// client in ./client.ts is `server-only` and must never reach the bundle. This
// module is intentionally NOT re-exported from the slice barrel (which is
// server-only); client components import it directly from this path.
//
// The search key is a public, search-only key, so shipping it to the browser is
// by design (ADR 0002). Config is read via static property access so Next inlines
// the NEXT_PUBLIC_* values into the client bundle (see ./config.ts).
import { liteClient } from "algoliasearch/lite";

import { algoliaConfig, assertAlgoliaConfig } from "./config";

let client: ReturnType<typeof liteClient> | undefined;

// Built lazily (not at module load) so a missing-env `assertAlgoliaConfig()`
// throw surfaces during render — caught by <SearchErrorBoundary> with a clear
// message — rather than crashing the whole client tree on import (see the
// module-throw note in ./config.ts). Memoized: one client per session.
export function getPlpSearchClient(): ReturnType<typeof liteClient> {
  if (!client) {
    assertAlgoliaConfig();
    client = liteClient(algoliaConfig.appId, algoliaConfig.apiKey);
  }
  return client;
}
