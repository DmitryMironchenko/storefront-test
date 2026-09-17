"use client";

import { Button } from "@heroui/react";
import { useEffect } from "react";

import { BackToProductsLink } from "@/shared/ui";

// Catches a *fetch* failure on the PDP — anything `getProduct` rethrows that is
// not a 404 (network drop, 5xx, index outage). A missing record is handled by
// `notFound()` / not-found.tsx instead, so this boundary means "couldn't load",
// not "doesn't exist". Error boundaries must be Client Components; note the
// forked Next passes a `retry` prop (not upstream's `reset`).
export default function ProductError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Something went wrong
      </h1>
      <p className="max-w-prose text-muted">
        We couldn&apos;t load this product right now. Please try again in a
        moment.
      </p>
      <div className="mt-2 flex items-center gap-4">
        <Button variant="primary" onPress={() => retry()}>
          Try again
        </Button>
        <BackToProductsLink />
      </div>
    </main>
  );
}
