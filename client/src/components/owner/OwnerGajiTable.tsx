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

export default function OwnerGajiTable() {
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
      const res: Paginated<GajiItem> = await getAllGaji(api, { page, limit, sort: "desc" });
      setRows(Array.isArray(res.items) ? res.items : []);
      setTotal(res.pagination?.total ?? 0);
    } catch (e: any) {
      const msg = e?.message || "Gagal memuat data gaji";
      setError(msg);
      await Swal.fire({ icon: "error", title: "Gagal", text: msg });
    } finally {
      setLoading(false);
    }
  }, [api, page, limit]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function handleCreate(payload: CreatePayload) {
    try {
      await createGaji(api, payload);
      // ✅ sukses → tutup modal lalu refresh & tampilkan alert sukses
      setShowCreate(false);
      await refresh();
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
      void Swal.fire({ icon: "success", title: "Berhasil dihapus", timer: 1200, showConfirmButton: false });
    } catch (e: any) {
      const msg = e?.message ?? "Gagal menghapus pembayaran";
      await Swal.fire({ icon: "error", title: "Gagal", text: msg });
    }
  }

  return (
    <Card className="shadow-sm">
      <OwnerGajiHeader
        loading={loading}
        onAdd={() => setShowCreate(true)}
        onRefresh={() => void refresh()}
      />

      <OwnerGajiList
        rows={rows}
        loading={loading}
        error={error}
        onEdit={(row) => { setEditRow(row); setShowEdit(true); }}
        onDelete={(id) => void handleDelete(id)}
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
      <OwnerGajiCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />

      {/* Modal: Edit */}
      <OwnerGajiEditModal
        open={showEdit}
        initialJumlah={editRow?.jumlahBayar}
        initialCatatan={editRow?.catatan ?? ""}
        onClose={() => { setShowEdit(false); setEditRow(null); }}
        onSubmit={handleEdit}
      />
    </Card>
  );
}
