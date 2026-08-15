"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CalendarPlus,
  Check,
  CheckCheck,
  ClipboardCheck,
  Filter,
  PencilLine,
  Search,
} from "lucide-react";
import { api } from "@attendance/lib/api";
import { currency, formatDate, formatTime, workModeLabel, workStatusLabel } from "@attendance/lib/format";
import type { Product, User, WorkEntry, WorkStatus } from "@attendance/types/api";
import { Badge } from "@attendance/components/ui/badge";
import { Button } from "@attendance/components/ui/button";
import { Card } from "@attendance/components/ui/card";
import { Alert, EmptyState, LoadingState } from "@attendance/components/ui/feedback";
import { Input, Select } from "@attendance/components/ui/form";
import { Modal } from "@attendance/components/ui/modal";
import { Page, PageHeader } from "@attendance/components/ui/page";
import { useFeedback } from "@attendance/components/ui/feedback-provider";
import { WorkEntryForm, type WorkEntryPayload } from "./work-entry-form";

export function ApprovalsPage({ onPendingChanged }: { onPendingChanged?: (count: number) => void }) {
  const { confirm, toast } = useFeedback();
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<WorkStatus | "ALL">("PENDING");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<WorkEntry | null | "new">(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [workResult, userResult, productResult] = await Promise.all([
        api<{ entries: WorkEntry[] }>("/admin/work-entries"),
        api<{ users: User[] }>("/admin/users?includeInactive=true"),
        api<{ products: Product[] }>("/admin/products"),
      ]);
      setEntries(workResult.entries);
      onPendingChanged?.(workResult.entries.filter((entry) => entry.status === "PENDING").length);
      setUsers(userResult.users);
      setProducts(productResult.products);
      setSelected((current) => current.filter((id) => workResult.entries.some((entry) => entry.id === id && entry.status === "PENDING")));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Data absensi gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [onPendingChanged]);

  useEffect(() => { void load(); }, [load]);

  const pendingCount = useMemo(() => entries.filter((entry) => entry.status === "PENDING").length, [entries]);
  const filtered = useMemo(
    () => entries.filter((entry) => {
      const matchesStatus = status === "ALL" || entry.status === status;
      const term = search.toLowerCase();
      const matchesSearch = !term || entry.user?.name.toLowerCase().includes(term) || entry.user?.username.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    }),
    [entries, search, status],
  );
  const selectableIds = useMemo(() => filtered.filter((entry) => entry.status === "PENDING").map((entry) => entry.id), [filtered]);
  const allVisibleSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.includes(id));

  function toggleOne(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleAllVisible() {
    setSelected((current) => {
      if (allVisibleSelected) return current.filter((id) => !selectableIds.includes(id));
      return [...new Set([...current, ...selectableIds])];
    });
  }

  async function quickApprove(entry: WorkEntry) {
    const accepted = await confirm({
      title: "Setujui absensi ini?",
      description: `${entry.user?.name ?? "User"} · ${formatDate(entry.workDate)} · ${currency.format(Number(entry.finalAmount))}. Nominal saat ini akan masuk ke saldo gaji.`,
      confirmLabel: "Ya, setujui",
      tone: "primary",
    });
    if (!accepted) return;

    setProcessing(entry.id);
    try {
      await api(`/admin/work-entries/${entry.id}/review`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "APPROVED",
          finalAmount: entry.finalAmount,
          reason: "Disetujui cepat oleh admin tanpa koreksi",
        }),
      });
      toast("Absensi disetujui", { description: `${entry.user?.name} · ${formatDate(entry.workDate)}`, tone: "success" });
      await load();
    } catch (cause) {
      toast("Persetujuan gagal", { description: cause instanceof Error ? cause.message : "Terjadi kesalahan.", tone: "error" });
    } finally {
      setProcessing(null);
    }
  }

  async function bulkApprove() {
    if (!selected.length) return;
    const accepted = await confirm({
      title: `Setujui ${selected.length} absensi?`,
      description: "Semua nominal yang dipilih akan langsung masuk ke saldo gaji masing-masing user. Gunakan Edit jika ada jam, item, atau nominal yang perlu dikoreksi.",
      confirmLabel: `Setujui ${selected.length} data`,
      tone: "primary",
    });
    if (!accepted) return;

    setProcessing("bulk");
    try {
      const result = await api<{ approved: number; skipped: number }>("/admin/work-entries/bulk-approve", {
        method: "POST",
        body: JSON.stringify({ ids: selected, reason: "Persetujuan massal oleh admin tanpa koreksi" }),
      });
      toast(`${result.approved} absensi disetujui`, {
        description: result.skipped ? `${result.skipped} data dilewati karena statusnya sudah berubah.` : "Saldo gaji telah diperbarui.",
        tone: "success",
      });
      setSelected([]);
      await load();
    } catch (cause) {
      toast("Persetujuan massal gagal", { description: cause instanceof Error ? cause.message : "Terjadi kesalahan.", tone: "error" });
    } finally {
      setProcessing(null);
    }
  }

  async function save(payload: WorkEntryPayload) {
    if (editing === "new") {
      await api("/admin/work-entries", { method: "POST", body: JSON.stringify(payload) });
      toast("Absensi dicatat", { description: formatDate(payload.workDate), tone: "success" });
    } else if (editing) {
      await api(`/admin/work-entries/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      toast("Koreksi absensi disimpan", { description: `${editing.user?.name} · ${formatDate(payload.workDate)}`, tone: "success" });
    }
    setEditing(null);
    await load();
  }

  if (loading) return <LoadingState label="Menyiapkan daftar persetujuan..." />;

  return (
    <Page>
      <PageHeader
        eyebrow="Kontrol operasional"
        title="Absensi dan persetujuan"
        description="Semua laporan yang belum disetujui tetap tampil di sini walaupun berasal dari hari atau bulan sebelumnya."
        action={<Button onClick={() => setEditing("new")}><CalendarPlus size={16} />Catat absensi</Button>}
      />
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="flex items-start gap-3 rounded-2xl border border-rose-300 bg-gradient-to-r from-rose-50 to-orange-50 p-4 text-rose-950 shadow-sm dark:border-rose-500/30 dark:from-rose-500/15 dark:to-orange-500/10 dark:text-rose-100">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-600 text-white shadow-lg shadow-rose-500/20"><CalendarClock size={19} /></span>
          <div><p className="text-sm font-extrabold">{pendingCount} laporan membutuhkan persetujuan</p><p className="mt-1 text-xs leading-5 text-rose-700 dark:text-rose-200">Daftar tidak kedaluwarsa. Data berbeda hari tetap tersimpan sampai owner menyetujui atau memperbaikinya.</p></div>
        </div>
        {selected.length ? (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 lg:min-w-80">
            <div><p className="text-sm font-extrabold text-blue-950">{selected.length} dipilih</p><button className="mt-1 text-[10px] font-bold text-blue-600 hover:text-blue-800" onClick={() => setSelected([])}>Batalkan pilihan</button></div>
            <Button size="sm" loading={processing === "bulk"} onClick={() => void bulkApprove()}><CheckCheck size={16} />Setujui semua</Button>
          </div>
        ) : null}
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><Input className="pl-10" onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau username…" /></div>
          <div className="flex items-center gap-2"><Filter className="text-slate-400" size={16} /><Select className="min-w-56" value={status} onChange={(event) => { setStatus(event.target.value as WorkStatus | "ALL"); setSelected([]); }}><option value="ALL">Semua status & tanggal</option><option value="PENDING">Menunggu pemeriksaan</option><option value="APPROVED">Disetujui</option><option value="IN_PROGRESS">Sedang bekerja</option><option value="REJECTED">Ditolak</option></Select></div>
        </div>
        {filtered.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th className="w-10"><button aria-label="Pilih semua yang terlihat" className={`grid h-5 w-5 place-items-center rounded-md border ${allVisibleSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"}`} onClick={toggleAllVisible}>{allVisibleSelected ? <Check size={13} /> : null}</button></th><th>Pengguna</th><th>Hari, tanggal & waktu</th><th>Jenis/rincian</th><th>Status</th><th className="text-right">Nominal</th><th className="text-right">Tindakan</th></tr></thead>
              <tbody>
                {filtered.map((entry) => {
                  const itemCount = entry.items.reduce((total, item) => total + item.quantity, 0);
                  const canSelect = entry.status === "PENDING";
                  const checked = selected.includes(entry.id);
                  return (
                    <tr className={checked ? "bg-blue-50/50" : ""} key={entry.id}>
                      <td>{canSelect ? <button aria-label={`Pilih absensi ${entry.user?.name}`} className={`grid h-5 w-5 place-items-center rounded-md border ${checked ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"}`} onClick={() => toggleOne(entry.id)}>{checked ? <Check size={13} /> : null}</button> : <span className="block h-5 w-5" />}</td>
                      <td><p className="font-extrabold text-slate-800">{entry.user?.name}</p><p className="mt-1 text-[10px] text-slate-400">@{entry.user?.username}</p></td>
                      <td><p className="font-bold capitalize">{formatDate(entry.workDate)}</p><p className="mt-1 text-[10px] text-slate-400">{formatTime(entry.clockIn)} – {formatTime(entry.clockOut)}</p></td>
                      <td><Badge tone={entry.mode === "DAILY" ? "blue" : "purple"}>{workModeLabel(entry.mode)}</Badge><p className="mt-2 max-w-56 truncate text-[10px] text-slate-400">{entry.mode === "PIECEWORK" ? `${itemCount.toLocaleString("id-ID")} item` : entry.note || "Tanpa catatan"}</p></td>
                      <td><Badge tone={entry.status === "APPROVED" ? "green" : entry.status === "REJECTED" ? "red" : "amber"}>{workStatusLabel(entry.status)}</Badge></td>
                      <td className="text-right font-extrabold">{currency.format(Number(entry.finalAmount))}</td>
                      <td><div className="flex justify-end gap-2">{entry.status === "PENDING" ? <Button loading={processing === entry.id} size="sm" onClick={() => void quickApprove(entry)}><ClipboardCheck size={14} />Setujui</Button> : null}<Button aria-label="Edit absensi" size="sm" variant="secondary" onClick={() => setEditing(entry)}><PencilLine size={14} />Edit</Button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="Tidak ada absensi" description="Belum ada data yang sesuai dengan pencarian dan filter saat ini." />}
      </Card>

      <Modal open={editing !== null} onClose={() => setEditing(null)} size="xl" title={editing === "new" ? "Catat absensi" : "Periksa dan koreksi absensi"} description="Nominal yang disimpan menjadi snapshot transaksi dan tidak berubah ketika tarif pengguna diperbarui.">
        {editing ? <WorkEntryForm initial={editing === "new" ? null : editing} onCancel={() => setEditing(null)} onSubmit={save} products={products} users={users} /> : null}
      </Modal>
    </Page>
  );
}
