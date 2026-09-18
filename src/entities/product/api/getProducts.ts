// Batched multi-record data access. Where getProduct fetches one record for the
// PDP, getProducts fetches many in a single Algolia `getObjects` call — the
// checkout re-price needs every basket line's current record and must not fan
// out one request per line (ADR 0001: "getObjects, one batched call"). Lives in
// the entity layer beside getProduct so catalogue access has one typed home.
//
// `server-only`: pulls the full server Algolia client, so importing it from a
// client component is a build error.
import 'server-only';

import { getSearchClient } from '@/shared/api/algolia/client';
import { algoliaConfig } from '@/shared/api/algolia/config';

import type { ProductHit } from '../model/product';

/**
 * Fetch many Products by `objectID` in one batched request.
 *
 * @returns a Map from `objectID` to record, containing only ids that resolved to
 *   a record. Ids Algolia has no record for are simply absent (it returns `null`
 *   in their slot), so the caller distinguishes "priced" from "not found" by map
 *   membership. Duplicate ids are collapsed to a single request. Failures (5xx,
 *   network, outage) are rethrown so they surface on the caller rather than
 *   masquerading as an empty basket.
 */
export async function getProducts(
  objectIDs: string[],
): Promise<Map<string, ProductHit>> {
  const uniqueIds = [...new Set(objectIDs)];
  if (uniqueIds.length === 0) return new Map();

  const client = getSearchClient();
  const { results } = await client.getObjects<ProductHit>({
    requests: uniqueIds.map((objectID) => ({
      indexName: algoliaConfig.indexName,
      objectID,
    })),
  });

  const byId = new Map<string, ProductHit>();
  for (const record of results) {
    if (record) byId.set(record.objectID, record);
  }
  return byId;
}
