import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type WorkspaceHeaderTone =
  | "cyan"
  | "emerald"
  | "amber"
  | "indigo"
  | "violet";

export type WorkspaceHeaderMetric = {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: WorkspaceHeaderTone;
};

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: ReactNode;
  metrics: readonly [
    WorkspaceHeaderMetric,
    WorkspaceHeaderMetric,
    WorkspaceHeaderMetric,
  ];
};

const metricTone: Record<WorkspaceHeaderTone, string> = {
  cyan: "bg-cyan-300/15 text-cyan-200",
  emerald: "bg-emerald-300/15 text-emerald-200",
  amber: "bg-amber-300/15 text-amber-200",
  indigo: "bg-indigo-300/15 text-indigo-200",
  violet: "bg-violet-300/15 text-violet-200",
};

export default function WorkspacePageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
  metrics,
}: Props) {
  return (
    <header
      data-workspace-header
      className="relative overflow-hidden rounded-[26px] border border-cyan-300/15 bg-[linear-gradient(120deg,#0b2948_0%,#124b68_62%,#0f766e_125%)] text-white shadow-[0_16px_45px_rgba(15,42,68,.16)] md:h-[218px] md:min-h-[218px]"
    >
      <div
        aria-hidden="true"
        className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-cyan-300/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-indigo-400/10 blur-3xl"
      />

      <div className="relative flex flex-col gap-5 px-5 py-7 sm:px-7 md:h-[142px] md:min-h-[142px] md:flex-row md:items-center md:justify-between md:gap-4 md:py-5">
        <div className="flex min-w-0 items-start gap-4">
          <span
            data-header-icon
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur"
          >
            <Icon className="h-6 w-6 text-cyan-200" />
          </span>

          <div data-header-copy className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">
              {eyebrow}
            </p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl md:truncate">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200 md:line-clamp-2">
              {description}
            </p>
          </div>
        </div>

        {actions ? (
          <div
            data-header-actions
            className="flex shrink-0 flex-wrap items-center gap-2 md:max-w-[46%] md:flex-nowrap md:justify-end md:overflow-x-auto md:pb-1 [scrollbar-width:none] [&>*]:shrink-0 [&::-webkit-scrollbar]:hidden"
          >
            {actions}
          </div>
        ) : null}
      </div>

      <div className="relative grid border-t border-white/15 bg-black/[0.07] sm:grid-cols-3 md:h-[76px] md:min-h-[76px]">
        {metrics.map((metric, index) => {
          const MetricIcon = metric.icon;
          return (
            <div
              key={metric.label}
              data-header-metric
              className={[
                "flex min-w-0 items-center gap-3 px-5 py-4 sm:px-7",
                index > 0
                  ? "border-t border-white/15 sm:border-l sm:border-t-0"
                  : "",
              ].join(" ")}
            >
              <span
                className={[
                  "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                  metricTone[metric.tone ?? "cyan"],
                ].join(" ")}
              >
                <MetricIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-300">
                  {metric.label}
                </p>
                <div className="mt-0.5 min-w-0 overflow-hidden text-sm font-semibold text-white">
                  {metric.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </header>
  );
}
