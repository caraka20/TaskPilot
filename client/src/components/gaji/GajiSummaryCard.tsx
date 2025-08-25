import { Card, CardHeader, CardBody, Spinner } from "@heroui/react";
import { Wallet, TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";
import { currencyIDR } from "../../utils/format";
import MoneyPill from "./MoneyPill";

type Props = {
  upahKeseluruhan: number;
  totalDiterima: number;
  belumDibayar: number;
  loading?: boolean;
};

export default function GajiSummaryCard({
  upahKeseluruhan,
  totalDiterima,
  belumDibayar,
  loading = false,
}: Props) {
  return (
    <Card className="lg:col-span-5 border border-default-100">
      <CardHeader className="flex items-center gap-3">
        <div className="grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-b from-indigo-50 to-indigo-100">
          <Wallet className="w-6 h-6 text-indigo-600" />
        </div>
        <div className="flex-1">
          <div className="text-2xl font-extrabold tracking-tight">Gaji Saya</div>
          <div className="text-foreground-500">Ringkasan pembayaran milik Anda</div>
        </div>
      </CardHeader>

      <CardBody className="gap-4">
        <div className="flex flex-col gap-3">
          {/* Upah keseluruhan */}
          <div className="rounded-2xl border p-4">
            <div className="flex items-center gap-2 text-foreground-500">
              <TrendingUp className="w-4 h-4" />
              <span>Upah Keseluruhan</span>
            </div>
            <div className="mt-2 text-3xl font-extrabold tracking-tight">
              {currencyIDR.format(upahKeseluruhan || 0)}
            </div>
            <div className="text-xs text-foreground-400 mt-1">Akumulasi upah dari jam kerja</div>
          </div>

          {/* Total diterima */}
          <div className="rounded-2xl border p-4">
            <div className="flex items-center gap-2 text-foreground-500">
              <CheckCircle2 className="w-4 h-4" />
              <span>Total Diterima</span>
            </div>
            <div className="mt-2">
              <MoneyPill value={totalDiterima || 0} tone="success" />
            </div>
            <div className="text-xs text-foreground-400 mt-1">Seluruh periode</div>
          </div>

          {/* Belum dibayar */}
          <div className="rounded-2xl border p-4">
            <div className="flex items-center gap-2 text-foreground-500">
              <AlertTriangle className="w-4 h-4" />
              <span>Belum Dibayar</span>
            </div>
            <div className="mt-2">
              <MoneyPill value={belumDibayar || 0} tone="warning" />
            </div>
            <div className="text-xs text-foreground-400 mt-1">Perkiraan sisa</div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-foreground-400">
            <Spinner size="sm" color="primary" /> Memuat ringkasan…
          </div>
        )}
      </CardBody>
    </Card>
  );
}
