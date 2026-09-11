import { algoliasearch } from "algoliasearch";

import { algoliaConfig } from "./config";

export function getSearchClient() {
  return algoliasearch(algoliaConfig.appId, algoliaConfig.apiKey);
}
