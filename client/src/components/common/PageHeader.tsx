import type { ReactNode } from "react";
import { Button } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

type Props = {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: ReactNode;
  backTo?: string;
  actions?: ReactNode;
};

export default function PageHeader({
  title,
  description,
  eyebrow,
  icon,
  backTo,
  actions,
}: Props) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {backTo && (
          <Button
            as={Link}
            to={backTo}
            isIconOnly
            variant="flat"
            className="h-11 w-11 min-w-11 shrink-0 rounded-2xl"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        {icon && (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
            {icon}
          </span>
        )}

        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      )}
    </header>
  );
}
