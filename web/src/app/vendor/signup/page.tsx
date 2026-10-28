import type { Metadata } from "next";
import AuthShell from "@/components/vendor/AuthShell";
import { createClient } from "@/lib/supabase/server";
import SignupWizard, { type SignupCategory } from "./SignupWizard";

export const metadata: Metadata = { title: "Open your store — Ndu" };

type SubRow = { id: number; name: string; sort_order: number };

export default async function SignupPage() {
  const supabase = await createClient();
  const [cats, settings] = await Promise.all([
    supabase.from("categories").select("id, slug, name, subcategories(id, name, sort_order)").order("sort_order"),
    supabase.from("settings").select("key, value"),
  ]);

  if (cats.error || settings.error) {
    console.error("Sign-up page failed to load:", cats.error?.message ?? settings.error?.message);
    return (
      <AuthShell>
        <p role="alert" className="mt-10 text-center text-sm text-red-600">
          We couldn&apos;t load the sign-up form. Please refresh the page.
        </p>
      </AuthShell>
    );
  }

  const categories: SignupCategory[] = (cats.data ?? []).map((c) => ({
    id: c.id as number,
    slug: c.slug as string,
    name: c.name as string,
    subcategories: ((c.subcategories ?? []) as unknown as SubRow[])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(({ id, name }) => ({ id, name })),
  }));

  // Read a number from the settings table, with a safe fallback.
  const setting = (key: string, fallback: number) => {
    const row = (settings.data ?? []).find((s) => s.key === key);
    const n = Number(row?.value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  return (
    <AuthShell>
      <SignupWizard
        categories={categories}
        plan={{
          priceKobo: setting("price_kobo", 300000),
          periodDays: setting("period_days", 60),
          trialDays: setting("trial_days", 14),
        }}
      />
    </AuthShell>
  );
}