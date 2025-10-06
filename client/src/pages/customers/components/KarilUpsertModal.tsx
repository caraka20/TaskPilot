import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import KarilForm from "./KarilForm";
import type { KarilDetail as KarilDetailType, UpsertKarilPayload } from "../../../services/karil.service";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  label: "KARIL" | "TK";
  saving: boolean;
  initial: KarilDetailType | null;
  onSubmit: (payload: UpsertKarilPayload) => Promise<void>;
};

export default function KarilUpsertModal({
  open, onOpenChange, label, saving, initial, onSubmit,
}: Props) {
  // ❗️Tidak pakai key dinamis sama sekali — biar tidak remount tiap render
  return (
    <Modal isOpen={open} onOpenChange={onOpenChange} size="2xl" placement="center">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <span className="text-indigo-600 font-semibold">Kelola / Upsert {label}</span>
              <span className="text-xs text-foreground-500">
                Perbarui judul, checklist tugas, dan keterangan {label} untuk customer ini.
              </span>
            </ModalHeader>
            <ModalBody>
              <KarilForm initial={initial} onSubmit={onSubmit} busy={saving} />
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose} isDisabled={saving}>
                Tutup
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
