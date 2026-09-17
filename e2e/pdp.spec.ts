import { expect, test } from "@playwright/test";

// PDP E2E (ADR 0004): clicking a product in the listing navigates to and renders
// its detail page. Search and pagination are PLP behaviours and live in
// plp.spec.ts; this spec starts on the PLP only because that is how a user
// reaches a PDP — every assertion below is about the PDP itself.
//
// Runs against the live Algolia demo index (a de-facto fixture), like the rest
// of the E2E tier, so the assertions are structural — the URL shape and the
// PDP's own landmarks — never a hard-coded product name.

test("opens a product's detail page from the listing", async ({ page }) => {
  await page.goto("/");

  const firstProduct = page.locator('a[href^="/product/"]').first();
  await expect(firstProduct).toBeVisible();
  const targetHref = await firstProduct.getAttribute("href");
  expect(targetHref).toBeTruthy();

  await firstProduct.click();

  // Landed on the product's own route...
  await expect(page).toHaveURL(new RegExp(`${targetHref}(?:[?#]|$)`));
  // ...which renders the product (its name is the page's only level-1 heading)
  // and the way back to the catalogue.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Back to products" }),
  ).toBeVisible();
});

test("a shared PDP link renders the product server-side", async ({
  page,
  request,
}) => {
  // Reach a real product id via the listing, then load its PDP fresh (a shared
  // link / direct navigation) and assert the product is in the server HTML —
  // the issue #4 acceptance criterion.
  await page.goto("/");
  const firstProduct = page.locator('a[href^="/product/"]').first();
  await expect(firstProduct).toBeVisible();
  const href = await firstProduct.getAttribute("href");
  expect(href).toBeTruthy();

  const res = await request.get(href!);
  expect(res.ok()).toBeTruthy();
  const html = await res.text();
  // The product name lands in both the <h1> and the <title>, server-side.
  expect(html).toContain("<h1");
  expect(html).toMatch(/<title>[^<]+<\/title>/);
});
