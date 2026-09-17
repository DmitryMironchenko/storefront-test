import Link from "next/link";

import { BasketTrigger } from "@/widgets/basket";

// Global site header: the brand/home link and the basket entry point. A Server
// Component shell — only the interactive <BasketTrigger> leaf is a Client
// Component (it reads the persisted basket and opens the drawer). Rendered once
// in the root layout so the basket is reachable from every route.
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Breitling Store
        </Link>
        <BasketTrigger />
      </div>
    </header>
  );
}
