import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <Link href="/" aria-label="Ndu home" className="font-serif text-2xl font-bold tracking-tight">
          Ndu<span className="text-brand">.</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/vendor/login" className="text-sm font-medium text-gray-600 hover:text-ink">
            Vendor Login
          </Link>
          <Link href="/vendor/signup" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
            Open a Store
          </Link>
        </nav>
      </div>
    </header>
  );
}