// Vitest setup: DOM matchers, the axe accessibility matcher, and per-test
// cleanup. Loaded via `setupFiles` in vitest.config.mts.
import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";
// vitest-axe's own `extend-expect` entry is a no-op under Vitest 5, so register
// the matcher explicitly. Its root `matchers` entry re-exports the matcher with
// `export type *` (packaging bug), which hides the runtime value — import the
// dist entry, which exports it as a value. Type augmentation lives in
// types/vitest-axe.d.ts.
import { toHaveNoViolations } from "vitest-axe/dist/matchers.js";

expect.extend({ toHaveNoViolations });

afterEach(() => {
  cleanup();
});
