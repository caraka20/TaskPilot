import { Activity, Clock3, Gauge, UsersRound, WalletCards } from "lucide-react";

import type { RangeKey, RowItem } from "./userlist.types";
import { RANGE_LABEL } from "./userlist.types";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function StatsStrip({ users, range }: { users: RowItem[]; range: RangeKey }) {
  const pick = (user: RowItem) => {
    if (range === "TODAY") return { jam: user.totalJamHariIni, gaji: user.totalGajiHariIni };
    if (range === "WEEK") return { jam: user.totalJamMingguIni, gaji: user.totalGajiMingguIni };
    if (range === "MONTH") return { jam: user.totalJamBulanIni, gaji: user.totalGajiBulanIni };
    return { jam: user.totalJamSemua, gaji: user.totalGajiSemua };
  };

  const summary = users.reduce(
    (result, user) => {
      const total = pick(user);
      result.hours += Number(total.jam) || 0;
      result.payroll += Number(total.gaji) || 0;
      result.maxHours = Math.max(result.maxHours, Number(total.jam) || 0);
      if (user.statusNow === "AKTIF") result.active += 1;
      if (user.statusNow === "JEDA") result.paused += 1;
      return result;
    },
    { hours: 0, payroll: 0, maxHours: 0, active: 0, paused: 0 }
  );

  const metrics = [
    {
      label: "User ditampilkan",
      value: String(users.length),
      note: `${summary.active} aktif · ${summary.paused} jeda`,
      icon: UsersRound,
      iconClass: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
    },
    {
      label: "Total jam",
      value: `${summary.hours.toFixed(1)} jam`,
      note: RANGE_LABEL[range],
      icon: Clock3,
      iconClass: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300",
    },
    {
      label: "Payroll periode",
      value: rupiah.format(summary.payroll),
      note: "Akumulasi user tampil",
      icon: WalletCards,
      iconClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    },
    {
      label: "Jam tertinggi",
      value: `${summary.maxHours.toFixed(1)} jam`,
      note: "Per user pada periode",
      icon: Gauge,
      iconClass: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    },
  ];

  return (
    <div className="grid border-t border-default-200/70 bg-default-50/45 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ label, value, note, icon: Icon, iconClass }, index) => (
        <div
          key={label}
          className={`flex items-center gap-3 px-5 py-4 sm:px-6 ${
            index === 0
              ? ""
              : index === 1
                ? "border-t border-default-200/70 sm:border-l sm:border-t-0"
                : index === 2
                  ? "border-t border-default-200/70 xl:border-l xl:border-t-0"
                  : "border-t border-default-200/70 sm:border-l sm:border-t-0 xl:border-t-0"
          }`}
        >
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${iconClass}`}>
            {index === 0 && summary.active > 0 ? <Activity className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-foreground-400">{label}</p>
            <p className="mt-0.5 truncate text-lg font-extrabold tracking-tight text-foreground">{value}</p>
            <p className="mt-0.5 truncate text-[11px] text-foreground-400">{note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
