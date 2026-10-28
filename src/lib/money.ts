export function formatAUD(cents: number): string {
  const n = new Intl.NumberFormat("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
  return `A$${n}`;
}

export function shippingCents(fulfilment: "pickup" | "ship", country: string): number {
  if (fulfilment === "pickup") return 0;
  const c = (country || "").toUpperCase();
  if (c === "AU" || c === "AUSTRALIA") return 1200;
  if (c === "NZ" || c === "NEW ZEALAND") return 1800;
  return 2800;
}

export function priceBucket(cents: number): "under-80" | "80-150" | "over-150" {
  const dollars = cents / 100;
  if (dollars < 80) return "under-80";
  if (dollars <= 150) return "80-150";
  return "over-150";
}
