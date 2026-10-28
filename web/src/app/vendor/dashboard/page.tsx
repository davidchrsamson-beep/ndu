import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut, signOutEverywhere } from "../actions";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Who is this? getClaims checks the login is genuine, not just present.
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) redirect("/vendor/login");

  const [{ data: vendor }, { data: sub }] = await Promise.all([
    supabase.from("vendors").select("business_name, slug").eq("owner_id", auth.claims.sub).maybeSingle(),
    supabase.from("subscriptions").select("kind, grace_ends_at").order("grace_ends_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const daysLeft = sub
    ? Math.max(0, Math.ceil((new Date(sub.grace_ends_at).getTime() - Date.now()) / 86_400_000))
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <span className="font-serif text-xl font-bold">Ndu<span className="text-brand">.</span></span>
          <form action={signOut}>
            <button className="text-sm text-gray-500 hover:text-ink">Log out</button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        {!vendor ? (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            We couldn&apos;t find a store on this account. Please contact Ndu support.
          </p>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Welcome, {vendor.business_name} 👋</h1>
            <p className="mt-2 inline-block rounded-full bg-brand-tint px-3 py-1 text-sm font-medium text-brand-dark">
              {sub?.kind === "trial" ? "Free trial" : "Subscription"}: {daysLeft} {daysLeft === 1 ? "day" : "days"} left
            </p>

            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Your storefront link</p>
              <Link href={`/s/${vendor.slug}`} className="mt-1 block break-all font-semibold text-brand">
                ndu.ng/s/{vendor.slug}
              </Link>
              <p className="mt-4 text-sm text-gray-500">
                Products, batch upload and store settings arrive here next.
              </p>
            </div>

            <form action={signOutEverywhere} className="mt-8">
              <button className="text-xs text-gray-400 underline hover:text-ink">Log out of all devices</button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}