import Image from 'next/image';

import {
  formatPrice,
  isSupportedProductImage,
  type ProductHit,
} from '@/entities/product';
import { AddToCartButton } from '@/features/add-to-cart';

// Product detail view. Presentational and hook-free, so it server-renders into
// the initial HTML (the acceptance criterion: a direct load / shared link
// returns the product server-side). The `product_viewed` analytics ping is a
// separate client effect composed alongside it, keeping this component pure.
export function Pdp({ product }: { product: ProductHit }) {
  const { name, brand, description, price, image, rating, categories } =
    product;

  return (
    <article className='grid gap-8 md:grid-cols-2 md:gap-12'>
      <div className='relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-surface'>
        {isSupportedProductImage(image) ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes='(max-width: 768px) 100vw, 40vw'
            className='object-contain p-6'
            priority
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

      <div className='flex flex-col gap-4'>
        {brand ? (
          <p className='text-sm font-medium tracking-wide text-muted uppercase'>
            {brand}
          </p>
        ) : null}

        <h1 className='text-2xl font-semibold tracking-tight text-foreground sm:text-3xl'>
          {name}
        </h1>

        {typeof rating === 'number' ? (
          <p className='text-sm text-muted'>
            <span aria-hidden='true'>★ {rating}</span>
            {/* aria-label isn't honoured on a <p>; carry the accessible name in
                visually-hidden text so the rating reaches a screen reader. */}
            <span className='sr-only'>Rated {rating} out of 5</span>
          </p>
        ) : null}

        {typeof price === 'number' ? (
          <p className='text-2xl font-semibold text-foreground'>
            {formatPrice(price)}
          </p>
        ) : null}

        <div className='mt-2'>
          <AddToCartButton product={product} />
        </div>

        {description ? <p className='text-foreground'>{description}</p> : null}

        {categories && categories.length > 0 ? (
          <div className='mt-2'>
            <h2 className='mb-2 text-xs font-medium tracking-wide text-muted uppercase'>
              Categories
            </h2>
            <ul className='flex flex-wrap gap-2'>
              {categories.map((category) => (
                <li
                  key={category}
                  className='rounded-full border border-border bg-surface px-3 py-1 text-xs text-surface-foreground'
                >
                  {category}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  );
}
