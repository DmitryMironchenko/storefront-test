// Public API of the shared Algolia slice.
//
// NOTE: `getSearchClient` (and therefore this barrel) is server-only — it pulls
// in `server-only` and the full client. Client components must import the
// config directly from "@/shared/api/algolia/config", not from this barrel.
export { getSearchClient } from './client';
export { algoliaConfig, assertAlgoliaConfig } from './config';
