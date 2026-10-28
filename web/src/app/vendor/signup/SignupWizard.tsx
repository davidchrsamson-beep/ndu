"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { Field, PasswordField } from "@/components/ui/fields";
import { formatNaira } from "@/lib/format";
import { validateAccount, type FieldErrors, type SignupInput } from "@/lib/validation";
import { signUpVendor } from "./actions";

export type SignupCategory = {
  id: number;
  slug: string;
  name: string;
  subcategories: { id: number; name: string }[];
};

export type Plan = { priceKobo: number; periodDays: number; trialDays: number };

const ICONS: Record<string, string> = {
  fashion: "👗",
  accessories: "💍",
  beauty: "💄",
  perfumes: "🌸",
  wigs: "💇‍♀️",
  bags: "👜",
  "phone-accessories": "📱",
  "kids-baby": "🧸",
  "home-living": "🏠",
};

const TOTAL_STEPS = 5;

const emptyForm: SignupInput = {
  fullName: "",
  businessName: "",
  whatsapp: "",
  email: "",
  neighbourhood: "",
  password: "",
  confirmPassword: "",
  categories: [],
  subcategories: [],
  tagline: "",
  specialOffer: "",
};

export default function SignupWizard({ categories, plan }: { categories: SignupCategory[]; plan: Plan }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SignupInput>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const chosen = categories.filter((c) => form.categories.includes(c.slug));
  const months = Math.max(1, Math.round(plan.periodDays / 30));
  const periodLabel = months === 1 ? "1 month" : `${months} months`;

  function update<K extends keyof SignupInput>(key: K, value: SignupInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function goTo(n: number) {
    setStep(n);
    window.scrollTo({ top: 0 });
  }

  function next() {
    if (step === 1) {
      const found = validateAccount(form);
      if (Object.keys(found).length > 0) {
        setErrors(found);
        return;
      }
    }
    if (step === 2 && form.categories.length === 0) {
      setErrors({ categories: "Pick at least one category." });
      return;
    }
    setErrors({});
    goTo(step + 1);
  }

  function toggleCategory(slug: string) {
    setForm((f) => {
      const nextCats = f.categories.includes(slug)
        ? f.categories.filter((c) => c !== slug)
        : [...f.categories, slug];
      // Drop subtypes that belong to a category that was just un-ticked.
      const allowed = new Set(
        categories.filter((c) => nextCats.includes(c.slug)).flatMap((c) => c.subcategories.map((s) => s.id)),
      );
      return { ...f, categories: nextCats, subcategories: f.subcategories.filter((id) => allowed.has(id)) };
    });
    setErrors((e) => ({ ...e, categories: undefined }));
  }

  function toggleSubcategory(id: number) {
    setForm((f) => ({
      ...f,
      subcategories: f.subcategories.includes(id)
        ? f.subcategories.filter((s) => s !== id)
        : [...f.subcategories, id],
    }));
  }

  function submit() {
    setServerError(null);
    startTransition(async () => {
      const result = await signUpVendor(form);
      if (result?.error) {
        setServerError(result.error);
        if (result.step) goTo(result.step);
      }
    });
  }

  return (
    <div>
      {/* Progress: one bar per step */}
      <div className="mb-6 flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={step} aria-label={`Step ${step} of ${TOTAL_STEPS}`}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-brand" : "bg-gray-200"}`} />
        ))}
      </div>

      {step > 1 && (
        <button type="button" onClick={() => goTo(step - 1)} className="mb-4 text-sm text-gray-500 hover:text-ink">
          ‹ Back
        </button>
      )}

      {serverError && (
        <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          ⚠ {serverError}
        </p>
      )}

      {step === 1 && (
        <section>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">Let&apos;s get your store set up in minutes</p>

          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Full Name"
                name="fullName"
                autoComplete="name"
                placeholder="Jane Bassey"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                error={errors.fullName}
              />
              <Field
                label="Business Name"
                name="businessName"
                autoComplete="organization"
                placeholder="Amaka's Arts"
                value={form.businessName}
                onChange={(e) => update("businessName", e.target.value)}
                error={errors.businessName}
              />
            </div>
            <Field
              label="Phone / WhatsApp"
              name="whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="08012345678"
              hint="Buyers will reach you on this WhatsApp number."
              value={form.whatsapp}
              onChange={(e) => update("whatsapp", e.target.value)}
              error={errors.whatsapp}
            />
            <Field
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              hint="You'll use this to log in."
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              error={errors.email}
            />
            <Field
              label="Location (neighbourhood)"
              name="neighbourhood"
              placeholder="e.g. Marian, Watt, Calabar South"
              hint="Ndu currently operates in Calabar only."
              value={form.neighbourhood}
              onChange={(e) => update("neighbourhood", e.target.value)}
              error={errors.neighbourhood}
            />

            <p className="pt-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">Create login password</p>
            <PasswordField
              label="Password"
              name="password"
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              error={errors.password}
            />
            <PasswordField
              label="Confirm Password"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              error={errors.confirmPassword}
            />
          </div>

          <PrimaryButton onClick={next}>Continue</PrimaryButton>
          <p className="mt-4 text-center text-sm text-gray-500">
            Already have a store?{" "}
            <Link href="/vendor/login" className="font-semibold text-brand">Log in</Link>
          </p>
        </section>
      )}

      {step === 2 && (
        <section>
          <h1 className="text-2xl font-bold">What do you sell?</h1>
          <p className="mt-1 text-sm text-gray-500">Pick every category you carry. This helps buyers find you.</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {categories.map((c) => {
              const on = form.categories.includes(c.slug);
              return (
                <button
                  key={c.slug}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleCategory(c.slug)}
                  className={`flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-2 text-center text-xs font-medium transition ${
                    on ? "border-brand bg-brand-tint" : "border-gray-100 bg-white hover:border-gray-200"
                  }`}
                >
                  <span className="text-2xl" aria-hidden="true">{ICONS[c.slug] ?? "🛍️"}</span>
                  {c.name}
                </button>
              );
            })}
          </div>
          {errors.categories && (
            <p role="alert" className="mt-3 text-sm text-red-600">{errors.categories}</p>
          )}
          <PrimaryButton onClick={next}>Continue</PrimaryButton>
        </section>
      )}

      {step === 3 && (
        <section>
          <h1 className="text-2xl font-bold">What products do you sell?</h1>
          <p className="mt-1 text-sm text-gray-500">Select everything you carry. This helps customers find you.</p>
          <div className="mt-6 space-y-6">
            {chosen.map((c) => (
              <div key={c.slug}>
                <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">{c.name}</h2>
                <div className="flex flex-wrap gap-2">
                  {c.subcategories.map((s) => {
                    const on = form.subcategories.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleSubcategory(s.id)}
                        className={`rounded-full px-4 py-2 text-sm transition ${
                          on ? "bg-ink text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <PrimaryButton onClick={next} dark>Done →</PrimaryButton>
        </section>
      )}

      {step === 4 && (
        <section>
          <h1 className="text-2xl font-bold">Set up your store</h1>
          <p className="mt-1 text-sm text-gray-500">Optional. You can update this anytime from your dashboard.</p>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
              📷 You can add your logo and cover photo from your dashboard once your store is open.
            </div>
            <Field
              label="Store tagline (optional)"
              name="tagline"
              placeholder="Your Style. Your Story."
              maxLength={120}
              value={form.tagline}
              onChange={(e) => update("tagline", e.target.value)}
            />
            <Field
              label="Discount / special offer (optional)"
              name="specialOffer"
              placeholder="e.g. 10% off all Ankara this week"
              maxLength={120}
              hint="Shown as a banner on your storefront."
              value={form.specialOffer}
              onChange={(e) => update("specialOffer", e.target.value)}
            />
          </div>
          <PrimaryButton onClick={next}>Continue</PrimaryButton>
        </section>
      )}

      {step === 5 && (
        <section className="text-center">
          <h1 className="text-2xl font-bold">Your store is almost ready!</h1>
          <p className="mt-2 text-sm text-gray-600">
            <strong>{plan.trialDays} days free</strong>, no payment needed yet.
          </p>
          <p className="text-sm text-gray-600">
            After your trial, just {formatNaira(plan.priceKobo)} for {periodLabel}.
          </p>

          <div className="mt-6 rounded-2xl bg-brand-tint p-4 text-left text-sm">
            <p className="font-semibold text-brand-dark">Your categories:</p>
            <p className="mt-1 text-gray-700">{chosen.map((c) => c.name).join(" · ")}</p>
          </div>

          <ul className="mt-3 space-y-2 rounded-2xl bg-amber-50 p-4 text-left text-sm text-gray-700">
            <li>✦ Your own storefront link for your bio</li>
            <li>✦ Listed in the Ndu market</li>
            <li>✦ Unlimited products, up to 20 photos per upload</li>
            <li>✦ WhatsApp order leads in your dashboard</li>
          </ul>

          <PrimaryButton onClick={submit} disabled={isPending}>
            {isPending ? "Opening your store…" : "Activate My Free Trial 🚀"}
          </PrimaryButton>
          <p className="mt-3 text-xs text-gray-400">No card required.</p>
        </section>
      )}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  dark,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`mt-8 w-full rounded-xl py-3.5 text-base font-semibold text-white transition disabled:opacity-60 ${
        dark ? "bg-ink hover:bg-gray-800" : "bg-brand hover:bg-brand-dark"
      }`}
    >
      {children}
    </button>
  );
}