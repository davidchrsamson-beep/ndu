"use server";

import { parseRequest } from "@/lib/parse";
import { db } from "@/lib/supabase";

export type VendorResult = {
  vendorName: string;
  vendorSlug: string;
  whatsapp: string;
  verified: boolean;
  productName: string;
  priceKobo: number;
  imageUrl: string | null;
  createdAt: string;
  score: number;
};

export type SearchResponse =
  | { ok: true; results: VendorResult[]; budgetKobo: number | null }
  | { ok: false; error: string };

type VendorRow = { business_name: string; slug: string; whatsapp: string; verified: boolean };
type MediaRow = { url: string; type: string; sort_order: number };

export async function searchVendors(text: string, budgetOverrideKobo: number | null): Promise<SearchResponse> {
  const request = String(text ?? "").trim().slice(0, 300);
  if (!request) return { ok: false, error: "Tell me what you want to buy." };

  const parsed = parseRequest(request);
  const budgetKobo = budgetOverrideKobo ?? parsed.budgetKobo;
  const supabase = db();

  if (parsed.keywords.length === 0) {
    await record(request, budgetKobo, 0);
    return { ok: true, results: [], budgetKobo };
  }

  // Live products of live stores only — the database rules enforce that for us.
  let query = supabase
    .from("products")
    .select(
      "name, description, price_kobo, created_at, vendor:vendors(business_name, slug, whatsapp, verified), product_media(url, type, sort_order)",
    )
    .textSearch("search", parsed.keywords.join(" or "), { type: "websearch", config: "english" })
    .limit(60);
  if (budgetKobo) query = query.lte("price_kobo", budgetKobo);

  const { data, error } = await query;
  if (error) {
    console.error("Chat search failed:", error.code, error.message);
    return { ok: false, error: "Search is having a moment. Try again, or hand it to a real person." };
  }

  // Keep the best-matching product per vendor: Ndu promotes vendors, not single products.
  const best = new Map<string, VendorResult>();
  for (const row of data ?? []) {
    const vendor = row.vendor as unknown as VendorRow | null;
    if (!vendor?.whatsapp) continue;

    const name = String(row.name).toLowerCase();
    const text = `${name} ${String(row.description ?? "").toLowerCase()}`;
    const score = parsed.keywords.reduce((s, k) => s + (name.includes(k) ? 2 : text.includes(k) ? 1 : 0), 0);

    const media = ((row.product_media ?? []) as unknown as MediaRow[])
      .filter((m) => m.type === "image")
      .sort((a, b) => a.sort_order - b.sort_order);

    const candidate: VendorResult = {
      vendorName: vendor.business_name,
      vendorSlug: vendor.slug,
      whatsapp: vendor.whatsapp,
      verified: vendor.verified,
      productName: String(row.name),
      priceKobo: Number(row.price_kobo),
      imageUrl: media[0]?.url ?? null,
      createdAt: String(row.created_at),
      score,
    };

    const current = best.get(vendor.slug);
    if (!current || score > current.score || (score === current.score && candidate.priceKobo < current.priceKobo)) {
      best.set(vendor.slug, candidate);
    }
  }

  const results = [...best.values()].sort((a, b) => b.score - a.score || a.priceKobo - b.priceKobo).slice(0, 12);
  await record(request, budgetKobo, results.length);
  return { ok: true, results, budgetKobo };
}

// The buyer tapped "Hand to a real person".
export async function logHandoff(request: string) {
  const clean = String(request ?? "").trim().slice(0, 300);
  if (!clean) return;
  const { error } = await db().from("chat_requests").insert({ query: clean, handed_off: true });
  if (error) console.error("Hand-off log failed:", error.code, error.message);
}

async function record(query: string, budgetKobo: number | null, resultsCount: number) {
  const { error } = await db()
    .from("chat_requests")
    .insert({ query, budget_kobo: budgetKobo, results_count: resultsCount });
  if (error) console.error("Request log failed:", error.code, error.message);
}