import { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import type { CreatePayload } from "../OwnerGajiTable";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreatePayload) => Promise<void> | void;
};

export default function OwnerGajiCreateModal({ open, onClose, onSubmit }: Props) {
  const [username, setUsername] = useState("");
  const [jumlah, setJumlah] = useState<string>("");
  const [catatan, setCatatan] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setUsername("");
      setJumlah("");
      setCatatan("");
    }
  }, [open]);

  function validate(): string | null {
    if (!username.trim()) return "Username wajib diisi.";
    const val = Number(jumlah);
    if (!jumlah || Number.isNaN(val) || val <= 0) return "Jumlah bayar harus lebih dari 0.";
    return null;
  }

  async function handleSave() {
    const msg = validate();
    if (msg) return; // biar alert cuma dari parent
    setSaving(true);
    try {
      await onSubmit({
        username: username.trim(),
        jumlahBayar: Number(jumlah),
        catatan: catatan.trim() ? catatan.trim() : null,
      });
      // sukses → parent akan menutup modal
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
        <ModalHeader>Tambah Pembayaran</ModalHeader>
        <ModalBody className="gap-3">
          <Input
            label="Username"
            labelPlacement="outside"
            placeholder="mis. raka20"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-label="Username"
          />
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
          <Button color="success" isLoading={saving} onPress={() => void handleSave()}>
            Simpan
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
