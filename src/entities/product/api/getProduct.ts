// Single-record data access for the PDP. Uses Algolia `getObject` (a direct
// record fetch by objectID) rather than a search query — the PDP knows exactly
// which Product it wants. Lives in the entity layer so both the route and any
// future consumer share one typed accessor (ADR 0003).
//
// `server-only`: this pulls the full server Algolia client, so importing it from
// a client component is a build error — the fetch never runs in the browser.
import 'server-only';

import { getSearchClient } from '@/shared/api/algolia/client';
import { algoliaConfig } from '@/shared/api/algolia/config';

import type { ProductHit } from '../model/product';

/**
 * Fetch one Product by its `objectID`.
 *
 * @returns the Product, or `null` when no record has that id (Algolia 404) —
 *   the caller turns `null` into a 404 page. Any other failure (network drop,
 *   5xx, index outage) is rethrown so it surfaces on the route's error boundary
 *   rather than being silently indistinguishable from "not found".
 */
export async function getProduct(objectID: string): Promise<ProductHit | null> {
  const client = getSearchClient();
  try {
    return await client.getObject<ProductHit>({
      indexName: algoliaConfig.indexName,
      objectID,
    });
  } catch (error) {
    if (isRecordNotFound(error)) return null;
    throw error;
  }
}

// Algolia throws an `ApiError` carrying a numeric `status`; a missing record is
// a 404. Structural check (not `instanceof ApiError`) so it holds regardless of
// which client-common copy constructed the error.
function isRecordNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status?: unknown }).status === 404
  );
}
