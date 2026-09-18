import { expect, test, type Page } from '@playwright/test';

import { expectNoA11yViolations } from './a11y';

// Basket E2E (ADR 0004): the persistence and cross-tab behaviour (issue #5
// acceptance) that jsdom can't prove — a real reload and a real cross-document
// `storage` event. The /basket route is Algolia-free, so these seed the store's
// localStorage key directly instead of driving the (Algolia-backed) PDP add
// flow; the add/remove writes themselves are covered by the Vitest store tests.

const BASKET_STORAGE_KEY = 'breitling-basket';

const chromecast = {
  objectID: '4397400',
  name: 'Google - Chromecast - Black',
  brand: 'Google',
  price: 35,
  quantity: 2,
};

const echo = {
  objectID: '5477500',
  name: 'Amazon - Echo - Charcoal',
  brand: 'Amazon',
  price: 100,
  quantity: 1,
};

// Write the persisted basket in the store's own format, as a prior session or
// another tab would have. Returns a promise resolving after the event loop.
function seedBasket(page: Page, items: unknown[]) {
  return page.evaluate(
    ([key, value]) => window.localStorage.setItem(key, value),
    [
      BASKET_STORAGE_KEY,
      JSON.stringify({ state: { items }, version: 1 }),
    ] as const,
  );
}

test('restores a persisted basket on a fresh load and keeps it across reloads', async ({
  page,
}) => {
  // Land on the empty basket first (a genuine cold load).
  await page.goto('/basket');
  await expect(page.getByText(/your basket is empty/i)).toBeVisible();

  // A prior session's basket now exists in storage; reload = "new session".
  await seedBasket(page, [chromecast, echo]);
  await page.reload();

  await expect(page.getByText('Google - Chromecast - Black')).toBeVisible();
  await expect(page.getByText('Amazon - Echo - Charcoal')).toBeVisible();
  // Subtotal from add-time prices: 2×35 + 1×100 = 170.
  await expect(page.getByText('$170.00')).toBeVisible();

  // Survives a second full reload unchanged (persistence, not a fluke).
  await page.reload();
  await expect(page.getByText('Google - Chromecast - Black')).toBeVisible();
  await expect(page.getByText('$170.00')).toBeVisible();
});

test("reflects another tab's basket update without a reload", async ({
  context,
}) => {
  // Two tabs in one browser context share the origin's localStorage.
  const tabA = await context.newPage();
  const tabB = await context.newPage();
  await tabA.goto('/basket');
  await tabB.goto('/basket');

  await expect(tabB.getByText(/your basket is empty/i)).toBeVisible();

  // Tab A's write dispatches a `storage` event in Tab B, whose listener
  // rehydrates — Tab B updates live, no reload.
  await seedBasket(tabA, [echo]);

  await expect(tabB.getByText('Amazon - Echo - Charcoal')).toBeVisible();
  // The header badge reflects the new count in the receiving tab.
  await expect(
    tabB.getByRole('button', { name: /basket, 1 item/i }),
  ).toBeVisible();

  await tabA.close();
  await tabB.close();
});

test('the basket drawer traps and restores focus (React Aria overlay)', async ({
  page,
}) => {
  // Step 7 (ADR 0013): the drawer is a HeroUI/React Aria overlay; a screen-reader
  // / keyboard user relies on it moving focus into the dialog on open and
  // returning it to the trigger on close. Exercised end-to-end because jsdom
  // can't prove real focus management.
  await page.goto('/');

  const trigger = page.locator('header').getByRole('button', {
    name: /basket/i,
  });
  await trigger.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole('heading', { name: 'Your basket' }),
  ).toBeVisible();

  // Focus has moved into the dialog (focus trap).
  await expect
    .poll(() => dialog.evaluate((el) => el.contains(document.activeElement)))
    .toBe(true);

  // Escape closes the overlay and focus returns to the trigger.
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('the basket page has no a11y violations', async ({ page }) => {
  await page.goto('/basket');
  await seedBasket(page, [chromecast, echo]);
  await page.reload();

  // Scan the populated state (line items, quantity steppers, remove controls).
  await expect(
    page.getByRole('heading', { name: 'Your basket' }),
  ).toBeVisible();
  await expect(page.getByText('Google - Chromecast - Black')).toBeVisible();

  await expectNoA11yViolations(page);
});
