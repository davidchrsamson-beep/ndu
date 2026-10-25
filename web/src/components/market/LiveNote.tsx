import type { ReactNode } from "react";

export default function LiveNote({ children }: { children: ReactNode }) {
  return <p className="mx-auto my-6 max-w-5xl px-5 text-center text-xs italic text-brand">{children}</p>;
}