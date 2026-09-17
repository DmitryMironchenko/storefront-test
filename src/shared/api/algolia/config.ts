// Algolia connection config.
//
// NEXT_PUBLIC_* values are read via *static* property access on purpose: Next
// only inlines these into the client bundle for static `process.env.FOO` access,
// so a dynamic `process.env[name]` lookup is NOT inlined and throws in the
// browser (ADR 0002). Because the access here is static and this module pulls in
// no heavy client, it is safe to import directly from a client component — e.g.
// the InstantSearch search client (import it from this path, not the slice
// barrel, which also re-exports the server-only full client).
//
// Validation is a *function*, not a module-level throw: an inlined top-level
// throw would crash the entire client React tree on load if the env were missing
// at build time. Callers assert right before they build a client instead.
const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID ?? "";
const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_API_KEY ?? "";
const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME ?? "instant_search";

export const algoliaConfig = {
  appId,
  apiKey,
  indexName,
} as const;

/** Throw if the required credentials are absent. Call before creating a client. */
export function assertAlgoliaConfig(): void {
  if (!algoliaConfig.appId || !algoliaConfig.apiKey) {
    throw new Error(
      "Missing Algolia env vars: set NEXT_PUBLIC_ALGOLIA_APP_ID and " +
        "NEXT_PUBLIC_ALGOLIA_API_KEY in .env.local (see .env.example).",
    );
  }
}
