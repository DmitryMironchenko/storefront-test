import { Button } from "@heroui/react";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";

// Smoke test for the whole unit-test harness: React Testing Library renders a
// real HeroUI (React Aria) component in jsdom, and the vitest-axe matcher runs.
// It proves the toolchain is wired before any feature tests are written.
describe("test harness", () => {
  it("renders a HeroUI component", () => {
    render(<Button>Add to basket</Button>);

    expect(
      screen.getByRole("button", { name: "Add to basket" }),
    ).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <main>
        <Button>Add to basket</Button>
      </main>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
