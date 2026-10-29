import type { VendorResult } from "@/app/actions";
import { formatNaira } from "@/lib/format";

// One vendor card: photo, price, item, vendor, and two ways to buy.
export default function ResultCard({ r, marketUrl }: { r: VendorResult; marketUrl: string }) {
  const storeLink = `${marketUrl}/s/${r.vendorSlug}?from=chat`;
  const message = `Hi ${r.vendorName}! I found your ${r.productName} (${formatNaira(r.priceKobo)}) on errand by Ndu. Is it available?`;
  const whatsappLink = `https://wa.me/${r.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

  return (
    <article className="w-56 shrink-0 snap-start overflow-hidden rounded-[22px] border border-line bg-panel">
      <div className="relative h-40 bg-[#2A2B31]">
        {r.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.imageUrl} alt={r.productName} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-mute">No photo yet</div>
        )}
        {r.verified && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-accent px-2 py-1 text-[11px] font-bold text-night">
            Verified
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5 p-3">
        <span className="text-lg font-bold">{formatNaira(r.priceKobo)}</span>
        <span className="truncate text-[13px] text-mute">{r.productName}</span>
        <span className="truncate text-sm font-medium">{r.vendorName}</span>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <a
            href={storeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center justify-center rounded-2xl bg-accent text-[13px] font-bold text-night"
          >
            See store
          </a>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center justify-center rounded-2xl border border-line-strong text-[13px] font-semibold"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}