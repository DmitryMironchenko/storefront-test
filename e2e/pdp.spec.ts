import { expect, test, type APIRequestContext } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';

// PDP E2E (ADR 0004, ADR 0013): the async Server Component product page that
// Vitest can't drive. Covers the server-render acceptance (a shared/direct link
// returns the product HTML) plus the page-level axe scan the ticket #8 a11y step
// requires alongside the PLP and basket scans. The objectID isn't hardcoded — a
// real product link is taken from the live PLP so the spec follows the catalogue.

// Resolve a real PDP path from the first product card on the PLP.
async function firstProductPath(request: APIRequestContext): Promise<string> {
  const html = await (await request.get('/')).text();
  const match = html.match(/href="(\/product\/[^"]+)"/);
  if (!match) throw new Error('No product link found on the PLP');
  return match[1];
}

test('server-renders the product into the initial HTML', async ({
  request,
}) => {
  const path = await firstProductPath(request);
  const res = await request.get(path);
  expect(res.ok()).toBeTruthy();

  const html = await res.text();
  // The single page <h1> is present in the raw HTML ⇒ the Algolia fetch ran on
  // the server, not after hydration (the PDP acceptance criterion).
  expect(html).toContain('<h1');
  // The add-to-basket control ships in the server HTML too.
  expect(html.toLowerCase()).toContain('basket');
});

test('the PDP has no a11y violations', async ({ page, request }) => {
  const path = await firstProductPath(request);
  await page.goto(path);

  // Wait for the product heading and the primary CTA before scanning.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /add to basket/i }),
  ).toBeVisible();

  await expectNoA11yViolations(page);
});
