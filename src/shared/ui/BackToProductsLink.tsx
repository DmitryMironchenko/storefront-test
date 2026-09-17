import Link from 'next/link';

// The "← Back to products" link back to the PLP. Extracted because the PDP,
// its not-found page, and its error boundary all need the identical accent-link
// recipe; one component keeps the styling and destination in a single place.
// Presentational and hook-free, so it renders in both server and client
// segments (the error boundary is a Client Component).
export function BackToProductsLink({ className }: { className?: string }) {
  return (
    <Link
      href='/'
      className={`inline-flex items-center gap-1 text-sm text-accent-text underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent${
        className ? ` ${className}` : ''
      }`}
    >
      <span aria-hidden='true'>←</span> Back to products
    </Link>
  );
}
