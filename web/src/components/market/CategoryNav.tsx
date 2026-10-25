import Link from "next/link";
import { categories } from "@/lib/sample-data";

export default function CategoryNav({ active = "all" }: { active?: string }) {
  return (
    <nav aria-label="Vendor categories" className="mx-auto max-w-5xl px-5 pb-8">
      {/* Magazine: its own page, linked directly above the categories */}
      <Link
        href="/magazine"
        className="mb-6 flex items-center justify-between rounded-2xl border border-brand/20 bg-brand-tint px-4 py-3 transition hover:border-brand/40"
      >
        <span>
          <span className="block font-serif text-lg font-bold">✦ Ndu Magazine</span>
          <span className="block text-xs text-gray-600">Looks, fresh drops and vendor stories</span>
        </span>
        <span className="text-sm font-semibold text-brand">Read →</span>
      </Link>

      <div className="mb-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-gray-200" />
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">Vendor categories</h2>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        <li><Chip href="/" label="All" isActive={active === "all"} /></li>
        {categories.map((c) => (
          <li key={c.slug}>
            <Chip href={`/category/${c.slug}`} label={c.name} isActive={active === c.slug} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Chip({ href, label, isActive }: { href: string; label: string; isActive: boolean }) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`flex min-h-11 items-center justify-center rounded-full px-3 py-2 text-center text-sm leading-tight transition ${
        isActive ? "bg-ink font-semibold text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {label}
    </Link>
  );
}