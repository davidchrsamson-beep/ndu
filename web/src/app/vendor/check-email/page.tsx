import Link from "next/link";
import AuthShell from "@/components/vendor/AuthShell";

export default function CheckEmailPage() {
  return (
    <AuthShell>
      <div className="mt-10 text-center">
        <p className="text-4xl" aria-hidden="true">📬</p>
        <h1 className="mt-4 text-2xl font-bold">Check your email</h1>
        <p className="mt-2 text-sm text-gray-600">
          We sent you a link to confirm your email. Tap it to open your store dashboard.
        </p>
        <p className="mt-6 text-sm text-gray-500">
          Already confirmed? <Link href="/vendor/login" className="font-semibold text-brand">Log in</Link>
        </p>
      </div>
    </AuthShell>
  );
}