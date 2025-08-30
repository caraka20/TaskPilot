import { useEffect, useMemo, useState } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Input, Chip
} from "@heroui/react";
import Swal from "sweetalert2";
import {
  listItems, bulkUpdateNilai,
  type TutonItemResponse, type BulkNilaiRequest
} from "../../../services/tuton.service";
import { showApiError, showLoading, closeAlert, showSuccess } from "../../../utils/alert";

type Props = {
  open: boolean;
  courseId: number;
  matkul: string;
  onClose: () => void;
  onSaved?: () => void;
};

type Row = TutonItemResponse & { jenisStr: "DISKUSI" | "TUGAS" };

export default function TutonNilaiModal({ open, courseId, matkul, onClose, onSaved }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [dirty, setDirty] = useState<Record<number, number | null>>({}); // itemId -> nilai (null boleh)
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const items = await listItems(courseId);
        if (!alive) return;
        const pick = items
          .filter((it) => it.jenis === "DISKUSI" || it.jenis === "TUGAS")
          .map((it) => ({ ...it, jenisStr: (it.jenis as any) as "DISKUSI" | "TUGAS" }))
          .sort((a, b) => (a.jenisStr === b.jenisStr ? a.sesi - b.sesi : a.jenisStr.localeCompare(b.jenisStr)));
        setRows(pick);
        setDirty({});
      } catch (e) {
        await showApiError(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [open, courseId]);

  const onChangeNilai = (itemId: number, value: string) => {
    const trimmed = value.trim();
    if (trimmed === "") {
      setDirty((d) => ({ ...d, [itemId]: null })); // kosongkan nilai
      return;
    }
    const num = Number(trimmed);
    if (!Number.isFinite(num)) return; // ignore
    setDirty((d) => ({ ...d, [itemId]: num }));
  };

  const isInvalid = (val: number | null | undefined) =>
    (val != null && (val < 0 || val > 100));

  const invalidCount = useMemo(() => {
    return Object.entries(dirty).reduce((acc, [v]) => acc + (isInvalid(v as any) ? 1 : 0), 0);
  }, [dirty]);

  const changedCount = Object.keys(dirty).length;

  const onSave = async () => {
    if (changedCount === 0) return;
    if (invalidCount > 0) {
      await Swal.fire({ icon: "error", title: "Nilai tidak valid", text: "Pastikan 0..100 atau kosongkan." });
      return;
    }

    const ask = await Swal.fire({
      icon: "question",
      title: "Simpan nilai?",
      text: `${changedCount} item akan diperbarui.`,
      showCancelButton: true,
      confirmButtonText: "Simpan",
      cancelButtonText: "Batal",
    });
    if (!ask.isConfirmed) return;

    const payload: BulkNilaiRequest = {
      items: Object.entries(dirty).map(([id, nilai]) => ({ itemId: Number(id), nilai })),
    };

    showLoading("Menyimpan nilai…");
    try {
      await bulkUpdateNilai(courseId, payload);
      closeAlert();
      await showSuccess("Nilai tersimpan");
      setDirty({});
      onSaved?.();
      onClose();
    } catch (e) {
      closeAlert();
      await showApiError(e);
    }
  };

  return (
    <Modal isOpen={open} onOpenChange={onClose} size="3xl" placement="center" scrollBehavior="inside">
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-indigo-600">Kelola Nilai</span>
                <Chip size="sm" variant="flat">{matkul}</Chip>
              </div>
              <Chip size="sm" variant="flat" className="bg-default-100">
                {changedCount} perubahan
              </Chip>
            </ModalHeader>

            <ModalBody>
              <Table
                aria-label="Nilai Diskusi & Tugas"
                isHeaderSticky
                removeWrapper
                classNames={{
                  table: "min-w-[720px] text-[13px]",
                  thead: "sticky top-0 z-10 shadow-sm",
                  th: "bg-slate-100 text-foreground-600 font-medium text-[13px] py-3 border-b border-default-200",
                  td: "py-3 align-middle border-b border-default-200",
                }}
              >
                <TableHeader>
                  <TableColumn className="w-[120px]">Jenis</TableColumn>
                  <TableColumn className="w-[100px] text-center">Sesi</TableColumn>
                  <TableColumn>Deskripsi</TableColumn>
                  <TableColumn className="w-[160px] text-right">Nilai (0–100)</TableColumn>
                </TableHeader>
                <TableBody
                  emptyContent={loading ? "Memuat…" : "Tidak ada item nilai"}
                >
                  {rows.map((r) => {
                    const current = (r.id in dirty) ? dirty[r.id] : (typeof r.nilai === "number" ? r.nilai : null);
                    const invalid = isInvalid(current);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.jenisStr}</TableCell>
                        <TableCell className="text-center">{r.sesi}</TableCell>
                        <TableCell className="truncate text-foreground-500">{r.deskripsi ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Input
                              size="sm"
                              type="number"
                              placeholder="kosong = null"
                              className="w-[140px]"
                              value={current == null ? "" : String(current)}
                              onValueChange={(v) => onChangeNilai(r.id, v)}
                              min={0}
                              max={100}
                              variant="bordered"
                              isInvalid={invalid}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ModalBody>

            <ModalFooter>
              <Button variant="flat" onPress={onClose}>Tutup</Button>
              <Button color="success" onPress={onSave} isDisabled={changedCount === 0 || invalidCount > 0}>
                Simpan
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
