// client/src/pages/customers/CustomerDetail.tsx
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import CustomerHeaderBar from "./components/CustomerHeaderBar";
import CustomerTutonSection from "./components/CustomerTutonSection";
import OwnerBillingPanels from "./components/OwnerBillingPanels";
import KarilUpsertModal from "./components/KarilUpsertModal";
import CustomerDetailCard from "./components/CustomerDetailCard";
import KarilDetailSection from "./components/KarilDetailSection";

import LoadingScreen from "./components/LoadingScreen";
import InvalidIdCard from "./components/InvalidIdCard";
import NotFoundCard from "./components/NotFoundCard";

import { useCustomerDetail } from "./hooks/useCustomerDetail";

// ===== Wrapper: cek ID dulu (tanpa hook) =====
export default function CustomerDetail() {
  const { id } = useParams();
  const idNum = useMemo(() => Number(id), [id]);

  if (!Number.isFinite(idNum)) {
    return <InvalidIdCard />;
  }

  return <CustomerDetailInner idNum={idNum} />;
}

// ===== Inner: semua hook dipanggil di sini, TIDAK conditional =====
function CustomerDetailInner({ idNum }: { idNum: number }) {
  const [openKarilModal, setOpenKarilModal] = useState(false);

  const {
    loading,
    data,
    summary,
    karil,
    savingKaril,
    isOwner,

    // derived flags
    jenisNormalized,
    isKarilLike,
    karilLabel,
    showTutonMatrix,
    singleCourseId,

    // actions
    addPayment,
    saveKaril,
    refresh,
  } = useCustomerDetail(idNum);

  if (loading) return <LoadingScreen label="Memuat detail customer..." />;
  if (!data) return <NotFoundCard />;

  return (
    // Full width, tanpa max-w; pakai token warna supaya otomatis dark mode
    <div className="w-full text-foreground py-2 md:py-4">
      <CustomerHeaderBar
        data={data}
        jenisNormalized={jenisNormalized}
        isKarilLike={isKarilLike}
        karilLabel={karilLabel}
        showTutonMatrix={showTutonMatrix}
        singleCourseId={singleCourseId}
      />

      <div className="mt-4">
      <CustomerDetailCard
        data={data}
        password={(data as any).password}
        showBilling={isOwner}
        onUpdated={refresh}           // ⬅️ tambahkan ini
      />

        <CustomerTutonSection
          show={showTutonMatrix}
          summary={summary}
          customerId={idNum}
          onChanged={refresh}
        />

        <KarilDetailSection
          karil={karil}
          isKaril={isKarilLike}
          isOwner={true}
          onManage={() => setOpenKarilModal(true)}
          label={karilLabel}
        />
      </div>

      {isOwner && (
        <OwnerBillingPanels customerId={idNum} onAddPayment={addPayment} />
      )}

      {(karil || isKarilLike) && (
        <KarilUpsertModal
          open={openKarilModal}
          onOpenChange={setOpenKarilModal}
          label={karilLabel}
          saving={savingKaril}
          initial={karil}
          onSubmit={saveKaril}
        />
      )}
    </div>
  );
}
