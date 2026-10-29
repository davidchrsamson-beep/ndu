// Kobo (whole numbers) to "₦24,000".
export function formatNaira(kobo: number): string {
  return "₦" + Math.round(kobo / 100).toLocaleString("en-NG");
}