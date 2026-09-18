import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

// Shared page-level axe assertion for the core-page scans (ADR 0004 / 0013).
// One place to evolve the axe config — rules, tags, disabled checks — as the
// PLP / PDP / basket scans grow, instead of the same two lines in three specs.
// Not a *.spec file, so Playwright doesn't collect it as a test.
export async function expectNoA11yViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
}
