// The demo index serves every product image from this one CDN host; it is also
// the only host allow-listed in next.config's `images.remotePatterns` (which
// imports this constant, so the two cannot drift).
export const PRODUCT_IMAGE_HOST = "cdn-demo.algolia.com";

// `next/image` throws at render for a `src` on a non-allow-listed host, and that
// render exception would be caught by <SearchErrorBoundary> — escalating one bad
// image into a whole-PLP error. Gate on the supported host so an unexpected `src`
// degrades to the card's "No image" placeholder instead.
export function isSupportedProductImage(url: string | undefined): url is string {
  if (!url) return false;
  try {
    return new URL(url).host === PRODUCT_IMAGE_HOST;
  } catch {
    return false;
  }
}
