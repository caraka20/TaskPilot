"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  ClipboardList,
  Clock3,
  MessageSquareText,
  PackageOpen,
  UsersRound,
} from "lucide-react";
import { api } from "@attendance/lib/api";
import {
  currency,
  formatDate,
  formatMonthYear,
  formatTime,
  todayInput,
  workModeLabel,
  workStatusLabel,
} from "@attendance/lib/format";
import type { CalendarData, Role, TaskOccurrence, User, WorkEntry } from "@attendance/types/api";
import { Badge } from "@attendance/components/ui/badge";
import { Button } from "@attendance/components/ui/button";
import { Card } from "@attendance/components/ui/card";
import { Alert, EmptyState } from "@attendance/components/ui/feedback";
import { Select } from "@attendance/components/ui/form";
import { Modal } from "@attendance/components/ui/modal";
import { Page, PageHeader } from "@attendance/components/ui/page";

const weekdays = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const emptyData: CalendarData = { month: "", entries: [], tasks: [] };

function shiftMonth(value: string, offset: number) {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function calendarCells(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const start = new Date(first);
  start.setUTCDate(first.getUTCDate() - first.getUTCDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return {
      date,
      key: date.toISOString().slice(0, 10),
      inMonth: date.getUTCMonth() === monthNumber - 1,
    };
  });
}

export function CalendarPage({ role }: { role: Role }) {
  const [month, setMonth] = useState(todayInput().slice(0, 7));
  const [userId, setUserId] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [data, setData] = useState<CalendarData>(emptyData);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [error, setError] = useState("");
  const isAdmin = role === "ADMIN";

  const load = useCallback(async () => {
    try {
      const path = isAdmin
        ? `/admin/calendar?month=${month}${userId ? `&userId=${userId}` : ""}`
        : `/calendar/me?month=${month}`;
      setData(await api<CalendarData>(path));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kalender gagal dimuat.");
    }
  }, [isAdmin, month, userId]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!isAdmin) return;
    api<{ users: User[] }>("/admin/users?includeInactive=true")
      .then((result) => setUsers(result.users))
      .catch(() => undefined);
  }, [isAdmin]);

  const entriesByDate = useMemo(() => Map.groupBy(data.entries, (entry) => entry.workDate.slice(0, 10)), [data.entries]);
  const tasksByDate = useMemo(() => Map.groupBy(data.tasks, (task) => task.taskDate.slice(0, 10)), [data.tasks]);
  const cells = useMemo(() => calendarCells(month), [month]);
  const selectedEntries = selectedDate ? entriesByDate.get(selectedDate) ?? [] : [];
  const selectedTasks = selectedDate ? tasksByDate.get(selectedDate) ?? [] : [];

  return (
    <Page>
      <PageHeader
        eyebrow={isAdmin ? "Kalender operasional" : "Kalender pribadi"}
        title="Kalender kerja"
        description={isAdmin ? "Lihat kehadiran, status persetujuan, catatan pekerjaan, dan penugasan setiap pengguna dalam tampilan bulanan." : "Lihat hari masuk, catatan pekerjaan, hasil borongan, dan tugasmu berdasarkan tanggal."}
        action={isAdmin ? <Select className="min-w-64" onChange={(event) => setUserId(event.target.value)} value={userId}><option value="">Semua pengguna</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name} (@{user.username})</option>)}</Select> : undefined}
      />
      {error ? <Alert>{error}</Alert> : null}
      <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center">
          <div><p className="text-xl font-extrabold capitalize tracking-tight text-slate-950">{formatMonthYear(month)}</p><p className="mt-1 text-[11px] text-slate-400">Klik tanggal untuk melihat detail aktivitas.</p></div>
          <div className="flex items-center gap-2"><Button size="sm" variant="secondary" onClick={() => setMonth(todayInput().slice(0, 7))}>Bulan ini</Button><Button aria-label="Bulan sebelumnya" size="sm" variant="secondary" onClick={() => setMonth((value) => shiftMonth(value, -1))}><ChevronLeft size={16} /></Button><Button aria-label="Bulan berikutnya" size="sm" variant="secondary" onClick={() => setMonth((value) => shiftMonth(value, 1))}><ChevronRight size={16} /></Button></div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[940px]">
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70">{weekdays.map((day) => <div className="px-3 py-3 text-center text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400" key={day}>{day}</div>)}</div>
            <div className="grid grid-cols-7">{cells.map((cell) => {
              const entries = entriesByDate.get(cell.key) ?? [];
              const tasks = tasksByDate.get(cell.key) ?? [];
              const isToday = cell.key === todayInput();
              return <button className={`min-h-36 border-b border-r border-slate-100 p-2.5 text-left align-top transition hover:bg-blue-50/40 ${!cell.inMonth ? "bg-slate-50/60 text-slate-300" : "bg-white"}`} key={cell.key} onClick={() => setSelectedDate(cell.key)} type="button"><div className="flex items-center justify-between"><span className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-extrabold ${isToday ? "bg-[#2f7df4] text-white shadow-md shadow-blue-500/20" : cell.inMonth ? "text-slate-700" : "text-slate-300"}`}>{cell.date.getUTCDate()}</span>{entries.length ? <span className="text-[9px] font-extrabold text-emerald-600">{entries.length} masuk</span> : null}</div><div className="mt-2 space-y-1.5">{entries.slice(0, 2).map((entry) => <div className={`truncate rounded-lg px-2 py-1.5 text-[9px] font-bold ${entry.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" : entry.status === "REJECTED" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`} key={entry.id}>{isAdmin && !userId ? entry.user?.name : `${workModeLabel(entry.mode)} · ${workStatusLabel(entry.status)}`}</div>)}{entries.length > 2 ? <p className="px-1 text-[9px] font-bold text-slate-400">+{entries.length - 2} kehadiran lain</p> : null}{tasks.length ? <div className="flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-1.5 text-[9px] font-bold text-violet-700"><ClipboardList size={10} />{tasks.length} tugas</div> : null}</div></button>;
            })}</div>
          </div>
        </div>
      </Card>

      <Modal open={selectedDate !== null} onClose={() => setSelectedDate(null)} size="lg" title={selectedDate ? formatDate(`${selectedDate}T00:00:00.000Z`, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "Detail tanggal"} description="Rangkuman kehadiran, catatan pekerjaan, dan tugas pada tanggal ini.">
        {selectedEntries.length || selectedTasks.length ? <div className="space-y-6">
          <section><div className="mb-3 flex items-center gap-2"><CalendarCheck2 className="text-emerald-600" size={18} /><h3 className="text-sm font-extrabold">Kehadiran</h3><Badge tone="green">{selectedEntries.length}</Badge></div>{selectedEntries.length ? <div className="space-y-3">{selectedEntries.map((entry) => <AttendanceDetail entry={entry} isAdmin={isAdmin} key={entry.id} />)}</div> : <p className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-400">Tidak ada absensi pada tanggal ini.</p>}</section>
          <section><div className="mb-3 flex items-center gap-2"><ClipboardList className="text-violet-600" size={18} /><h3 className="text-sm font-extrabold">Tugas kerja</h3><Badge tone="purple">{selectedTasks.length}</Badge></div>{selectedTasks.length ? <div className="grid gap-3 sm:grid-cols-2">{selectedTasks.map((task) => <TaskDetail isAdmin={isAdmin} key={task.id} task={task} />)}</div> : <p className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-400">Tidak ada tugas pada tanggal ini.</p>}</section>
        </div> : <EmptyState title="Tidak ada aktivitas" description="Belum ada absensi atau tugas yang tercatat pada tanggal ini." />}
      </Modal>
    </Page>
  );
}

function AttendanceDetail({ entry, isAdmin }: { entry: WorkEntry; isAdmin: boolean }) {
  const totalItems = entry.items.reduce((total, item) => total + item.quantity, 0);
  return <div className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div>{isAdmin ? <p className="text-sm font-extrabold text-slate-900">{entry.user?.name}</p> : null}<div className="mt-1 flex flex-wrap items-center gap-2"><Badge tone={entry.mode === "DAILY" ? "blue" : "purple"}>{workModeLabel(entry.mode)}</Badge><Badge tone={entry.status === "APPROVED" ? "green" : entry.status === "REJECTED" ? "red" : "amber"}>{workStatusLabel(entry.status)}</Badge></div></div><p className="text-sm font-extrabold text-slate-900">{currency.format(Number(entry.finalAmount))}</p></div><div className="mt-4 grid gap-2 text-[11px] text-slate-500 sm:grid-cols-2"><p className="flex items-center gap-2"><Clock3 size={14} />{formatTime(entry.clockIn)} – {formatTime(entry.clockOut)}</p>{entry.mode === "PIECEWORK" ? <p className="flex items-center gap-2"><PackageOpen size={14} />{totalItems.toLocaleString("id-ID")} item</p> : null}</div>{entry.note ? <div className="mt-3 flex gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><MessageSquareText className="mt-0.5 shrink-0 text-slate-400" size={14} />{entry.note}</div> : null}</div>;
}

function TaskDetail({ task, isAdmin }: { task: TaskOccurrence; isAdmin: boolean }) {
  return <div className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600">{task.status === "COMPLETED" ? <CircleCheckBig size={17} /> : <ClipboardList size={17} />}</span><Badge tone={task.status === "COMPLETED" ? "green" : "amber"}>{task.status === "COMPLETED" ? "Selesai" : "Belum selesai"}</Badge></div><p className="mt-3 text-xs font-extrabold text-slate-900">{task.schedule.template.title}</p>{isAdmin && task.user ? <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-400"><UsersRound size={11} />{task.user.name}</p> : null}<p className="mt-2 text-[11px] leading-5 text-slate-500">{task.schedule.template.description || "Tanpa keterangan tambahan."}</p></div>;
}
