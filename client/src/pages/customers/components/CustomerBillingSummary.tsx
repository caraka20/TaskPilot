import { Chip } from "@heroui/react";
import {
  CheckCircle2,
  PiggyBank,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";

export type CustomerBillingTotals = {
  totalBayar: number;
  sudahBayar: number;
  sisaBayar: number;
  totalCount: number;
};

type Props = {
  loading: boolean;
  totals: CustomerBillingTotals;
};

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function BillingMetric({
  title,
  value,
  icon,
  accentFrom,
  accentTo,
  valueClass = "",
}: {
  title: string;
  value: string;
  icon: ReactNode;
  accentFrom: string;
  accentTo: string;
  valueClass?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-default-200/80 bg-content1 p-4 shadow-[0_8px_24px_rgba(15,23,42,.045)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,.07)] sm:p-5">
      <div
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentFrom} ${accentTo}`}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-foreground-400">
            {title}
          </p>
          <p
            className={`mt-2 truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl ${valueClass}`}
          >
            {value}
          </p>
        </div>

        <div
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${accentFrom} ${accentTo} text-white shadow-sm`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function CustomerBillingSummary({ loading, totals }: Props) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            Ringkasan pembayaran
          </p>
          <h2 className="mt-0.5 text-base font-bold text-foreground">
            Posisi tagihan sesuai filter aktif
          </h2>
        </div>

        <Chip size="sm" variant="flat">
          {loading ? "Menghitung…" : `${totals.totalCount} customer`}
        </Chip>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <BillingMetric
          title="Total tagihan"
          value={loading ? "…" : rupiah.format(totals.totalBayar)}
          icon={<Wallet className="h-5 w-5" />}
          accentFrom="from-indigo-500"
          accentTo="to-violet-500"
        />
        <BillingMetric
          title="Pembayaran diterima"
          value={loading ? "…" : rupiah.format(totals.sudahBayar)}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accentFrom="from-emerald-500"
          accentTo="to-teal-500"
        />
        <BillingMetric
          title="Sisa tagihan"
          value={loading ? "…" : rupiah.format(totals.sisaBayar)}
          icon={<PiggyBank className="h-5 w-5" />}
          accentFrom="from-sky-500"
          accentTo="to-cyan-500"
          valueClass={totals.sisaBayar <= 0 ? "!text-success-600" : ""}
        />
      </div>
    </section>
  );
}
