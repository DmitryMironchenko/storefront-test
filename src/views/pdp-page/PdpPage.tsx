import type { ProductHit } from '@/entities/product';
import { BackToProductsLink } from '@/shared/ui';
import { Pdp, ProductViewedTracker } from '@/widgets/pdp';

// The PDP view (FSD "page"): page chrome around the PDP widget. A Server
// Component — it renders the product into the initial HTML (ADR 0003); only the
// analytics tracker leaf hydrates to fire `product_viewed`.
export function PdpPage({ product }: { product: ProductHit }) {
  return (
    <main className='mx-auto w-full max-w-5xl px-6 py-10'>
      <nav className='mb-8'>
        <BackToProductsLink />
      </nav>

      <Pdp product={product} />
      <ProductViewedTracker product={product} />
    </main>
  );
}
