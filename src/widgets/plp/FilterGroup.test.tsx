import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";

import { FilterGroup } from "./FilterGroup";

describe("FilterGroup", () => {
  it("groups its controls in a fieldset labelled by the legend", () => {
    render(
      <FilterGroup legend="Brand">
        <label>
          <input type="checkbox" /> Apple
        </label>
      </FilterGroup>,
    );

    // The <legend> gives the fieldset an accessible group name.
    const group = screen.getByRole("group", { name: "Brand" });
    expect(group.tagName).toBe("FIELDSET");
    expect(group).toContainElement(
      screen.getByRole("checkbox", { name: "Apple" }),
    );
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <FilterGroup legend="Category">
        <label>
          <input type="checkbox" /> Audio
        </label>
      </FilterGroup>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
