import {useCallback, useEffect, useMemo, useState} from "react";
import {Card, CardBody} from "@heroui/react";
import {useApi} from "../../hooks/useApi";
import {currencyIDR} from "../../utils/format";
import {getGajiSummary} from "../../services/gaji.service";

type Period = "total" | "bulan" | "minggu";

type Props = {
  defaultPeriod?: Period;
  className?: string;
};

export default function OwnerPayrollCards({ defaultPeriod = "total", className }: Props) {
  const api = useApi();

  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const [loading, setLoading] = useState(false);

  const [totalGaji, setTotalGaji] = useState(0);
  const [totalDibayar, setTotalDibayar] = useState(0);
  const belumDibayar = useMemo(
    () => Math.max(0, totalGaji - totalDibayar),
    [totalGaji, totalDibayar]
  );

  const refresh = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const s = await getGajiSummary(api, { period: p });
      setTotalGaji(s.totalGaji ?? 0);
      setTotalDibayar(s.totalDibayar ?? 0);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { void refresh(period); }, [period, refresh]);

  const titleByPeriod: Record<Period, string> = {
    total: "TOTAL GAJI (KESELURUHAN)",
    bulan: "TOTAL GAJI (BULAN INI)",
    minggu: "TOTAL GAJI (MINGGU INI)",
  };

  return (
    <section
      aria-label="Ringkasan penggajian"
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 ${className ?? ""}`}
    >
      <Card className="relative overflow-hidden border border-default-200 bg-gradient-to-br from-background to-default-100 sm:col-span-2 xl:col-span-1">
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-2xl" />
        <CardBody className="gap-3 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="text-xs font-medium leading-5 tracking-wide text-foreground-500 sm:text-[13px]">
              {titleByPeriod[period]}
            </div>

            <div
              role="tablist"
              aria-label="Periode ringkasan gaji"
              className="grid w-full grid-cols-3 rounded-xl bg-default-100 p-1 shadow-inner sm:w-auto sm:min-w-[226px]"
            >
              {(["total", "bulan", "minggu"] as Period[]).map((p) => {
                const active = p === period;
                return (
                  <button
                    key={p}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setPeriod(p)}
                    className={`min-h-10 rounded-lg px-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                      ${active ? "bg-primary text-primary-foreground shadow" : "text-foreground-500 hover:bg-default-200"}`}
                  >
                    {p === "total" ? "Total" : p === "bulan" ? "Bulan" : "Minggu"}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`min-w-0 break-words text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl ${loading ? "opacity-60" : ""}`}>
            {currencyIDR.format(totalGaji)}
          </div>
          <p className="text-foreground-400 text-sm">Agregat seluruh user</p>
        </CardBody>
      </Card>

      <Card className="border border-green-200/70 bg-gradient-to-br from-green-50 to-green-100/40 dark:border-green-900/60 dark:from-green-900/20 dark:to-green-900/10">
        <CardBody className="gap-2 p-4 sm:p-5">
          <div className="text-[13px] leading-5 tracking-wide text-green-800 dark:text-green-300">
            SUDAH DIBAYAR
          </div>
          <div className={`mt-2 min-w-0 break-words text-3xl font-semibold tracking-tight tabular-nums text-green-700 dark:text-green-400 sm:text-4xl ${loading ? "opacity-60" : ""}`}>
            {currencyIDR.format(totalDibayar)}
          </div>
          <p className="text-green-700/80 dark:text-green-300/80 text-sm">Pembayaran yang telah direalisasi</p>
        </CardBody>
      </Card>

      <Card className="border border-amber-200/70 bg-gradient-to-br from-yellow-50 to-amber-100/50 dark:border-amber-900/60 dark:from-amber-900/20 dark:to-amber-900/10">
        <CardBody className="gap-2 p-4 sm:p-5">
          <div className="text-[13px] leading-5 tracking-wide text-amber-800 dark:text-amber-300">
            BELUM DIBAYAR
          </div>
          <div className={`mt-2 min-w-0 break-words text-3xl font-semibold tracking-tight tabular-nums text-amber-700 dark:text-amber-400 sm:text-4xl ${loading ? "opacity-60" : ""}`}>
            {currencyIDR.format(belumDibayar)}
          </div>
          <p className="text-amber-700/80 dark:text-amber-300/80 text-sm">Sisa yang perlu dibayarkan</p>
        </CardBody>
      </Card>
    </section>
  );
}
