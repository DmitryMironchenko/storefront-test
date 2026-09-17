import Image from 'next/image';
import Link from 'next/link';

import { formatPrice } from '../lib/format';
import { isSupportedProductImage } from '../lib/image';
import type { ProductHit } from '../model/product';
import { productHref } from '../model/routes';

// Presentational product card. No hooks or handlers, so it is a *shared*
// component: the PLP renders it inside the client `<Hits>` list, and the PDP
// step can reuse it server-side. Root is an <article> so it nests cleanly inside
// a `ais-Hits-item` <li>.
export function ProductCard({ product }: { product: ProductHit }) {
  const { objectID, name, brand, price, image, rating } = product;

  return (
    <article className='h-full'>
      <Link
        href={productHref(objectID)}
        className='flex h-full flex-col gap-3 rounded-xl border border-border bg-surface p-4 text-surface-foreground transition-colors hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
      >
        <div className='relative aspect-square w-full overflow-hidden rounded-lg bg-background'>
          {isSupportedProductImage(image) ? (
            <Image
              src={image}
              alt={name}
              fill
              sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px'
              className='object-contain'
            />
          ) : (
            <div
              aria-hidden='true'
              className='flex h-full items-center justify-center text-sm text-muted'
            >
              No image
            </div>
          )}
        </div>

        <div className='flex flex-1 flex-col gap-1'>
          {brand ? (
            <p className='text-xs font-medium tracking-wide text-muted uppercase'>
              {brand}
            </p>
          ) : null}
          <h3 className='line-clamp-2 text-sm font-medium text-foreground'>
            {name}
          </h3>
        </div>

        <div className='flex items-center justify-between'>
          {typeof price === 'number' ? (
            <p className='text-base font-semibold text-foreground'>
              {formatPrice(price)}
            </p>
          ) : (
            <span />
          )}
          {typeof rating === 'number' ? (
            <p className='text-xs text-muted'>
              <span aria-hidden='true'>★ {rating}</span>
              {/* aria-label isn't honoured on a <p>; carry the accessible name in
                  visually-hidden text instead so the rating reaches a screen reader. */}
              <span className='sr-only'>Rated {rating} out of 5</span>
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
