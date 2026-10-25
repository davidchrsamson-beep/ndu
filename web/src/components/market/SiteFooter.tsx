import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-gray-100 bg-gray-50 px-5 py-10 text-center">
      <p className="font-serif text-xl font-bold">
        Ndu<span className="text-brand">.</span>
      </p>
      <p className="mt-1 text-xs text-gray-400">Calabar&apos;s vendor marketplace · Life, delivered.</p>
      <div className="mt-4 flex justify-center gap-6 text-sm">
        <Link href="/vendor/signup" className="font-semibold text-brand">Create Your Store</Link>
        <Link href="/vendor/login" className="text-gray-600">Vendor Login</Link>
      </div>
      <p className="mt-6 text-[11px] text-gray-400">© {new Date().getFullYear()} Ndu</p>
    </footer>
  );
}