import { useId } from "react";
import { Button } from "@heroui/react";
import OperationalModal from "../../../components/common/OperationalModal";
import KarilForm from "./KarilForm";
import type { KarilDetail as KarilDetailType, UpsertKarilPayload } from "../../../services/karil.service";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  label: string;
  saving: boolean;
  initial: KarilDetailType | null;
  onSubmit: (payload: UpsertKarilPayload) => Promise<void>;
};

export default function KarilUpsertModal({
  open, onOpenChange, label, saving, initial, onSubmit,
}: Props) {
  const generatedId = useId();
  const formId = `academic-detail-${generatedId.replace(/:/g, "")}`;

  return (
    <OperationalModal
      isOpen={open}
      onOpenChange={onOpenChange}
      isDismissable={!saving}
      title={`Kelola ${label}`}
      description={`Perbarui judul, checklist tugas, dan keterangan ${label} untuk customer ini.`}
      footer={
        <>
          <Button className="min-h-11 w-full font-semibold sm:w-auto" variant="flat" onPress={() => onOpenChange(false)} isDisabled={saving}>
            Batal
          </Button>
          <Button
            className="min-h-11 w-full font-bold sm:w-auto"
            color="primary"
            form={formId}
            type="submit"
            isLoading={saving}
            isDisabled={saving}
          >
            Simpan {label}
          </Button>
        </>
      }
    >
      <div className="mx-auto w-full max-w-6xl rounded-[24px] bg-content1 p-4 shadow-sm ring-1 ring-default-200/60 sm:p-6">
        <KarilForm
          formId={formId}
          hideActions
          initial={initial}
          label={label}
          onSubmit={onSubmit}
          busy={saving}
        />
      </div>
    </OperationalModal>
  );
}
