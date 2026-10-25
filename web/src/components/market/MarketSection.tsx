import type { ReactNode } from "react";

export default function MarketSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="mx-auto mb-6 max-w-5xl">
      <h2 className="bg-brand px-5 py-3 text-lg font-bold text-white">
        {icon && <span aria-hidden="true">{icon} </span>}
        {title}
      </h2>
      <div className="border-x-[6px] border-b-[6px] border-brand bg-white p-4">
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
      </div>
    </section>
  );
}