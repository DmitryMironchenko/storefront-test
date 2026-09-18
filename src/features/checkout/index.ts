// Public API of the checkout feature.
//
// NOTE: the wire contract (contract.ts) is intentionally *not* re-exported here.
// The server route imports it (and reprice) by direct path so it never pulls a
// client component through this barrel; client code imports the pieces below.
export { useCheckout } from './model/useCheckout';
export type { CheckoutStatus, UseCheckout } from './model/useCheckout';
export { CheckoutButton } from './ui/CheckoutButton';
export { OrderConfirmation } from './ui/OrderConfirmation';
