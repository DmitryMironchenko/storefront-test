export type HierarchicalCategories = {
  lvl0?: string | string[];
  lvl1?: string | string[];
};

export type ProductHit = {
  objectID: string;
  name: string;
  description?: string;
  brand?: string;
  categories?: string[];
  hierarchicalCategories?: HierarchicalCategories;
  type?: string;
  price?: number;
  price_range?: string;
  image?: string;
  url?: string;
  free_shipping?: boolean;
  popularity?: number;
  rating?: number;
};
