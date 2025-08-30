import React from "react";
import { Card, CardBody } from "@heroui/react";
import { Clock, CalendarDays, Timer } from "lucide-react";

type MiniStats = { today: string; week: string; month: string };
type Props = { stats: MiniStats };

function StatCard({
  icon,
  title,
  value,
  subtitle,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  /** tailwind gradient classes for the glowing aura */
  gradient: string;
}) {
  return (
    <div className="relative group">
      {/* Aura blur (subtle glow) */}
      <div
        className={`absolute -inset-2 rounded-3xl blur-2xl opacity-70 group-hover:opacity-95 transition-opacity ${gradient}`}
      />
      {/* Hairline frame */}
      <div className="rounded-[22px] p-[1.5px] bg-gradient-to-r from-white/10 to-white/10">
        <Card className="rounded-[20px] border border-default-200/70 bg-background/90 backdrop-blur-sm">
          <CardBody className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              {/* Icon pill */}
              <div className="p-2.5 rounded-xl bg-content2 text-foreground shrink-0 ring-1 ring-default-200/70 shadow-inner">
                {icon}
              </div>

              {/* Content */}
              <div className="min-w-0">
                <div className="text-xs text-foreground-500">{title}</div>

                <div className="mt-0.5 flex items-baseline gap-1">
                  <span className="text-2xl md:text-3xl xl:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70">
                    {value}
                  </span>
                  <span className="text-sm md:text-base font-medium text-foreground-500">
                    jam
                  </span>
                </div>

                <div className="mt-1 text-xs text-foreground-400">{subtitle}</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default function SummaryCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        icon={<Clock className="w-4 h-4" />}
        title="Jam Hari Ini"
        value={stats.today}
        subtitle="≈ akumulasi hari ini"
        gradient="bg-gradient-to-br from-indigo-400/18 via-fuchsia-400/14 to-emerald-400/18"
      />
      <StatCard
        icon={<CalendarDays className="w-4 h-4" />}
        title="Jam Minggu Ini"
        value={stats.week}
        subtitle="Akumulasi Senin–Minggu berjalan"
        gradient="bg-gradient-to-br from-cyan-400/18 via-emerald-400/14 to-indigo-400/18"
      />
      <StatCard
        icon={<Timer className="w-4 h-4" />}
        title="Bulan Ini"
        value={stats.month}
        subtitle="Total sepanjang bulan berjalan"
        gradient="bg-gradient-to-br from-fuchsia-400/18 via-violet-400/14 to-cyan-400/18"
      />
    </div>
  );
}
