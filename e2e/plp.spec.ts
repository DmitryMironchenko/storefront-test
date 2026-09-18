import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';

// PLP E2E (ADR 0004): the async Server Component + hybrid-SSR search that Vitest
// can't drive. Covers the issue #3 acceptance — a shared filtered link renders
// server-side and filters survive a refresh — plus a page-level a11y scan.

test('server-renders products into the initial HTML', async ({ request }) => {
  const res = await request.get('/');
  expect(res.ok()).toBeTruthy();
  const html = await res.text();
  // ProductCard links (`/product/<id>`) present in the raw HTML ⇒ the first
  // Algolia query ran on the server, not after hydration (no skeleton flash).
  expect(html).toContain('href="/product/');
});

test('filters the catalogue and keeps the filter in a shareable, refresh-safe URL', async ({
  page,
  request,
}) => {
  await page.goto('/');

  const status = page.getByRole('status');
  await expect(status).toContainText(/product/);
  const totalCount = await status.textContent();

  // Apply a category filter from the labelled "Category" fieldset.
  const categoryGroup = page.getByRole('group', { name: 'Category' });
  await categoryGroup.getByRole('link', { name: /Appliances/ }).click();

  // The filter lands in the URL (shareable) and narrows the result count.
  await expect(page).toHaveURL(/category/);
  await expect(status).not.toHaveText(totalCount ?? '');
  const sharedUrl = page.url();
  const filteredCount = await status.textContent();

  // The shared link renders the filtered, selected state on the SERVER.
  const res = await request.get(sharedUrl);
  const html = await res.text();
  expect(html).toContain('ais-HierarchicalMenu-item--selected');
  expect(html).toContain('Appliances');

  // Filter survives a full reload.
  await page.goto(sharedUrl);
  await expect(page.getByRole('status')).toHaveText(filteredCount ?? '');
  await expect(
    page
      .getByRole('group', { name: 'Category' })
      .locator('.ais-HierarchicalMenu-item--selected'),
  ).toBeVisible();
});

test('exposes the three named a11y affordances: facet grouping, live region, aria-current', async ({
  page,
}) => {
  // Step 7 (ADR 0013): guard the affordances axe can't fully assert on its own —
  // the fieldset/legend facet grouping, the <Stats> polite live region, and the
  // pagination current-page marker — so a refactor of any of them trips the gate.
  await page.goto('/');

  // fieldset/legend: each facet exposes an accessible group named by its legend.
  await expect(page.getByRole('group', { name: 'Category' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Brand' })).toBeVisible();

  // <SearchStats> is a role="status" (implicit aria-live="polite") live region.
  const status = page.getByRole('status');
  await expect(status).toContainText(/product/);

  // Pagination is a labelled landmark whose current page carries aria-current.
  // Relies on the base catalogue spanning more than one page (PlpPagination
  // renders nothing for a single page) — the same live-dataset assumption the
  // filter/count tests above already make.
  const pagination = page.getByRole('navigation', { name: 'Pagination' });
  await expect(pagination).toBeVisible();
  await expect(pagination.locator('[aria-current="page"]')).toHaveCount(1);
});

test('the PLP has no a11y violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
  // Wait for the first product to render before scanning.
  await expect(page.locator('a[href^="/product/"]').first()).toBeVisible();

  await expectNoA11yViolations(page);
});
