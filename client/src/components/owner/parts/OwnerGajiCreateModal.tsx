import { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import type { CreatePayload } from "../OwnerGajiTable";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreatePayload) => Promise<void> | void;
  lockedUsername?: string;
};

export default function OwnerGajiCreateModal({ open, onClose, onSubmit, lockedUsername }: Props) {
  const [username, setUsername] = useState("");
  const [jumlah, setJumlah] = useState<string>("");
  const [catatan, setCatatan] = useState("");
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setUsername(lockedUsername ?? "");
      setJumlah("");
      setCatatan("");
      setValidationError(null);
    }
  }, [open, lockedUsername]);

  function validate(): string | null {
    if (!username.trim()) return "Username wajib diisi.";
    const val = Number(jumlah);
    if (!jumlah || Number.isNaN(val) || val <= 0) return "Jumlah bayar harus lebih dari 0.";
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
      placement="center"
      scrollBehavior="inside"
      isDismissable={false}
      hideCloseButton
    >
      <ModalContent className="mx-3 max-h-[calc(100dvh-1.5rem)] sm:mx-0">
        <ModalHeader className="px-4 pb-2 pt-5 text-xl font-semibold sm:px-6 sm:pt-6">
          Tambah Pembayaran
        </ModalHeader>
        <ModalBody className="gap-4 px-4 sm:px-6">
          {validationError && (
            <div role="alert" className="rounded-xl border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
              {validationError}
            </div>
          )}
          <Input
            label="Username"
            labelPlacement="outside"
            placeholder="mis. raka20"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            isReadOnly={Boolean(lockedUsername)}
            description={lockedUsername ? "Pembayaran akan dicatat untuk profil ini." : "Masukkan username penerima pembayaran."}
            aria-label="Username"
            classNames={{ inputWrapper: "min-h-12" }}
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
          <Button color="success" isLoading={saving} onPress={() => void handleSave()} className="min-h-11">
            Simpan
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
