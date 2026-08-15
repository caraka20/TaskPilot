import { CalendarDays, Clock3, TimerReset } from "lucide-react";

type Props = { stats: { today: string; week: string; month: string } };

export default function SummaryCards({ stats }: Props) {
  const items = [
    {
      label: "Hari ini",
      value: stats.today,
      note: "Akumulasi sesi hari berjalan",
      icon: Clock3,
      iconClass: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
    },
    {
      label: "Minggu ini",
      value: stats.week,
      note: "Periode Senin hingga Minggu",
      icon: CalendarDays,
      iconClass: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300",
    },
    {
      label: "Bulan ini",
      value: stats.month,
      note: "Akumulasi bulan berjalan",
      icon: TimerReset,
      iconClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    },
  ];

  return (
    <div className="grid overflow-hidden rounded-[22px] border border-default-200/80 bg-content1 shadow-[0_10px_30px_rgba(15,23,42,.05)] md:grid-cols-3 md:divide-x md:divide-default-200/70">
      {items.map(({ label, value, note, icon: Icon, iconClass }, index) => (
        <div key={label} className={`flex items-center gap-3 px-5 py-4 sm:px-6 ${index ? "border-t border-default-200/70 md:border-t-0" : ""}`}>
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${iconClass}`}>
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground-400">{label}</p>
            <p className="mt-0.5 text-xl font-extrabold tracking-tight text-foreground">{value} <span className="text-xs font-medium text-foreground-400">jam</span></p>
            <p className="mt-0.5 truncate text-[11px] text-foreground-400">{note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
