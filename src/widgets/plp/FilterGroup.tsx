import type { ReactNode } from 'react';

// A11y wrapper for a group of related filter controls. InstantSearch's
// refinement widgets render bare checkbox lists with no grouping semantics; a
// <fieldset>/<legend> gives each facet an accessible group name so a screen
// reader announces "Brand, group" before the options (ADR 0004 a11y target).
export function FilterGroup({
  legend,
  children,
}: {
  legend: string;
  children: ReactNode;
}) {
  return (
    <fieldset className='border-t border-border pt-4'>
      <legend className='mb-2 px-0 pr-2 text-sm font-semibold text-foreground'>
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}
