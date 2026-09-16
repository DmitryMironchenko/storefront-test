"use client";

import { Button } from "@heroui/react";
import { liteClient } from "algoliasearch/lite";
import { Hits, SearchBox } from "react-instantsearch";
import { InstantSearchNext } from "react-instantsearch-nextjs";

import type { ProductHit } from "@/types/product";

// Spike note: NEXT_PUBLIC_* must be read via *static* property access so Next
// inlines the value into the client bundle. The dynamic `process.env[name]`
// lookup in src/lib/algolia/config.ts is NOT inlined and would throw in the
// browser — the real (#2) client search client must avoid that indirection.
const searchClient = liteClient(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_API_KEY!,
);

const indexName =
  process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME ?? "instant_search";

function Hit({ hit }: { hit: ProductHit }) {
  return <div className="py-1">{hit.name}</div>;
}

export function SpikeSmoke() {
  return (
    <div className="flex flex-col gap-6">
      {/* HeroUI v3 component — no Provider wrapper (v3 dropped HeroUIProvider). */}
      <Button variant="primary">HeroUI button</Button>

      {/* Hybrid SSR search — first query renders on the server, then hydrates. */}
      <InstantSearchNext
        searchClient={searchClient}
        indexName={indexName}
        routing
        future={{ preserveSharedStateOnUnmount: true }}
      >
        <SearchBox />
        <Hits hitComponent={Hit} />
      </InstantSearchNext>
    </div>
  );
}
