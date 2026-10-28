// Rules shared by the browser (instant feedback) and the server (the real check).

export type SignupInput = {
  fullName: string;
  businessName: string;
  whatsapp: string;
  email: string;
  neighbourhood: string;
  password: string;
  confirmPassword: string;
  categories: string[]; // category slugs, e.g. "fashion"
  subcategories: number[]; // subtype ids
  tagline: string;
  specialOffer: string;
};

export type FieldErrors = Partial<Record<keyof SignupInput, string>>;

// Simple on purpose: accepts plus signs and dots (jane+shop@gmail.com), rejects obvious typos.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Turns 08012345678, 8012345678, 2348012345678 or "+234 801 234 5678" into +2348012345678.
export function normaliseNigerianPhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = "234" + digits.slice(1);
  else if (digits.length === 10) digits = "234" + digits;
  return digits.length === 13 && digits.startsWith("234") ? "+" + digits : null;
}

export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Use at least 8 characters.";
  if (password.length > 72) return "Use 72 characters or fewer.";
  return null;
}

export function validateAccount(input: SignupInput): FieldErrors {
  const errors: FieldErrors = {};
  const fullName = String(input.fullName ?? "").trim();
  const businessName = String(input.businessName ?? "").trim();

  if (fullName.length < 2) errors.fullName = "Enter your full name.";
  else if (fullName.length > 100) errors.fullName = "Use 100 characters or fewer.";

  if (businessName.length < 2) errors.businessName = "Enter your business name.";
  else if (businessName.length > 80) errors.businessName = "Use 80 characters or fewer.";

  if (!normaliseNigerianPhone(String(input.whatsapp ?? ""))) {
    errors.whatsapp = "Enter a Nigerian number, e.g. 08012345678.";
  }
  if (!EMAIL_PATTERN.test(String(input.email ?? "").trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (String(input.neighbourhood ?? "").trim().length > 80) {
    errors.neighbourhood = "Use 80 characters or fewer.";
  }

  const pw = passwordProblem(String(input.password ?? ""));
  if (pw) errors.password = pw;
  else if (input.password !== input.confirmPassword) errors.confirmPassword = "Passwords do not match.";

  return errors;
}