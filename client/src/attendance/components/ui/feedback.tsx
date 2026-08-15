import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, Inbox } from "lucide-react";
import AppLoadingScreen from "../../../components/common/AppLoadingScreen";

export function Alert({
  children,
  tone = "error",
}: {
  children: ReactNode;
  tone?: "error" | "success" | "info";
}) {
  const styles = {
    error: "border-rose-200 bg-rose-50 text-rose-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  };
  const Icon = tone === "success" ? CheckCircle2 : tone === "info" ? Info : AlertCircle;
  return (
    <div className={`relative overflow-hidden rounded-2xl border shadow-sm ${styles[tone]}`}>
      <div className="flex gap-3 px-4 py-3.5 text-xs font-semibold leading-5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/70"><Icon size={16} /></span>
        <div className="self-center">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="px-6 py-14 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Inbox size={22} />
      </span>
      <p className="mt-4 text-sm font-extrabold text-slate-700">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">{description}</p>
    </div>
  );
}

export function LoadingScreen({ label = "Memuat data…" }: { label?: string }) {
  return <AppLoadingScreen fullScreen label={label} />;
}

export function LoadingState({ label = "Memuat data…" }: { label?: string }) {
  return <AppLoadingScreen compact label={label} />;
}
