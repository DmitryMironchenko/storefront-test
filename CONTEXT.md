# Breitling Storefront

An Algolia-backed storefront: browse products across listing pages, view detail pages, keep a browser-persisted basket, and submit a mock checkout. This glossary fixes the ubiquitous language so code, UI copy, and interview discussion stay consistent.

## Language

### Catalogue

**Product**:
A single purchasable item, sourced from an Algolia index record. Has a name, brand, price, image, categories, and rating.
_Avoid_: Hit, Document, Record, SKU

**Facet**:
A product attribute the catalogue can be narrowed by (e.g. brand, price range, rating, category).
_Avoid_: Attribute (too general), Field

**Filter**:
A user-applied constraint on a facet that narrows the visible products (e.g. brand = Sony). The set of active filters lives in the URL, so a filtered view is shareable.
_Avoid_: Refinement (this is Algolia/InstantSearch's word for the same thing — use "Filter" in our domain and UI, "refinement" only when naming an InstantSearch API)

**Category**:
A hierarchical classification a Product belongs to — a top level (`lvl0`, e.g. "Audio") narrowing to a child level (`lvl1`), sourced from the index's `hierarchicalCategories`. Category is the primary browse Facet on the single PLP.
_Avoid_: Department, Section, Collection

**PLP** (Product Listing Page):
A page that lists products with filters applied. There is one canonical PLP; Category is a Facet within it, not a separate page per category.

**PDP** (Product Detail Page):
A page showing the full detail of one Product.

### Basket & checkout

**Basket**:
The collection of products a user intends to purchase, persisted in the browser between sessions.
_Avoid_: Cart, Bag — with one sanctioned exception: analytics event names keep the industry-standard wire form (`add_to_cart`, `remove_from_cart`), which is a wire format, not our domain language.

**Line Item**:
One entry in the Basket: a _display snapshot_ of a Product taken at add-time — `objectID`, `name`, `image`, `brand`, and the price shown at add-time — plus a `quantity`. The snapshot exists so the Basket renders without re-querying the catalogue. The captured price is **indicative** (what the user saw), _not_ authoritative: price is catalogue truth and the Checkout route re-validates it against the catalogue before returning a total. Product availability/stock is out of scope (see ADR 0001).
_Avoid_: treating the snapshot price as the final charge.

**Checkout**:
The act of submitting the Basket to the mock order endpoint. Succeeds with an order id and empties the Basket.
_Avoid_: Purchase, Order (the outcome), Payment

**Anonymous Id**:
A client-generated identifier for an unauthenticated visitor, persisted in the browser and attached to analytics events. There are no accounts or sign-in.
_Avoid_: User id, Session id
