import Link from "next/link";
import type { MarketProduct } from "@/lib/sample-data";
import { budgetTag, formatNaira } from "@/lib/format";

type Props = {
  product: MarketProduct;
  variant?: "standard" | "budget" | "discover";
};

export default function ProductCard({ product, variant = "standard" }: Props) {
  // Tapping a card opens the VENDOR's storefront: Ndu promotes vendors, not single products.
  const href = `/s/${product.vendorSlug}?from=market&product=${product.id}`;
  const initial = product.vendorName.charAt(0).toUpperCase();

  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gray-100">
        {/* Grey placeholder until real photos arrive */}
        <div className="flex h-full items-center justify-center p-3 text-center text-xs text-gray-400">
          {product.name}
        </div>

        {variant === "discover" ? (
          <div className="absolute inset-x-2 top-2 flex items-center gap-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-300 text-[11px] font-bold">
              {initial}
            </span>
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] text-gray-700">📍 {product.location}</span>
          </div>
        ) : (
          <>
            {variant === "budget" && (
              <span className="absolute left-2 top-2 rounded-full bg-ink/85 px-2 py-0.5 text-[10px] font-medium text-white">
                {budgetTag(product.priceKobo)}
              </span>
            )}
            {product.verified && (
              <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-brand">
                ✓ Verified
              </span>
            )}
          </>
        )}
      </div>

      <p className="mt-2 text-base font-bold">{formatNaira(product.priceKobo)}</p>
      <p className="text-xs text-gray-600">
        {product.name}
        {variant === "budget" && ` ${budgetTag(product.priceKobo)}`}
      </p>

      {variant !== "discover" && (
        <div className="mt-2 flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold">
            {initial}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[11px] font-semibold">{product.vendorName}</span>
            <span className="block truncate text-[10px] text-gray-400">📍 {product.location}</span>
          </span>
        </div>
      )}
    </Link>
  );
}