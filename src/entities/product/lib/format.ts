// The demo index (BestBuy) prices are USD numbers. One shared formatter keeps
// currency rendering consistent across the card, the (future) PDP, and basket.
const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function formatPrice(price: number): string {
  return priceFormatter.format(price);
}
