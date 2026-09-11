import { getSearchClient } from "@/lib/algolia/client";
import { algoliaConfig } from "@/lib/algolia/config";

export default async function Home() {
  const client = getSearchClient();
  const { results } = await client.search({
    requests: [{ indexName: algoliaConfig.indexName, hitsPerPage: 0 }],
  });
  const result = results[0];
  const productCount =
    result && "nbHits" in result ? result.nbHits : undefined;

  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Breitling technical exercise
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          Storefront starter
        </h1>
        <p className="text-lg leading-8 text-zinc-600">
          Next.js, Tailwind, and Algolia are configured. Build the PLP, PDP,
          basket, analytics, and checkout flows described in{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm">
            docs/Breitling Frontend Engineer Technical Task.docx
          </code>
          .
        </p>
      </header>

      <section
        aria-labelledby="setup-heading"
        className="rounded-xl border border-zinc-200 bg-zinc-50 p-6"
      >
        <h2 id="setup-heading" className="text-lg font-medium text-zinc-950">
          Pre-configured for you
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-zinc-700">
          <li>Algolia search client in `src/lib/algolia/`</li>
          <li>
            Product types in `src/types/product.ts` (based on the demo index)
          </li>
          <li>
            Mock checkout endpoint at{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-sm">
              POST /api/checkout
            </code>
          </li>
          <li>`react-instantsearch` installed for PLP filtering</li>
        </ul>
        <p className="mt-4 text-sm text-zinc-600">
          Algolia index{" "}
          <strong className="font-medium text-zinc-800">
            {algoliaConfig.indexName}
          </strong>
          {typeof productCount === "number"
            ? ` — ${productCount.toLocaleString()} products available.`
            : " — connection check failed. Verify `.env.local`."}
        </p>
      </section>
    </main>
  );
}
