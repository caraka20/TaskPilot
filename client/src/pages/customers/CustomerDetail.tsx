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

export default function CustomerDetail() {
  const { id } = useParams();
  const idNum = useMemo(() => Number(id), [id]);
  if (!Number.isFinite(idNum)) return <InvalidIdCard />;
  return <CustomerDetailInner idNum={idNum} />;
}

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

        <CustomerDetailCard
          data={data}
          password={(data as any).password}
          showBilling={isOwner}
          onUpdated={refresh}
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
          initial={karil ?? null}
          onSubmit={async (payload) => {
            await saveKaril(payload);
            // kalau mau langsung tutup: setOpenKarilModal(false);
          }}
        />
      )}
    </div>
  );
}
