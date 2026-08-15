import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "blue" | "purple" | "green" | "amber" | "red" | "gray";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-600/10",
    purple: "bg-violet-50 text-violet-700 ring-violet-600/10",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/10",
    red: "bg-rose-50 text-rose-700 ring-rose-600/10",
    gray: "bg-slate-100 text-slate-600 ring-slate-500/10",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold ring-1 ring-inset ${tones[tone]}`}>
      {children}
    </span>
  );
}
