import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CircleCheckBig, Clock3, CreditCard } from "lucide-react";

import CustomerHeaderBar from "./components/CustomerHeaderBar";
import CustomerTutonSection from "./components/CustomerTutonSection";
import OwnerBillingPanels from "./components/OwnerBillingPanels";
import KarilUpsertModal from "./components/KarilUpsertModal";
import KarilDetailSection from "./components/KarilDetailSection";

import LoadingScreen from "./components/LoadingScreen";
import InvalidIdCard from "./components/InvalidIdCard";
import NotFoundCard from "./components/NotFoundCard";

import { useCustomerDetail } from "./hooks/useCustomerDetail";
import { fmtRp } from "../../utils/customer";

function BillingSummary({ total, paid, remaining }: { total: number; paid: number; remaining: number }) {
  const progress = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  return (
    <div className="grid overflow-hidden rounded-[18px] border border-slate-200/80 bg-white sm:grid-cols-2 lg:grid-cols-[1.2fr_.85fr_.85fr_1fr] dark:border-slate-800 dark:bg-slate-900">
      <div className="relative flex min-w-0 items-center justify-between gap-4 bg-[linear-gradient(125deg,#123653,#12616a)] px-4 py-4 text-white sm:px-5">
        <div aria-hidden="true" className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-cyan-300/10 blur-2xl" />
        <div className="relative min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-cyan-100/75">Sisa tagihan</p>
          <p className={`mt-1 truncate text-xl font-black tracking-tight sm:text-2xl ${remaining <= 0 ? "text-emerald-300" : "text-white"}`}>
            {remaining <= 0 ? "Lunas" : fmtRp(remaining)}
          </p>
        </div>
        <span className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ${remaining <= 0 ? "bg-emerald-300/15 text-emerald-200 ring-emerald-200/20" : "bg-amber-300/15 text-amber-200 ring-amber-200/20"}`}>
          {remaining <= 0 ? <CircleCheckBig className="h-[18px] w-[18px]" /> : <Clock3 className="h-[18px] w-[18px]" />}
        </span>
      </div>

      <div className="min-w-0 border-t border-slate-200/70 px-4 py-4 sm:border-l sm:border-t-0 dark:border-slate-800">
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">Nilai layanan</p>
        <p className="mt-1.5 truncate text-base font-black tracking-tight text-slate-950 dark:text-white">{fmtRp(total)}</p>
        <p className="mt-1 text-[10px] text-slate-400">Total kontrak</p>
      </div>

      <div className="min-w-0 border-t border-slate-200/70 px-4 py-4 sm:border-l lg:border-t-0 dark:border-slate-800">
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-600/80 dark:text-emerald-300">Telah diterima</p>
        <p className="mt-1.5 truncate text-base font-black tracking-tight text-emerald-700 dark:text-emerald-300">{fmtRp(paid)}</p>
        <p className="mt-1 text-[10px] text-slate-400">Transaksi masuk</p>
      </div>

      <div className="border-t border-slate-200/70 px-4 py-4 sm:border-l lg:border-t-0 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">Progres pembayaran</p>
          <span className="text-sm font-black tabular-nums text-[#176b68] dark:text-teal-300">{progress}%</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-label={`Pembayaran ${progress}%`}>
          <div className="h-full rounded-full bg-gradient-to-r from-sky-600 to-emerald-500 transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-[10px] text-slate-400">{remaining <= 0 ? "Pembayaran selesai" : "Masih dalam proses"}</p>
      </div>
    </div>
  );
}

export default function CustomerDetail() {
  const { id } = useParams();
  const idNum = useMemo(() => Number(id), [id]);
  if (!Number.isFinite(idNum)) return <InvalidIdCard />;
  return <CustomerDetailInner idNum={idNum} />;
}

function CustomerDetailInner({ idNum }: { idNum: number }) {
  const [openKarilModal, setOpenKarilModal] = useState(false);
  const [openMetodeModal, setOpenMetodeModal] = useState(false);

  const {
    loading,
    data,
    summary,
    karil,
    metodePenelitian,
    savingKaril,
    savingMetodePenelitian,
    isOwner,

    // derived flags
    jenisNormalized,
    isKarilLike,
    isMetodePenelitian,
    karilLabel,
    showTutonMatrix,
    singleCourseId,

    // actions
    addPayment,
    settlePayment,
    updateInvoice,
    saveKaril,
    saveMetodePenelitian,
    refresh,
  } = useCustomerDetail(idNum);

  if (loading) return <LoadingScreen label="Memuat detail customer..." />;
  if (!data) return <NotFoundCard />;

  // `billingVisible` berasal dari permission database pada setiap request.
  // USER yang diizinkan mendapatkan tampilan dan kontrol pembayaran yang sama,
  // sedangkan USER tanpa izin tidak menerima nominal dari backend.
  const canManageBilling = isOwner || data.billingVisible !== false;
  const canViewBilling = canManageBilling;
  const totalBilling = Number(data.totalBayar ?? 0);
  const paidBilling = Number(data.sudahBayar ?? 0);
  const remainingBilling = Number(data.sisaBayar ?? Math.max(totalBilling - paidBilling, 0));
  return (
    <div data-customer-detail className="w-full text-foreground">
      <CustomerHeaderBar
        data={data}
        password={(data as any).password}
        jenisNormalized={jenisNormalized}
        isKarilLike={isKarilLike}
        karilLabel={karilLabel}
        showTutonMatrix={showTutonMatrix}
        singleCourseId={singleCourseId}
        onUpdated={refresh}
      />

      <div className="mt-3 space-y-3">
        <div data-customer-panel data-customer-step="1" className="space-y-3">
          <CustomerTutonSection
            show={showTutonMatrix}
            summary={summary}
            customerId={idNum}
            onChanged={refresh}
          />

          <KarilDetailSection
            karil={karil}
            isKaril={isKarilLike}
            canManage={isKarilLike}
            onManage={() => setOpenKarilModal(true)}
            label={karilLabel}
          />

          <KarilDetailSection
            karil={metodePenelitian}
            isKaril={isMetodePenelitian}
            canManage={isMetodePenelitian}
            onManage={() => setOpenMetodeModal(true)}
            label="METODE PENELITIAN"
          />

          {!showTutonMatrix && !isKarilLike && !isMetodePenelitian && (
            <div className="rounded-[22px] border border-dashed border-default-200 bg-content1 px-5 py-10 text-center text-sm text-foreground-500">
              Belum ada layanan akademik yang dipilih untuk customer ini.
            </div>
          )}
        </div>

        {canViewBilling && (
          <div data-customer-panel data-customer-step="2">
            <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/95 shadow-[0_16px_42px_-32px_rgba(15,23,42,.42)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95" aria-labelledby="customer-billing-title">
              <header className="flex flex-col gap-3 border-b border-slate-200/70 bg-[linear-gradient(110deg,rgba(248,250,252,.96),rgba(240,253,250,.76))] px-4 py-4 dark:border-slate-800 dark:bg-[linear-gradient(110deg,rgba(15,23,42,.96),rgba(13,54,58,.4))] sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/15">
                    <CreditCard className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.17em] text-amber-700/75 dark:text-amber-300">Bagian 03</p>
                    <h2 id="customer-billing-title" className="mt-0.5 text-base font-black tracking-tight text-slate-950 dark:text-white sm:text-lg">
                      Tagihan &amp; pembayaran
                    </h2>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      Catat pembayaran, lakukan pelunasan, dan telusuri seluruh transaksi customer.
                    </p>
                  </div>
                </div>
                <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold ring-1 ${remainingBilling <= 0 ? "bg-emerald-50 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20" : "bg-amber-50 text-amber-700 ring-amber-200/70 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20"}`}>
                  <span className={`h-2 w-2 rounded-full ${remainingBilling <= 0 ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {remainingBilling <= 0 ? "Pembayaran lunas" : "Pembayaran berjalan"}
                </span>
              </header>

              <div className="space-y-3 p-4 sm:p-5">
                <BillingSummary total={totalBilling} paid={paidBilling} remaining={remainingBilling} />
                {canManageBilling ? (
                  <OwnerBillingPanels
                    customerId={idNum}
                    onAddPayment={addPayment}
                    remaining={remainingBilling}
                    total={totalBilling}
                    onSettle={settlePayment}
                    onUpdateInvoice={updateInvoice}
                  />
                ) : null}
              </div>
            </section>
          </div>
        )}
      </div>

      {(karil || isKarilLike) && (
        <KarilUpsertModal
          open={openKarilModal}
          onOpenChange={setOpenKarilModal}
          label={karilLabel}
          saving={savingKaril}
          initial={karil ?? null}
          onSubmit={async (payload) => {
            const saved = await saveKaril(payload);
            if (saved) setOpenKarilModal(false);
          }}
        />
      )}


      {(metodePenelitian || isMetodePenelitian) && (
        <KarilUpsertModal
          open={openMetodeModal}
          onOpenChange={setOpenMetodeModal}
          label="METODE PENELITIAN"
          saving={savingMetodePenelitian}
          initial={metodePenelitian ?? null}
          onSubmit={async (payload) => {
            const saved = await saveMetodePenelitian(payload);
            if (saved) setOpenMetodeModal(false);
          }}
        />
      )}
    </div>
  );
}
