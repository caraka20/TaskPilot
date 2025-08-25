import {useEffect, useMemo, useState} from "react";
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

  async function refresh(p: Period = period) {
    setLoading(true);
    try {
      const s = await getGajiSummary(api, { period: p });
      setTotalGaji(s.totalGaji ?? 0);
      setTotalDibayar(s.totalDibayar ?? 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(period); }, [period]);

  const titleByPeriod: Record<Period, string> = {
    total: "TOTAL GAJI (KESELURUHAN)",
    bulan: "TOTAL GAJI (BULAN INI)",
    minggu: "TOTAL GAJI (MINGGU INI)",
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 ${className ?? ""}`}>
      <Card className="relative overflow-hidden border bg-gradient-to-br from-background to-default-100">
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-2xl" />
        <CardBody className="gap-2">
          <div className="flex items-start justify-between">
            <div className="text-[13px] leading-5 tracking-wide text-foreground-500">
              {titleByPeriod[period]}
            </div>

            <div role="tablist" aria-label="Periode ringkasan gaji" className="inline-flex rounded-full bg-default-100 p-1 shadow-inner">
              {(["total", "bulan", "minggu"] as Period[]).map((p) => {
                const active = p === period;
                return (
                  <button
                    key={p}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1 text-[12px] rounded-full transition
                      ${active ? "bg-primary text-primary-foreground shadow" : "text-foreground-500 hover:bg-default-200"}`}
                  >
                    {p === "total" ? "Total" : p === "bulan" ? "Bulan" : "Minggu"}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`mt-2 text-5xl font-semibold tabular-nums ${loading ? "opacity-60" : ""}`}>
            {currencyIDR.format(totalGaji)}
          </div>
          <p className="text-foreground-400 text-sm">Agregat seluruh user</p>
        </CardBody>
      </Card>

      <Card className="border bg-gradient-to-br from-green-50 to-green-100/40 dark:from-green-900/20 dark:to-green-900/10">
        <CardBody className="gap-2">
          <div className="text-[13px] leading-5 tracking-wide text-green-800 dark:text-green-300">
            SUDAH DIBAYAR
          </div>
          <div className={`mt-2 text-5xl font-semibold tabular-nums text-green-700 dark:text-green-400 ${loading ? "opacity-60" : ""}`}>
            {currencyIDR.format(totalDibayar)}
          </div>
          <p className="text-green-700/80 dark:text-green-300/80 text-sm">Pembayaran yang telah direalisasi</p>
        </CardBody>
      </Card>

      <Card className="border bg-gradient-to-br from-yellow-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/10">
        <CardBody className="gap-2">
          <div className="text-[13px] leading-5 tracking-wide text-amber-800 dark:text-amber-300">
            BELUM DIBAYAR
          </div>
          <div className={`mt-2 text-5xl font-semibold tabular-nums text-amber-700 dark:text-amber-400 ${loading ? "opacity-60" : ""}`}>
            {currencyIDR.format(belumDibayar)}
          </div>
          <p className="text-amber-700/80 dark:text-amber-300/80 text-sm">Sisa yang perlu dibayarkan</p>
        </CardBody>
      </Card>
    </div>
  );
}
