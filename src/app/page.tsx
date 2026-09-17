import { algoliaConfig, getSearchClient } from "@/shared/api/algolia";

export default async function Home() {
  // Connection check for the starter page. A failed request (bad key, network,
  // outage) leaves productCount undefined so the copy below can show the
  // "connection check failed" message instead of throwing the whole page.
  let productCount: number | undefined;
  try {
    const client = getSearchClient();
    const { results } = await client.search({
      requests: [{ indexName: algoliaConfig.indexName, hitsPerPage: 0 }],
    });
    const result = results[0];
    productCount = result && "nbHits" in result ? result.nbHits : undefined;
  } catch {
    productCount = undefined;
  }

  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-foreground">
          Breitling technical exercise
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Storefront starter
        </h1>
        <p className="text-lg leading-8 text-foreground">
          Next.js, Tailwind, and Algolia are configured. Build the PLP, PDP,
          basket, analytics, and checkout flows described in{" "}
          <code className="rounded bg-surface px-1.5 py-0.5 text-sm text-surface-foreground">
            docs/Breitling Frontend Engineer Technical Task.docx
          </code>
          .
        </p>
      </header>

      <section
        aria-labelledby="setup-heading"
        className="rounded-xl border border-border bg-surface p-6 text-surface-foreground"
      >
        <h2 id="setup-heading" className="text-lg font-medium text-foreground">
          Pre-configured for you
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted">
          <li>Algolia search client in `src/shared/api/algolia/`</li>
          <li>
            Product types in `src/entities/product/` (based on the demo index)
          </li>
          <li>
            Mock checkout endpoint at{" "}
            <code className="rounded bg-background px-1.5 py-0.5 text-sm text-foreground">
              POST /api/checkout
            </code>
          </li>
          <li>`react-instantsearch` installed for PLP filtering</li>
        </ul>
        <p className="mt-4 text-sm text-muted">
          Algolia index{" "}
          <strong className="font-medium text-foreground">
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
