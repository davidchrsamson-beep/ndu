"use client";

import { useId, useState, type InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

function inputClass(error?: string) {
  const base =
    "w-full rounded-xl border bg-white px-4 py-3 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2";
  return `${base} ${error ? "border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-brand focus:ring-brand/20"}`;
}

function Note({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) return <p id={id} className="mt-1 text-xs text-red-600">{error}</p>;
  if (hint) return <p id={id} className="mt-1 text-xs text-gray-400">{hint}</p>;
  return null;
}

export function Field({ label, error, hint, id, className, ...props }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-xs font-medium text-gray-600">{label}</label>
      <input
        {...props}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${inputId}-note` : undefined}
        className={inputClass(error)}
      />
      <Note id={`${inputId}-note`} error={error} hint={hint} />
    </div>
  );
}

export function PasswordField({ label, error, hint, id, className, ...props }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [visible, setVisible] = useState(false);
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-xs font-medium text-gray-600">{label}</label>
      <div className="relative">
        <input
          {...props}
          id={inputId}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${inputId}-note` : undefined}
          className={`${inputClass(error)} pr-16`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:text-ink"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      <Note id={`${inputId}-note`} error={error} hint={hint} />
    </div>
  );
}