// vitest-axe ships type augmentation for the legacy `Vi` global namespace, which
// Vitest 5 no longer reads. Re-declare the matcher on Vitest 5's `Matchers`
// interface so `expect(...).toHaveNoViolations()` type-checks. The runtime
// registration lives in vitest.setup.ts.
import "vitest";

declare module "vitest" {
  // Type params must match Vitest's own `Matchers` declaration exactly for the
  // interface merge; `T` is unused here but required to line up.
  // prettier-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Matchers<R extends void | Promise<void> = void | Promise<void>, T = unknown> {
    toHaveNoViolations(): R;
  }
}
