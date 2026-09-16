import { SpikeSmoke } from "./spike-smoke";

// Step 0 risk gate (.scratch/issues/0.md): confirm HeroUI v3 and
// <InstantSearchNext> both server-render and hydrate cleanly on the forked
// Next 16 before ADR 0002/0003 feature work begins. Throwaway — delete this
// route once the gate is recorded.
export default function SpikePage() {
  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">Mount spike</h1>
      <SpikeSmoke />
    </main>
  );
}
