import { useMemo, useState } from "react";
import { Card, CardBody, Chip, Progress, Tabs, Tab } from "@heroui/react";
import { Wallet, CircleDollarSign } from "lucide-react";
import type { OwnerUserSummary } from "../../../services/jamKerja.service";
import { formatRupiah } from "../../../utils/format";

type PeriodKey = "hari" | "minggu" | "bulan" | "semua";

function Box({
  title,
  value,
  subtitle,
  accent = "brand",
  right,
}: {
  title: string;
  value: string;
  subtitle?: string;
  accent?: "brand" | "success" | "warning";
  right?: React.ReactNode;
}) {
  const tone = {
    brand: "border-indigo-200/70 bg-indigo-50/65 text-indigo-950 dark:border-indigo-400/15 dark:bg-indigo-400/10 dark:text-indigo-100",
    success: "border-emerald-200/70 bg-emerald-50/65 text-emerald-950 dark:border-emerald-400/15 dark:bg-emerald-400/10 dark:text-emerald-100",
    warning: "border-amber-200/80 bg-amber-50/75 text-amber-950 dark:border-amber-400/15 dark:bg-amber-400/10 dark:text-amber-100",
  }[accent];

  return (
    <Card shadow="none" className={`relative overflow-hidden rounded-2xl border ${tone}`}>
      <span
        className={`absolute inset-y-0 left-0 w-1 ${accent === "success" ? "bg-emerald-500" : accent === "warning" ? "bg-amber-500" : "bg-indigo-500"}`}
        aria-hidden="true"
      />
      <CardBody className="gap-2 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm font-medium text-foreground-500">{title}</div>
          {right}
        </div>
        <div className="break-words text-2xl font-bold leading-tight tracking-tight tabular-nums sm:text-3xl">
          {value}
        </div>
        {subtitle && <div className="text-xs leading-5 text-foreground-400">{subtitle}</div>}
      </CardBody>
    </Card>
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
    <Card className="overflow-hidden rounded-3xl border border-indigo-100/80 bg-content1 shadow-[0_20px_55px_-38px_rgba(79,70,229,.45)] dark:border-indigo-400/15">
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-400" aria-hidden="true" />
      <CardBody className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <Chip
              variant="flat"
              size="sm"
              startContent={<Wallet className="w-3.5 h-3.5" />}
            >
              Gaji {namaLengkap ?? username}
            </Chip>
            <div>
              <h2 className="font-semibold text-foreground">Ringkasan Gaji</h2>
              <p className="mt-0.5 text-sm text-foreground-500">Perhitungan upah dan pembayaran milik user ini.</p>
            </div>
          </div>

          <Tabs
            size="sm"
            aria-label="Pilih periode"
            selectedKey={period}
            onSelectionChange={(k) => setPeriod(k as PeriodKey)}
            classNames={{
              tabList:
                "w-full overflow-x-auto bg-content2 p-1 rounded-xl border border-default-200/70 sm:w-auto",
              cursor: "rounded-lg",
              tab: "min-h-10 px-3",
            }}
          >
            <Tab key="hari" title="Hari ini" />
            <Tab key="minggu" title="Minggu ini" />
            <Tab key="bulan" title="Bulan ini" />
            <Tab key="semua" title="Semua" />
          </Tabs>
        </div>

        {/* Cards */}
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Box
            title="Upah Keseluruhan"
            value={formatRupiah(cur?.totalGaji ?? 0)}
            subtitle="Akumulasi upah dari jam kerja"
            accent="brand"
            right={<CircleDollarSign className="w-5 h-5 text-indigo-500 dark:text-indigo-300" />}
          />
          <Box
            title="Total Diterima"
            value={formatRupiah(totalDiterima)}
            subtitle="Seluruh periode"
            accent="success"
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
              indicator: "rounded-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-400",
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
