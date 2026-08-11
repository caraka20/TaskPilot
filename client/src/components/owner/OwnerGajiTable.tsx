// client/src/components/owner/OwnerGajiTable.tsx
import {useCallback, useEffect, useMemo, useState} from "react";
import {Card} from "@heroui/react";
import Swal from "sweetalert2";

import {useApi} from "../../hooks/useApi";
import {
  getAllGaji, createGaji, updateGaji, deleteGaji,
  type GajiItem, type Paginated
} from "../../services/gaji.service";

import OwnerGajiHeader from "./parts/OwnerGajiHeader";
import OwnerGajiList from "./parts/OwnerGajiList";
import OwnerGajiPagination from "./parts/OwnerGajiPagination";
import OwnerGajiCreateModal from "./parts/OwnerGajiCreateModal";
import OwnerGajiEditModal from "./parts/OwnerGajiEditModal";

/* Payload types yang dipakai modal */
export type CreatePayload = { username: string; jumlahBayar: number; catatan?: string | null };
export type EditPayload   = { jumlahBayar?: number; catatan?: string | null };

type Props = {
  username?: string;
  readOnly?: boolean;
  title?: string;
  description?: string;
  onChanged?: () => void | Promise<void>;
};

export default function OwnerGajiTable({
  username,
  readOnly = false,
  title,
  description,
  onChanged,
}: Props) {
  const api = useApi();

  // table states
  const [rows, setRows] = useState<GajiItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // modal states
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editRow, setEditRow] = useState<GajiItem | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((total || 0) / limit)),
    [total, limit]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: Paginated<GajiItem> = await getAllGaji(api, { page, limit, sort: "desc", username });
      setRows(Array.isArray(res.items) ? res.items : []);
      setTotal(res.pagination?.total ?? 0);
    } catch (e: any) {
      const msg = e?.message || "Gagal memuat data gaji";
      setError(msg);
      await Swal.fire({ icon: "error", title: "Gagal", text: msg });
    } finally {
      setLoading(false);
    }
  }, [api, page, limit, username]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function handleCreate(payload: CreatePayload) {
    try {
      await createGaji(api, { ...payload, username: username ?? payload.username });
      // ✅ sukses → tutup modal lalu refresh & tampilkan alert sukses
      setShowCreate(false);
      await refresh();
      await onChanged?.();
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Pembayaran berhasil disimpan.",
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (e: any) {
      const msg = e?.message ?? "Gagal membuat pembayaran";
      await Swal.fire({ icon: "error", title: "Gagal", text: msg });
      // modal dibiarkan tetap terbuka
    }
  }

  async function handleEdit(payload: EditPayload) {
    if (!editRow) return;
    try {
      await updateGaji(api, editRow.id, payload);
      // ✅ sukses → tutup modal lalu refresh & alert sukses
      setShowEdit(false);
      setEditRow(null);
      await refresh();
      await onChanged?.();
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Perubahan pembayaran tersimpan.",
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (e: any) {
      const msg = e?.message ?? "Gagal memperbarui pembayaran";
      await Swal.fire({ icon: "error", title: "Gagal", text: msg });
      // modal dibiarkan tetap terbuka
    }
  }

  async function handleDelete(id: number) {
    const res = await Swal.fire({
      title: "Hapus pembayaran?",
      text: "Tindakan ini tidak dapat dibatalkan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      reverseButtons: true
    });
    if (!res.isConfirmed) return;

    try {
      await deleteGaji(api, id);
      await refresh();
      await onChanged?.();
      void Swal.fire({ icon: "success", title: "Berhasil dihapus", timer: 1200, showConfirmButton: false });
    } catch (e: any) {
      const msg = e?.message ?? "Gagal menghapus pembayaran";
      await Swal.fire({ icon: "error", title: "Gagal", text: msg });
    }
  }

  return (
    <Card className="overflow-hidden rounded-3xl border border-default-200/80 bg-content1 shadow-[0_18px_50px_-32px_rgba(15,23,42,.35)]">
      <OwnerGajiHeader
        loading={loading}
        onAdd={readOnly ? undefined : () => setShowCreate(true)}
        onRefresh={() => void refresh()}
        title={title}
        description={description}
      />

      <OwnerGajiList
        rows={rows}
        loading={loading}
        error={error}
        readOnly={readOnly}
        onEdit={readOnly ? undefined : (row) => { setEditRow(row); setShowEdit(true); }}
        onDelete={readOnly ? undefined : (id) => void handleDelete(id)}
      />

      <OwnerGajiPagination
        page={page}
        totalPages={totalPages}
        total={total}
        loading={loading}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />

      {/* Modal: Tambah */}
      {!readOnly && <OwnerGajiCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        lockedUsername={username}
      />}

      {/* Modal: Edit */}
      {!readOnly && <OwnerGajiEditModal
        open={showEdit}
        initialJumlah={editRow?.jumlahBayar}
        initialCatatan={editRow?.catatan ?? ""}
        onClose={() => { setShowEdit(false); setEditRow(null); }}
        onSubmit={handleEdit}
      />}
    </Card>
  );
}
