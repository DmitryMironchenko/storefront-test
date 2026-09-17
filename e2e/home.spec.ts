import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Foundation smoke: the home page server-renders and passes a page-level axe
// scan. Feature flows (PLP → filter → PDP → basket → checkout) are added in
// their own steps.
test("home page renders with no a11y violations", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Storefront starter" }),
  ).toBeVisible();

  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});
