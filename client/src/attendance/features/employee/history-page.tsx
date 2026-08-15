"use client";

import { useEffect, useState } from "react";
import { api } from "@attendance/lib/api";
import { currency, formatDate, formatTime, workModeLabel, workStatusLabel } from "@attendance/lib/format";
import type { WorkEntry } from "@attendance/types/api";
import { Badge } from "@attendance/components/ui/badge";
import { Card } from "@attendance/components/ui/card";
import { Alert, EmptyState } from "@attendance/components/ui/feedback";
import { Page, PageHeader } from "@attendance/components/ui/page";

export function HistoryPage() {
  const [entries, setEntries] = useState<WorkEntry[]>([]); const [error, setError] = useState("");
  useEffect(() => { api<{ entries: WorkEntry[] }>("/work-entries/me").then((result) => setEntries(result.entries)).catch((cause) => setError(cause instanceof Error ? cause.message : "Riwayat gagal dimuat.")); }, []);
  return <Page><PageHeader title="Riwayat kerja" description="Lihat kembali absensi harian, hasil borongan, status pemeriksaan, dan nominal snapshot setiap tanggal." />{error ? <Alert>{error}</Alert> : null}<Card>{entries.length ? <div className="table-wrap"><table><thead><tr><th>Tanggal</th><th>Jenis</th><th>Jam/rincian</th><th>Catatan</th><th>Status</th><th className="text-right">Nominal</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id}><td className="font-extrabold">{formatDate(entry.workDate)}</td><td><Badge tone={entry.mode === "DAILY" ? "blue" : "purple"}>{workModeLabel(entry.mode)}</Badge></td><td>{entry.mode === "DAILY" ? `${formatTime(entry.clockIn)} – ${formatTime(entry.clockOut)}` : `${entry.items.reduce((total, item) => total + item.quantity, 0).toLocaleString("id-ID")} item`} </td><td className="max-w-64 truncate text-slate-500">{entry.note || "—"}</td><td><Badge tone={entry.status === "APPROVED" ? "green" : entry.status === "REJECTED" ? "red" : "amber"}>{workStatusLabel(entry.status)}</Badge>{entry.correctionReason ? <p className="mt-1 max-w-48 text-[9px] text-slate-400">{entry.correctionReason}</p> : null}</td><td className="text-right font-extrabold">{Number(entry.finalAmount) ? currency.format(Number(entry.finalAmount)) : "—"}</td></tr>)}</tbody></table></div> : <EmptyState title="Belum ada riwayat" description="Riwayat muncul setelah kamu mulai melakukan absensi." />}</Card></Page>;
}
