import { BasketBody } from './BasketBody';

// The Basket view (FSD "page"): the core, URL-addressable basket surface
// (ADR 0003) — refresh-safe and independent of the drawer quick-view. A Server
// Component shell around <BasketBody>, the interactive client body that reads
// the persisted store, drives checkout, and swaps the basket for an order
// confirmation on success.
export function BasketPage() {
  return (
    <main className='mx-auto w-full max-w-3xl px-6 py-10'>
      <BasketBody />
    </main>
  );
}
