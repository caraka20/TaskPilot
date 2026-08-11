import type { ReactNode } from "react";
import { Button, Spinner } from "@heroui/react";
import { AlertCircle, Inbox } from "lucide-react";

type Props = {
  kind?: "loading" | "empty" | "error";
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
};

export default function StatePanel({
  kind = "empty",
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: Props) {
  const visual =
    icon ??
    (kind === "loading" ? (
      <Spinner size="sm" color="primary" />
    ) : kind === "error" ? (
      <AlertCircle className="h-6 w-6" />
    ) : (
      <Inbox className="h-6 w-6" />
    ));

  return (
    <div
      className="grid min-h-52 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-center dark:border-slate-700 dark:bg-slate-900/60"
      role={kind === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <div className="max-w-md">
        <div
          className={`mx-auto grid h-12 w-12 place-items-center rounded-2xl ${
            kind === "error"
              ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
              : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"
          }`}
        >
          {visual}
        </div>
        <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">{title}</h2>
        {description && (
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
            {description}
          </p>
        )}
        {actionLabel && onAction && (
          <Button color="primary" variant="flat" className="mt-4 min-h-11" onPress={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
