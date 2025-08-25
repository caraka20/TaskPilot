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

  useEffect(() => {
    if (open) {
      setJumlah(initialJumlah != null ? String(initialJumlah) : "");
      setCatatan(initialCatatan ?? "");
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
    if (msg) return;
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
      isDismissable={false}
      hideCloseButton
    >
      <ModalContent>
        <ModalHeader>Edit Pembayaran</ModalHeader>
        <ModalBody className="gap-3">
          <Input
            label="Jumlah Bayar"
            labelPlacement="outside"
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={jumlah}
            onChange={(e) => setJumlah(e.target.value)}
            aria-label="Jumlah bayar"
          />
          <Input
            label="Catatan"
            labelPlacement="outside"
            placeholder="opsional"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            aria-label="Catatan"
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose} isDisabled={saving}>Batal</Button>
          <Button color="primary" isLoading={saving} onPress={() => void handleSave()}>
            Simpan Perubahan
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
