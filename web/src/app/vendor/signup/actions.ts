"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normaliseNigerianPhone, validateAccount, type SignupInput } from "@/lib/validation";

export type SignupResult = { error: string; step?: number } | undefined;

export async function signUpVendor(input: SignupInput): Promise<SignupResult> {
  // 1. Check everything again on the server. Never trust the browser alone.
  if (Object.keys(validateAccount(input)).length > 0) {
    return { error: "Please check your account details.", step: 1 };
  }
  const categories = (Array.isArray(input.categories) ? input.categories : [])
    .filter((c) => typeof c === "string")
    .slice(0, 9);
  if (categories.length === 0) return { error: "Pick at least one category.", step: 2 };

  const subcategories = (Array.isArray(input.subcategories) ? input.subcategories : [])
    .filter((n) => Number.isInteger(n))
    .slice(0, 100);
  const tagline = String(input.tagline ?? "").trim().slice(0, 120);
  const specialOffer = String(input.specialOffer ?? "").trim().slice(0, 120);
  const whatsapp = normaliseNigerianPhone(input.whatsapp) as string;

  // 2. Create the login. The database then creates the profile, store and free trial together.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: {
        full_name: input.fullName.trim(),
        phone: whatsapp,
        business_name: input.businessName.trim(),
        whatsapp,
        neighbourhood: input.neighbourhood.trim(),
        tagline,
        special_offer: specialOffer,
        categories,
        subcategories: subcategories.map(String),
      },
    },
  });

  if (error) {
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return { error: "An account with this email already exists. Try logging in instead.", step: 1 };
    }
    if (error.code === "weak_password") {
      return { error: "Please choose a stronger password.", step: 1 };
    }
    if (error.status === 429) {
      return { error: "Too many sign-up attempts. Please wait a few minutes and try again." };
    }
    console.error("Sign-up failed:", error.code, error.message);
    return { error: "We couldn't create your store just now. Please try again in a minute." };
  }

  // 3. When email confirmation is on (at launch), there's no session until they click the link.
  if (!data.session) redirect("/vendor/check-email");
  redirect("/vendor/dashboard");
}