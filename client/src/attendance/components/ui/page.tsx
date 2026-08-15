import type { ReactNode } from "react";

export function PageHeader({
  eyebrow = "Absensi Workspace",
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[104px] flex-col justify-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-4 py-5 shadow-[0_8px_24px_rgba(15,23,42,.04)] dark:border-slate-800 dark:bg-slate-900 sm:px-5 lg:h-[104px] lg:min-h-[104px] lg:flex-row lg:items-center lg:justify-between lg:py-4">
      <div className="min-w-0">
        <p className="text-[11px] font-extrabold uppercase tracking-[.18em] text-indigo-600 dark:text-indigo-300">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-.035em] text-slate-950 dark:text-white">{title}</h1>
        <p className="mt-1 line-clamp-2 max-w-2xl text-sm leading-5 text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`animate-rise space-y-6 text-slate-800 dark:text-slate-100 ${className}`}>{children}</div>;
}
