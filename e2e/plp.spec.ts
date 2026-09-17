import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// PLP E2E (ADR 0004): the async Server Component + hybrid-SSR search that Vitest
// can't drive. Covers the issue #3 acceptance — a shared filtered link renders
// server-side and filters survive a refresh — plus a page-level a11y scan.

test("server-renders products into the initial HTML", async ({ request }) => {
  const res = await request.get("/");
  expect(res.ok()).toBeTruthy();
  const html = await res.text();
  // ProductCard links (`/product/<id>`) present in the raw HTML ⇒ the first
  // Algolia query ran on the server, not after hydration (no skeleton flash).
  expect(html).toContain('href="/product/');
});

test("filters the catalogue and keeps the filter in a shareable, refresh-safe URL", async ({
  page,
  request,
}) => {
  await page.goto("/");

  const status = page.getByRole("status");
  await expect(status).toContainText(/product/);
  const totalCount = await status.textContent();

  // Apply a category filter from the labelled "Category" fieldset.
  const categoryGroup = page.getByRole("group", { name: "Category" });
  await categoryGroup.getByRole("link", { name: /Appliances/ }).click();

  // The filter lands in the URL (shareable) and narrows the result count.
  await expect(page).toHaveURL(/category/);
  await expect(status).not.toHaveText(totalCount ?? "");
  const sharedUrl = page.url();
  const filteredCount = await status.textContent();

  // The shared link renders the filtered, selected state on the SERVER.
  const res = await request.get(sharedUrl);
  const html = await res.text();
  expect(html).toContain("ais-HierarchicalMenu-item--selected");
  expect(html).toContain("Appliances");

  // Filter survives a full reload.
  await page.goto(sharedUrl);
  await expect(page.getByRole("status")).toHaveText(filteredCount ?? "");
  await expect(
    page.getByRole("group", { name: "Category" }).locator(".ais-HierarchicalMenu-item--selected"),
  ).toBeVisible();
});

test("searches the catalogue and keeps the query in a shareable URL", async ({
  page,
}) => {
  await page.goto("/");

  const status = page.getByRole("status");
  await expect(status).toContainText(/product/);
  const totalCount = await status.textContent();

  // "apple" is only a broad, stable search term; the assertions don't depend on
  // how many results it returns, just that it narrows and lands in the URL.
  await page.getByRole("searchbox", { name: "Search" }).fill("apple");

  await expect(page).toHaveURL(/[?&]q=apple/);
  await expect(status).not.toHaveText(totalCount ?? "");
  await expect(page.locator('a[href^="/product/"]').first()).toBeVisible();

  // The query survives a full reload (shareable / refresh-safe).
  await page.reload();
  await expect(page.getByRole("searchbox", { name: "Search" })).toHaveValue(
    "apple",
  );
});

test("pages through results and keeps the page in the URL", async ({ page }) => {
  await page.goto("/");

  const firstProduct = page.locator('a[href^="/product/"]').first();
  await expect(firstProduct).toBeVisible();
  const firstHrefPage1 = await firstProduct.getAttribute("href");

  // Guarded on a second page existing so an index change can't hard-fail this;
  // the full catalogue always has many pages, so it runs.
  const page2Link = page
    .getByRole("navigation", { name: "Pagination" })
    .getByRole("link", { name: "Page 2" });
  await expect(page2Link).toBeVisible();

  await page2Link.click();
  await expect(page).toHaveURL(/[?&]page=2/);
  await expect
    .poll(() => firstProduct.getAttribute("href"))
    .not.toBe(firstHrefPage1);
});

test("the PLP has no a11y violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
  // Wait for the first product to render before scanning.
  await expect(page.locator('a[href^="/product/"]').first()).toBeVisible();

  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});
