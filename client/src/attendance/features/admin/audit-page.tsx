"use client";

import { useEffect, useMemo, useState } from "react";
import { FileClock, Fingerprint, History, ScrollText, Search, ShieldCheck } from "lucide-react";
import { api } from "@attendance/lib/api";
import { formatDate } from "@attendance/lib/format";
import type { AuditLog } from "@attendance/types/api";
import { Badge } from "@attendance/components/ui/badge";
import { Card } from "@attendance/components/ui/card";
import { Alert, EmptyState, LoadingState } from "@attendance/components/ui/feedback";
import { Input, Select } from "@attendance/components/ui/form";
import { Page, PageHeader } from "@attendance/components/ui/page";

const actionLabels: Record<string, string> = {
  CREATE: "Membuat",
  UPDATE: "Memperbarui",
  DELETE: "Menghapus",
  SOFT_DELETE: "Menonaktifkan",
  RESET_PASSWORD: "Reset password",
  SET_RATE: "Mengatur tarif",
  CREATE_BACKDATED: "Mencatat absensi",
  APPROVE: "Menyetujui",
  REJECT: "Menolak",
  CORRECT: "Mengoreksi",
  DEACTIVATE: "Menonaktifkan",
  ASSIGN: "Memberi tugas",
};

const entityLabels: Record<string, string> = {
  User: "Akun user",
  Product: "Produk",
  UserProductRate: "Tarif borongan",
  DailyRate: "Tarif harian",
  WorkEntry: "Absensi",
  Payment: "Pembayaran",
  DashboardNote: "Catatan dashboard",
  TaskTemplate: "Master tugas",
  TaskAssignment: "Penugasan",
};

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [query, setQuery] = useState("");
  const [entity, setEntity] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ logs: AuditLog[] }>("/admin/audit?limit=200")
      .then((result) => setLogs(result.logs))
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Audit gagal dimuat."))
      .finally(() => setLoading(false));
  }, []);

  const entities = useMemo(() => [...new Set(logs.map((log) => log.entityType))].sort(), [logs]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return logs.filter((log) => {
      if (entity !== "ALL" && log.entityType !== entity) return false;
      return !term || [log.actor.name, log.actor.username, log.reason, log.action, log.entityType, log.entityId]
        .some((value) => value?.toLowerCase().includes(term));
    });
  }, [entity, logs, query]);

  return (
    <Page>
      <PageHeader
        eyebrow="Keamanan dan akuntabilitas"
        title="Audit aktivitas"
        description="Catatan sistem yang tidak dapat diedit untuk mengetahui siapa mengubah data, apa yang diubah, kapan, dan alasannya."
      />
      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <AuditBenefit icon={Fingerprint} title="Siapa yang melakukan" description="Identitas admin pelaku perubahan selalu tercatat." />
        <AuditBenefit icon={History} title="Riwayat koreksi" description="Koreksi gaji, absensi, tarif, dan pembayaran dapat ditelusuri." />
        <AuditBenefit icon={ShieldCheck} title="Penyelesaian sengketa" description="Menjadi bukti internal saat ada selisih saldo atau pertanyaan user." />
      </section>

      <Alert tone="info">
        Audit hanya berfungsi sebagai jejak pemeriksaan dan keamanan. Halaman ini tidak mengubah saldo gaji maupun data transaksi.
      </Alert>

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><Input className="pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari admin, alasan, tindakan, atau ID data…" /></div>
          <Select className="sm:max-w-64" value={entity} onChange={(event) => setEntity(event.target.value)}>
            <option value="ALL">Semua jenis data</option>
            {entities.map((item) => <option key={item} value={item}>{entityLabels[item] ?? item}</option>)}
          </Select>
        </div>
        {loading ? <div className="p-4"><LoadingState label="Membaca riwayat aktivitas..." /></div> : filtered.length ? (
          <div className="divide-y divide-slate-100">
            {filtered.map((log) => (
              <div className="flex gap-4 p-5 sm:px-6" key={log.id}>
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${log.action.includes("DELETE") || log.action === "DEACTIVATE" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-700"}`}>
                  {log.action.includes("DELETE") ? <ScrollText size={18} /> : <FileClock size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-extrabold text-slate-900">{log.actor.name}</p>
                    <span className="text-[10px] font-semibold text-slate-400">@{log.actor.username}</span>
                    <Badge tone="blue">{actionLabels[log.action] ?? log.action}</Badge>
                    <Badge>{entityLabels[log.entityType] ?? log.entityType}</Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{log.reason || "Perubahan otomatis oleh sistem"}</p>
                  <p className="mt-2 break-all text-[10px] leading-5 text-slate-400">{formatDate(log.createdAt, { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} · ID {log.entityId}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <EmptyState title="Aktivitas tidak ditemukan" description="Coba ubah kata kunci atau filter jenis data." />}
      </Card>
    </Page>
  );
}

function AuditBenefit({ icon: Icon, title, description }: { icon: typeof Fingerprint; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700"><Icon size={18} /></span>
      <p className="mt-4 text-sm font-extrabold text-slate-900">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}
