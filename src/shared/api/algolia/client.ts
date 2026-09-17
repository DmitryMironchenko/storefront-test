// The full `algoliasearch` client is heavier than the browser lite client and
// is only needed server-side (RSC data fetching, the checkout re-price). This
// guard makes importing it from a client component a build error, so it can
// never leak into a client bundle.
import 'server-only';
import { algoliasearch } from 'algoliasearch';

import { algoliaConfig, assertAlgoliaConfig } from './config';

/**
 * Full Algolia client for server-side use. The PLP's client-side InstantSearch
 * uses the lite client, added in the search feature slice.
 */
export function getSearchClient() {
  assertAlgoliaConfig();
  return algoliasearch(algoliaConfig.appId, algoliaConfig.apiKey);
}
