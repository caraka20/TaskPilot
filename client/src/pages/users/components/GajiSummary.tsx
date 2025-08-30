import { useMemo, useState } from "react";
import { Card, CardBody, Chip, Progress, Tabs, Tab } from "@heroui/react";
import { Wallet, CircleDollarSign } from "lucide-react";
import type { OwnerUserSummary } from "../../../services/jamKerja.service";
import { formatRupiah } from "../../../utils/format";

type PeriodKey = "hari" | "minggu" | "bulan" | "semua";

/** ---- Kartu kecil glam dengan aura gradient ---- */
function Box({
  title,
  value,
  subtitle,
  accent = "default",
  right,
}: {
  title: string;
  value: string;
  subtitle?: string;
  accent?: "default" | "warning";
  right?: React.ReactNode;
}) {
  // pilih skema warna dari accent (tanpa ubah API)
  const aura =
    accent === "warning"
      ? "from-amber-400/20 via-orange-400/15 to-pink-400/20"
      : "from-indigo-400/20 via-fuchsia-400/15 to-emerald-400/20";

  const numberCls =
    accent === "warning"
      ? "text-amber-500"
      : "text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-500";

  return (
    <div className="relative group">
      {/* aura blur */}
      <div
        className={`absolute -inset-2 rounded-3xl blur-2xl opacity-70 group-hover:opacity-90 transition-opacity bg-gradient-to-br ${aura}`}
      />
      {/* hairline wrapper */}
      <div className="rounded-[22px] p-[1.5px] bg-gradient-to-r from-white/10 to-white/10">
        <Card
          shadow="sm"
          className="rounded-[20px] border border-default-200/70 bg-background/90 backdrop-blur-sm"
        >
          <CardBody className="p-4 sm:p-5 gap-1">
            <div className="flex items-start justify-between">
              <div className="text-foreground-500 text-sm">{title}</div>
              {right}
            </div>
            <div
              className={[
                "leading-none tracking-tight",
                // ukuran nyaman di Full HD
                "text-3xl md:text-4xl xl:text-5xl font-extrabold",
                numberCls,
              ].join(" ")}
            >
              {value}
            </div>
            {subtitle && (
              <div className="text-foreground-400 text-xs mt-1">{subtitle}</div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default function GajiSummary({
  username,
  namaLengkap,
  summary,
  totalDiterima = 0,
}: {
  username: string;
  namaLengkap?: string;
  summary?: OwnerUserSummary | null;
  /** jika punya catatan pembayaran, isi jumlahnya ke sini (opsional) */
  totalDiterima?: number;
}) {
  const [period, setPeriod] = useState<PeriodKey>("bulan"); // default: Bulan ini

  const totals = summary?.totals;
  const cur = useMemo(() => {
    if (!totals) return { totalJam: 0, totalGaji: 0 };
    return totals[period];
  }, [totals, period]);

  const belum = Math.max(0, Math.round((cur?.totalGaji ?? 0) - totalDiterima));
  const progress =
    (cur?.totalGaji ?? 0) > 0 ? (totalDiterima / (cur?.totalGaji ?? 1)) * 100 : 0;

  return (
    <Card className="border border-default-200/70 bg-background/90 backdrop-blur-sm">
      <CardBody className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Chip
              variant="flat"
              size="sm"
              startContent={<Wallet className="w-3.5 h-3.5" />}
            >
              Gaji {namaLengkap ?? username}
            </Chip>
            <span className="text-foreground-500 text-sm">
              Ringkasan pembayaran milik karyawan ini
            </span>
          </div>

          <Tabs
            size="sm"
            aria-label="Pilih periode"
            selectedKey={period}
            onSelectionChange={(k) => setPeriod(k as PeriodKey)}
            classNames={{
              tabList:
                "bg-content2 p-1 rounded-full border border-default-200/70 shadow-inner",
              cursor: "rounded-full",
              tab: "px-3",
            }}
          >
            <Tab key="hari" title="Hari ini" />
            <Tab key="minggu" title="Minggu ini" />
            <Tab key="bulan" title="Bulan ini" />
            <Tab key="semua" title="Semua" />
          </Tabs>
        </div>

        {/* Cards */}
        <div className="mt-4 grid gap-4 xl:gap-5 md:grid-cols-3">
          <Box
            title="Upah Keseluruhan"
            value={formatRupiah(cur?.totalGaji ?? 0)}
            subtitle="Akumulasi upah dari jam kerja"
            right={<CircleDollarSign className="w-5 h-5 text-foreground-400" />}
          />
          <Box
            title="Total Diterima"
            value={formatRupiah(totalDiterima)}
            subtitle="Seluruh periode"
          />
          <Box
            title="Belum Dibayar"
            value={formatRupiah(belum)}
            subtitle="Perkiraan sisa"
            accent="warning"
          />
        </div>

        {/* Progress */}
        <div className="mt-5">
          <Progress
            size="sm"
            value={progress}
            classNames={{
              base: "max-w-full h-3 rounded-full",
              track: "bg-content2 rounded-full",
              indicator:
                "rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400",
            }}
          />
          <div className="flex justify-between text-xs text-foreground-400 mt-1">
            <span>Diterima</span>
            <span>
              {formatRupiah(totalDiterima)} / {formatRupiah(cur?.totalGaji ?? 0)}
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
