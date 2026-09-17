import type { Metadata } from "next";

import { BasketPage } from "@/views/basket-page";

// `/basket` — the core basket surface (ADR 0003), a thin routing shell over the
// view. The basket lives in the browser store, so this route needs no data
// fetching; the client body reads the persisted basket after hydration.
export const metadata: Metadata = {
  title: "Basket",
};

export default function Page() {
  return <BasketPage />;
}
