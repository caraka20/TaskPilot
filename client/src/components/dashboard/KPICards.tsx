import type { ReactNode } from "react";
import { Card, CardBody } from "@heroui/react";
import { Clock3, CalendarRange, Timer, Wallet2 } from "lucide-react";
import { numberID, currencyIDR, toHMS } from "../../utils/format";
import { useLiveDuration } from "../../hooks/useLiveDuration";

type MetricCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  accent: "blue" | "green" | "violet" | "amber";
  ariaLabel?: string;
};

function MetricCard({ title, value, subtitle, icon, accent, ariaLabel }: MetricCardProps) {
  const accents: Record<MetricCardProps["accent"], string> = {
    blue: "before:from-blue-500/15 before:to-transparent bg-gradient-to-b from-background/70 to-background/30",
    green: "before:from-emerald-500/15 before:to-transparent bg-gradient-to-b from-background/70 to-background/30",
    violet: "before:from-violet-500/15 before:to-transparent bg-gradient-to-b from-background/70 to-background/30",
    amber: "before:from-amber-500/15 before:to-transparent bg-gradient-to-b from-background/70 to-background/30",
  };

  return (
    <Card aria-label={ariaLabel ?? title}
      className={[
        "relative overflow-hidden rounded-2xl border border-default-200/70",
        "shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5",
        "before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none",
        accents[accent],
      ].join(" ")}>
      <CardBody className="flex items-start gap-4 p-5">
        <div className={[
          "shrink-0 grid place-items-center rounded-xl w-11 h-11",
          accent === "blue" && "bg-blue-500/10 text-blue-600",
          accent === "green" && "bg-emerald-500/10 text-emerald-600",
          accent === "violet" && "bg-violet-500/10 text-violet-600",
          accent === "amber" && "bg-amber-500/10 text-amber-700",
        ].filter(Boolean).join(" ")}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] leading-4 text-foreground-500">{title}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
          {subtitle && <div className="mt-1 text-[12px] text-foreground-400">{subtitle}</div>}
        </div>
      </CardBody>
    </Card>
  );
}

type KPICardsProps = {
  // untuk kartu live "hari ini"
  status: "AKTIF" | "JEDA" | "TIDAK_AKTIF";
  detikHariIni: number;     // akumulasi tanpa delta segmen aktif
  startedAt?: string | null;
  serverNow?: string | null;

  // kartu lain
  jamMingguIni: number;
  totalJamAll?: number;
  showRate?: boolean;
  gajiPerJam?: number;
};

export default function KPICards({
  status, detikHariIni, startedAt, serverNow,
  jamMingguIni, totalJamAll,
  showRate = false, gajiPerJam,
}: KPICardsProps) {
  const liveDetikHariIni = useLiveDuration({
    status,
    accumulatedSeconds: detikHariIni,
    startedAt: startedAt ?? null,
    serverNow: serverNow ?? null,
  });
  const approxJamHariIni = liveDetikHariIni / 3600;

  const desktopCols = showRate ? "lg:grid-cols-4 xl:grid-cols-4" : "lg:grid-cols-3 xl:grid-cols-3";

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${desktopCols} gap-4`}>
      <MetricCard
        title="Jam Hari Ini"
        value={toHMS(liveDetikHariIni)}
        subtitle={`≈ ${numberID.format(approxJamHariIni)} jam`}
        icon={<Clock3 size={22} />}
        accent="blue"
        ariaLabel="Jam kerja hari ini (berjalan)"
      />
      <MetricCard
        title="Jam Minggu Ini"
        value={`${numberID.format(jamMingguIni)} jam`}
        subtitle="Akumulasi Senin–Minggu berjalan"
        icon={<CalendarRange size={22} />}
        accent="green"
        ariaLabel="Jam kerja minggu ini"
      />
      <MetricCard
        title="Seluruh Jam"
        value={typeof totalJamAll === "number" ? `${numberID.format(totalJamAll)} jam` : "—"}
        subtitle="Total sepanjang waktu"
        icon={<Timer size={22} />}
        accent="violet"
        ariaLabel="Total jam sepanjang waktu"
      />
      {showRate && typeof gajiPerJam === "number" && (
        <MetricCard
          title="Gaji per Jam"
          value={currencyIDR.format(gajiPerJam)}
          subtitle="Hanya terlihat oleh OWNER"
          icon={<Wallet2 size={22} />}
          accent="amber"
          ariaLabel="Gaji per jam"
        />
      )}
    </div>
  );
}
