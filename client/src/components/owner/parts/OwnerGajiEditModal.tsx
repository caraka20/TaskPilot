import { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import type { EditPayload } from "../OwnerGajiTable";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: EditPayload) => Promise<void> | void;
  initialJumlah?: number;
  initialCatatan?: string;
};

export default function OwnerGajiEditModal({ open, onClose, onSubmit, initialJumlah, initialCatatan }: Props) {
  const [jumlah, setJumlah] = useState<string>("");
  const [catatan, setCatatan] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setJumlah(initialJumlah != null ? String(initialJumlah) : "");
      setCatatan(initialCatatan ?? "");
      setValidationError(null);
    }
  }, [open, initialJumlah, initialCatatan]);

  function validate(): string | null {
    const hasJumlah = jumlah.trim().length > 0;
    const hasCatatan = catatan.trim().length > 0;
    if (!hasJumlah && !hasCatatan) return "Isi salah satu: Jumlah Bayar atau Catatan.";
    if (hasJumlah) {
      const val = Number(jumlah);
      if (Number.isNaN(val) || val <= 0) return "Jumlah bayar harus lebih dari 0.";
    }
    return null;
  }

  async function handleSave() {
    const msg = validate();
    if (msg) {
      setValidationError(msg);
      return;
    }
    setValidationError(null);
    setSaving(true);
    try {
      await onSubmit({
        jumlahBayar: jumlah ? Number(jumlah) : undefined,
        catatan: catatan.trim() ? catatan.trim() : undefined,
      });
      // sukses → parent yang menutup modal
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      backdrop="blur"
      size="md"
      placement="center"
      scrollBehavior="inside"
      isDismissable={false}
      hideCloseButton
    >
      <ModalContent className="mx-3 max-h-[calc(100dvh-1.5rem)] sm:mx-0">
        <ModalHeader className="px-4 pb-2 pt-5 text-xl font-semibold sm:px-6 sm:pt-6">
          Edit Pembayaran
        </ModalHeader>
        <ModalBody className="gap-4 px-4 sm:px-6">
          {validationError && (
            <div role="alert" className="rounded-xl border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
              {validationError}
            </div>
          )}
          <Input
            label="Jumlah Bayar"
            labelPlacement="outside"
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={jumlah}
            onChange={(e) => setJumlah(e.target.value)}
            aria-label="Jumlah bayar"
            classNames={{ inputWrapper: "min-h-12" }}
          />
          <Input
            label="Catatan"
            labelPlacement="outside"
            placeholder="opsional"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            aria-label="Catatan"
            classNames={{ inputWrapper: "min-h-12" }}
          />
        </ModalBody>
        <ModalFooter className="grid grid-cols-2 gap-2 px-4 pb-5 pt-4 sm:flex sm:px-6 sm:pb-6">
          <Button variant="flat" onPress={onClose} isDisabled={saving} className="min-h-11">Batal</Button>
          <Button color="primary" isLoading={saving} onPress={() => void handleSave()} className="min-h-11">
            Simpan Perubahan
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
