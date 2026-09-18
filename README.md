# Breitling Frontend Engineer Technical Exercise

Starter repository for the Breitling frontend technical test. Setup is done so you can focus on product listing, product detail, basket, analytics, and checkout.

**Live demo:** https://storefront-test-peach-iota.vercel.app

The full brief is in [`docs/Breitling Frontend Engineer Technical Task.docx`](docs/Breitling%20Frontend%20Engineer%20Technical%20Task.docx).

## Requirements (summary)

Using the Algolia credentials below, create a Next.js storefront which:

- Displays one or more PLPs, listing the available products. PLPs should have filters for selectable attributes.
- PLP links with filters applied must be shareable with others.
- Displays PDPs for each product, showing relevant product details.
- Allows users to add products to a persistent basket, maintained in the browser between sessions.
- Tracks common user events (viewing a product, adding to cart, etc.) with a sensible analytics payload. Console logging is fine.
- Submits checkout to a mock endpoint when the user attempts a purchase, with a sensible payload.
- Is accessible and works with a screen reader.

You may use any tools you wish, including AI. Make defensible decisions and fully understand any generated code. Functionality matters more than visual polish.

Submit via a public Git repository (GitHub or similar).

## Getting started

```bash
npm install
cp .env.example .env.local   # already populated with the exercise credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page verifies the Algolia connection.

## What's included

| Item | Location |
| --- | --- |
| Next.js 16 (App Router, TypeScript, Tailwind) | project root |
| Algolia env vars | `.env.local` / `.env.example` |
| Search client | `src/shared/api/algolia/` |
| Product types (demo index shape) | `src/entities/product/model/product.ts` |
| Mock checkout API | `POST /api/checkout` → `src/app/api/checkout/route.ts` |
| InstantSearch | `react-instantsearch` (pre-installed) |

## Algolia credentials

These are search-only keys for Algolia's public demo index:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_ALGOLIA_APP_ID` | `latency` |
| `NEXT_PUBLIC_ALGOLIA_API_KEY` | `af044fb0788d6bb15f807e4420592bc5` |
| `NEXT_PUBLIC_ALGOLIA_INDEX_NAME` | `instant_search` |

Example product fields: `name`, `description`, `brand`, `categories`, `hierarchicalCategories`, `price`, `image`, `rating`, `objectID`.

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # production server
npm run lint     # ESLint
```
