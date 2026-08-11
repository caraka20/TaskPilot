import { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea } from "@heroui/react";

export type OwnerGajiFormValue = { username: string; jumlahBayar: number; catatan?: string | null; };
type Mode = "create" | "edit";
type Props = { isOpen: boolean; mode: Mode; loading?: boolean; initial?: Partial<OwnerGajiFormValue>; onClose: () => void; onSubmit: (v: OwnerGajiFormValue) => Promise<void> | void; };

export default function OwnerGajiForm({ isOpen, mode, loading = false, initial, onClose, onSubmit }: Props) {
  const [username, setUsername] = useState(initial?.username ?? "");
  const [jumlahBayar, setJumlahBayar] = useState<number>(initial?.jumlahBayar ?? 0);
  const [catatan, setCatatan] = useState<string>(initial?.catatan ?? "");

  useEffect(() => {
    setUsername(initial?.username ?? "");
    setJumlahBayar(initial?.jumlahBayar ?? 0);
    setCatatan((initial?.catatan as string) ?? "");
  }, [initial, isOpen]);

  async function handleSubmit() {
    await onSubmit({
      username: username.trim(),
      jumlahBayar: Number(jumlahBayar) || 0,
      catatan: catatan?.trim() || undefined,
    });
    // ❗jangan close/jangan alert di sini
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" placement="center" scrollBehavior="inside" isDismissable={false} hideCloseButton>
      <ModalContent className="mx-3 max-h-[calc(100dvh-1.5rem)] sm:mx-0">
        <>
          <ModalHeader className="px-4 pb-2 pt-5 text-xl font-semibold sm:px-6 sm:pt-6">
            {mode === "create" ? "Tambah Pembayaran" : "Edit Pembayaran"}
          </ModalHeader>
          <ModalBody className="gap-4 px-4 sm:px-6">
            <Input classNames={{ inputWrapper: "min-h-12" }} label="Username" labelPlacement="outside" placeholder="mis. raka20" value={username} isReadOnly={mode === "edit"} onChange={(e) => setUsername(e.target.value)} />
            <Input classNames={{ inputWrapper: "min-h-12" }} type="number" inputMode="numeric" label="Jumlah Bayar" labelPlacement="outside" value={String(jumlahBayar ?? 0)} onChange={(e) => setJumlahBayar(Number(e.target.value))} min={1} />
            <Textarea classNames={{ inputWrapper: "min-h-24" }} label="Catatan" labelPlacement="outside" placeholder="opsional" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
          </ModalBody>
          <ModalFooter className="grid grid-cols-2 gap-2 px-4 pb-5 pt-4 sm:flex sm:px-6 sm:pb-6">
            <Button variant="flat" onPress={onClose} isDisabled={loading} className="min-h-11">Batal</Button>
            <Button color="primary" onPress={handleSubmit} isLoading={loading} className="min-h-11">
              {mode === "create" ? "Simpan" : "Perbarui"}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}
