import type { Metadata } from 'next';

import { PlpPage } from '@/views/plp-page';

// `/` is the canonical PLP (ADR 0003) — a thin routing shell over the view.
export const metadata: Metadata = {
  title: 'Products',
};

export default function Page() {
  return <PlpPage />;
}
