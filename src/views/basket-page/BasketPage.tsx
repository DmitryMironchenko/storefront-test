import { BackToProductsLink } from "@/shared/ui";
import { BasketContents } from "@/widgets/basket";
import { ClearBasketButton } from "./ClearBasketButton";

// The Basket view (FSD "page"): the core, URL-addressable basket surface
// (ADR 0003) — refresh-safe and independent of the drawer quick-view. A Server
// Component shell; the interactive basket body (<BasketContents>) hydrates and
// reads the persisted store.
export function BasketPage() {
  const headingId = "basket-heading";

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <nav className="mb-8">
        <BackToProductsLink />
      </nav>

      <header className="mb-6 flex items-end justify-between gap-4">
        <h1
          id={headingId}
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          Your basket
        </h1>
        <ClearBasketButton />
      </header>

      <BasketContents
        aria-labelledby={headingId}
        emptyLabel="Your basket is empty. Browse the catalogue to add products."
      />
    </main>
  );
}
