import { BackToProductsLink } from "@/shared/ui";

// Rendered when the PDP route calls `notFound()` — i.e. no catalogue record has
// that objectID. Next serves this with a 404 status for a direct (non-streamed)
// load, so a shared link to a removed product is correctly a 404.
export default function ProductNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Product not found
      </h1>
      <p className="max-w-prose text-muted">
        We couldn&apos;t find that product. It may have been removed or the link
        may be incorrect.
      </p>
      <BackToProductsLink className="mt-2" />
    </main>
  );
}
