// client/src/pages/customers/components/OwnerBillingPanels.tsx
import { Button } from "@heroui/react";
import { BadgeCheck, History, ReceiptText, WalletCards } from "lucide-react";
import Swal from "sweetalert2";
import PaymentsForm from "./PaymentsForm";
import PaymentsTable from "./PaymentsTable";
import UpdateInvoiceForm from "./UpdateInvoiceForm";
import { fmtRp } from "../../../utils/customer";

type Props = {
  customerId: number;
  onAddPayment: (payload: {
    amount: number;
    catatan?: string;
    tanggalBayar?: string;
  }) => Promise<void> | void;
  remaining: number;
  total: number;
  onSettle: () => Promise<void> | void;
  onUpdateInvoice: (totalBayar: number) => Promise<void> | void;
};

export default function OwnerBillingPanels({ customerId, onAddPayment, remaining, total, onSettle, onUpdateInvoice }: Props) {
  async function settle() {
    if (remaining <= 0) return;
    const result = await Swal.fire({
      icon: "question",
      title: "Lunasi tagihan customer?",
      text: `Pembayaran sebesar ${fmtRp(remaining)} akan dicatat.`,
      showCancelButton: true,
      confirmButtonText: "Ya, langsung lunas",
      cancelButtonText: "Batal",
      confirmButtonColor: "#059669",
    });
    if (result.isConfirmed) await onSettle();
  }

  return (
    <div className="space-y-3">
      <section className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        <header className="flex flex-col gap-3 border-b border-slate-200/70 bg-slate-50/55 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-950/20 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-[#1b5278] ring-1 ring-sky-100 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/15">
              <ReceiptText className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">Pengelolaan transaksi</p>
              <h3 className="mt-0.5 text-sm font-black tracking-tight text-slate-950 dark:text-white sm:text-base">Catat pembayaran</h3>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Perbarui nilai layanan atau masukkan pembayaran baru.</p>
            </div>
          </div>
          <Button
            variant={remaining <= 0 ? "flat" : "solid"}
            className={[
              "min-h-10 w-full rounded-xl px-4 font-bold shadow-none sm:w-auto",
              remaining <= 0
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                : "bg-emerald-600 text-white shadow-[0_8px_18px_-12px_rgba(5,150,105,.8)]",
            ].join(" ")}
            startContent={<BadgeCheck className="h-4 w-4" />}
            isDisabled={remaining <= 0}
            onPress={settle}
          >
            {remaining <= 0 ? "Sudah Lunas" : "Langsung Lunas"}
          </Button>
        </header>

        <div className="grid lg:grid-cols-[minmax(280px,.72fr)_minmax(0,1.28fr)]">
          <div className="border-b border-slate-200/70 p-4 lg:border-b-0 lg:border-r dark:border-slate-800 sm:p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <WalletCards className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Nilai layanan</p>
                <p className="mt-0.5 text-[10px] text-slate-400">Ubah ketika nilai kontrak berubah.</p>
              </div>
            </div>
            <UpdateInvoiceForm initialTotal={total} onSubmit={onUpdateInvoice} />
          </div>

          <div className="p-4 sm:p-5">
            <PaymentsForm onSubmit={onAddPayment} maximum={remaining} />
          </div>
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-[18px] border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        <header className="flex items-center gap-3 border-b border-slate-200/70 bg-slate-50/45 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-950/20 sm:px-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/15">
            <History className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Arus pembayaran</p>
            <h3 className="mt-0.5 text-sm font-black tracking-tight text-slate-950 dark:text-white sm:text-base">Riwayat pembayaran</h3>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Transaksi terbaru ditampilkan paling atas.</p>
          </div>
        </header>
        <div className="p-3.5 sm:p-4">
          <PaymentsTable customerId={customerId} refreshKey={`${total}:${remaining}`} />
        </div>
      </section>
    </div>
  );
}
