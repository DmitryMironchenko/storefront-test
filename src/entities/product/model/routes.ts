// Canonical PDP route for a product. Kept here (entity layer) so the PLP card
// and the future PDP page agree on the URL shape without either owning it.
export function productHref(objectID: string): string {
  return `/product/${encodeURIComponent(objectID)}`;
}
