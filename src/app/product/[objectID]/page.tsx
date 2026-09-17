import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

// Imported from the api path directly, not the entity barrel: `getProduct` is
// `server-only`, and the barrel is also imported by client components (e.g.
// ProductCard), so re-exporting it there would poison the client bundle.
import { getProduct } from '@/entities/product/api/getProduct';
import { PdpPage } from '@/views/pdp-page';

// `/product/[objectID]` — the PDP route (a thin server shell over the view,
// ADR 0003). Async Server Component: it fetches the Product on the server so a
// direct load or shared link returns the product HTML server-side (acceptance),
// and a missing record renders the 404 UI via `notFound()`.

type PdpRouteProps = {
  params: Promise<{ objectID: string }>;
};

// Request-scoped memo so `generateMetadata` and the page share a single Algolia
// fetch instead of querying the same record twice per request.
const loadProduct = cache(getProduct);

export async function generateMetadata({
  params,
}: PdpRouteProps): Promise<Metadata> {
  const { objectID } = await params;
  const product = await loadProduct(objectID);
  if (!product) return { title: 'Product not found' };
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function Page({ params }: PdpRouteProps) {
  const { objectID } = await params;
  const product = await loadProduct(objectID);
  if (!product) notFound();
  return <PdpPage product={product} />;
}
