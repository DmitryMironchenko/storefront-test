import { Plp } from "@/widgets/plp";

// The PLP view (FSD "page"): page chrome around the PLP widget. A Server
// Component — it renders the client <Plp> subtree, which hydrates from its
// server-rendered first query (ADR 0002/0003).
export function PlpPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Products
        </h1>
        <p className="mt-1 text-muted">
          Browse the catalogue and filter by category or brand.
        </p>
      </header>

      <Plp />
    </main>
  );
}
