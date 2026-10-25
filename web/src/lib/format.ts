// Money is stored in kobo (₦1 = 100 kobo) as whole numbers, so sums are always exact.
export function formatNaira(kobo: number): string {
  return "₦" + Math.round(kobo / 100).toLocaleString("en-NG");
}

// "under ₦5k" style tag for Best of Budget: the next thousand above the price.
export function budgetTag(kobo: number): string {
  const nextThousand = Math.floor(kobo / 100 / 1000) + 1;
  return `under ₦${nextThousand}k`;
}