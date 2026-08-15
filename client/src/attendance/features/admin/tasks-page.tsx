"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Check, ClipboardList, Pencil, Plus, Trash2, UserRoundCheck, UsersRound } from "lucide-react";
import { api } from "@attendance/lib/api";
import { formatDate, todayInput } from "@attendance/lib/format";
import type { TaskOccurrence, TaskTemplate, User } from "@attendance/types/api";
import { Badge } from "@attendance/components/ui/badge";
import { Button } from "@attendance/components/ui/button";
import { Alert, EmptyState, LoadingState } from "@attendance/components/ui/feedback";
import { DateField, Field, Input, Select, Textarea } from "@attendance/components/ui/form";
import { Modal } from "@attendance/components/ui/modal";
import { useFeedback } from "@attendance/components/ui/feedback-provider";

type TemplateForm = {
  title: string;
  description: string;
};

const emptyTemplate: TemplateForm = { title: "", description: "" };

export function TasksPage() {
  const { confirm, toast } = useFeedback();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<TaskOccurrence[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayInput());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [templateModal, setTemplateModal] = useState(false);
  const [editing, setEditing] = useState<TaskTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<TemplateForm>(emptyTemplate);
  const [assignModal, setAssignModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [assignmentDate, setAssignmentDate] = useState(todayInput());
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const loadBase = useCallback(async () => {
    const [taskData, userData] = await Promise.all([
      api<{ templates: TaskTemplate[] }>("/admin/tasks/templates"),
      api<{ users: User[] }>("/admin/users"),
    ]);
    setTemplates(taskData.templates);
    setUsers(userData.users.filter((user) => user.role === "USER" && user.isActive));
  }, []);

  const loadAssignments = useCallback(async (date: string) => {
    const result = await api<{ assignments: TaskOccurrence[] }>(
      `/admin/tasks/assignments?date=${encodeURIComponent(date)}`,
    );
    setAssignments(result.assignments);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadBase(), loadAssignments(selectedDate)]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal memuat tugas kerja.");
    } finally {
      setLoading(false);
    }
  }, [loadAssignments, loadBase, selectedDate]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const assignmentGroups = useMemo(() => {
    const groups = new Map<
      string,
      { scheduleId: string; title: string; description: string; users: TaskOccurrence[] }
    >();

    assignments.forEach((assignment) => {
      const key = assignment.schedule.id;
      const current = groups.get(key);
      if (current) {
        current.users.push(assignment);
        return;
      }
      groups.set(key, {
        scheduleId: key,
        title: assignment.schedule.template.title,
        description: assignment.schedule.template.description ?? "Tanpa keterangan tambahan.",
        users: [assignment],
      });
    });

    return Array.from(groups.values());
  }, [assignments]);

  function openCreateTemplate() {
    setEditing(null);
    setTemplateForm(emptyTemplate);
    setTemplateModal(true);
  }

  function openEditTemplate(task: TaskTemplate) {
    setEditing(task);
    setTemplateForm({ title: task.title, description: task.description ?? "" });
    setTemplateModal(true);
  }

  function openAssignment(template?: TaskTemplate) {
    setSelectedTemplateId(template?.id ?? templates[0]?.id ?? "");
    setAssignmentDate(selectedDate);
    setSelectedUsers([]);
    setAssignModal(true);
  }

  async function saveTemplate(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api(`/admin/tasks/templates/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({ ...templateForm, reason: "Data tugas diperbarui admin" }),
        });
        toast("Tugas diperbarui", { description: templateForm.title, tone: "success" });
      } else {
        await api("/admin/tasks/templates", {
          method: "POST",
          body: JSON.stringify(templateForm),
        });
        toast("Tugas dibuat", { description: templateForm.title, tone: "success" });
      }
      setTemplateModal(false);
      await loadBase();
    } catch (caught) {
      toast("Tugas belum tersimpan", {
        description: caught instanceof Error ? caught.message : "Terjadi kesalahan.",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeTemplate(task: TaskTemplate) {
    const accepted = await confirm({
      title: "Nonaktifkan tugas?",
      description: `Tugas “${task.title}” tidak dapat dipilih lagi. Riwayat penugasan tetap tersimpan.`,
      confirmLabel: "Nonaktifkan tugas",
      tone: "danger",
      requireAcknowledgement: true,
    });
    if (!accepted) return;

    try {
      await api(`/admin/tasks/templates/${task.id}`, { method: "DELETE", body: JSON.stringify({ reason: "Dinonaktifkan admin dari daftar tugas" }) });
      toast("Tugas dinonaktifkan", { description: task.title, tone: "success" });
      await loadBase();
    } catch (caught) {
      toast("Tugas belum dapat dinonaktifkan", {
        description: caught instanceof Error ? caught.message : "Terjadi kesalahan.",
        tone: "error",
      });
    }
  }

  function toggleUser(userId: string) {
    setSelectedUsers((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    );
  }

  async function saveAssignment(event: FormEvent) {
    event.preventDefault();
    if (!selectedUsers.length) {
      toast("Pilih minimal satu user", { tone: "warning" });
      return;
    }

    setSaving(true);
    try {
      await api("/admin/tasks/assignments", {
        method: "POST",
        body: JSON.stringify({
          templateId: selectedTemplateId,
          taskDate: assignmentDate,
          userIds: selectedUsers,
        }),
      });
      setAssignModal(false);
      setSelectedDate(assignmentDate);
      await Promise.all([loadBase(), loadAssignments(assignmentDate)]);
      toast("Tugas dibagikan", {
        description: `${selectedUsers.length} user menerima tugas pada ${formatDate(assignmentDate)}.`,
        tone: "success",
      });
    } catch (caught) {
      toast("Penugasan belum tersimpan", {
        description: caught instanceof Error ? caught.message : "Terjadi kesalahan.",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeAssignment(scheduleId: string, title: string) {
    const accepted = await confirm({
      title: "Hapus penugasan ini?",
      description: `Penugasan “${title}” untuk semua user pada ${formatDate(selectedDate)} akan dihapus.`,
      confirmLabel: "Hapus penugasan",
      tone: "danger",
      requireAcknowledgement: true,
    });
    if (!accepted) return;

    try {
      await api(`/admin/tasks/assignments/${scheduleId}`, { method: "DELETE", body: JSON.stringify({ reason: `Penugasan ${selectedDate} dibatalkan admin` }) });
      await loadAssignments(selectedDate);
      toast("Penugasan dihapus", { description: title, tone: "success" });
    } catch (caught) {
      toast("Penugasan belum dapat dihapus", {
        description: caught instanceof Error ? caught.message : "Terjadi kesalahan.",
        tone: "error",
      });
    }
  }

  if (loading) return <LoadingState label="Menyiapkan tugas dan penugasan..." />;

  return (
    <div className="attendance-stagger space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 px-6 py-7 text-white shadow-xl shadow-blue-950/15 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">
              <ClipboardList size={14} /> Panduan kerja harian
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Atur pekerjaan tanpa pola berulang</h2>
            <p className="mt-2 text-sm leading-6 text-blue-100">
              Buat daftar tugas sekali, lalu pilih tugas, tanggal, dan user yang mengerjakannya. Status selesai disimpan per user.
            </p>
          </div>
          <Button className="border border-white/70 bg-white text-blue-950 shadow-lg shadow-slate-950/15 hover:bg-blue-50" onClick={() => openAssignment()} disabled={!templates.length || !users.length}>
            <UserRoundCheck size={17} /> Beri item tugas
          </Button>
        </div>
      </section>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="card p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-blue-600">Penugasan</p>
            <h3 className="mt-1 text-xl font-bold text-slate-950">Pekerjaan {formatDate(selectedDate)}</h3>
            <p className="mt-1 text-sm text-slate-500">Pilih tanggal untuk melihat pekerjaan lama maupun yang akan datang.</p>
          </div>
          <div className="w-full max-w-xs"><DateField label="Tanggal penugasan" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></div>
        </div>

        {assignmentGroups.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {assignmentGroups.map((group) => {
              const completed = group.users.filter((item) => item.status === "COMPLETED").length;
              return (
                <article key={group.scheduleId} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 transition hover:border-blue-200 hover:bg-blue-50/30">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-950">{group.title}</h4>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{group.description}</p>
                    </div>
                    <button className="grid h-9 w-9 place-items-center rounded-xl text-rose-600 transition hover:bg-rose-50" aria-label="Hapus penugasan" onClick={() => void removeAssignment(group.scheduleId, group.title)}>
                      <Trash2 size={17} />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
                    <div className="flex -space-x-2">
                      {group.users.slice(0, 5).map((assignment) => (
                        <div key={assignment.id} title={assignment.user?.name} className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-blue-100 text-xs font-bold text-blue-800">
                          {(assignment.user?.name ?? "U").slice(0, 2).toUpperCase()}
                        </div>
                      ))}
                      {group.users.length > 5 ? <div className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-slate-200 text-xs font-bold text-slate-700">+{group.users.length - 5}</div> : null}
                    </div>
                    <p className="text-xs font-semibold text-slate-600">{completed}/{group.users.length} user selesai</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.users.map((assignment) => (
                      <Badge key={assignment.id} tone={assignment.status === "COMPLETED" ? "green" : "gray"}>
                        {assignment.status === "COMPLETED" ? <Check className="mr-1" size={12} /> : null}
                        {assignment.user?.name ?? "User"}
                      </Badge>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState title="Belum ada pekerjaan pada tanggal ini" description="Pilih “Beri item tugas” untuk menentukan pekerjaan masing-masing user." />
        )}
      </section>

      <section className="card p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-blue-600">Master tugas</p>
            <h3 className="mt-1 text-xl font-bold text-slate-950">Daftar pekerjaan</h3>
            <p className="mt-1 text-sm text-slate-500">Nama dan keterangan tugas yang dapat dipakai kapan saja.</p>
          </div>
          <Button variant="secondary" onClick={openCreateTemplate}><Plus size={17} /> Tambah tugas</Button>
        </div>

        {templates.length ? (
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {templates.map((task) => (
              <div key={task.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-slate-950">{task.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{task.description}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-400">Pernah digunakan {task._count?.schedules ?? 0} kali</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" onClick={() => openAssignment(task)}><UsersRound size={15} /> Tugaskan</Button>
                  <Button size="sm" variant="secondary" aria-label="Edit tugas" onClick={() => openEditTemplate(task)}><Pencil size={16} /></Button>
                  <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" aria-label="Nonaktifkan tugas" onClick={() => void removeTemplate(task)}><Trash2 size={16} /></Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Daftar tugas masih kosong" description="Tambahkan nama tugas dan keterangannya terlebih dahulu." />
        )}
      </section>

      <Modal open={templateModal} onClose={() => setTemplateModal(false)} title={editing ? "Edit tugas kerja" : "Tambah tugas kerja"} description="Tugas ini menjadi pilihan saat admin membagikan pekerjaan.">
        <form className="space-y-5" onSubmit={saveTemplate}>
          <Field label="Nama tugas"><Input required maxLength={120} value={templateForm.title} onChange={(event) => setTemplateForm((current) => ({ ...current, title: event.target.value }))} placeholder="Contoh: Pengemasan produk" /></Field>
          <Field label="Keterangan pekerjaan"><Textarea required rows={5} maxLength={1000} value={templateForm.description} onChange={(event) => setTemplateForm((current) => ({ ...current, description: event.target.value }))} placeholder="Tuliskan hasil yang diharapkan atau instruksi singkat." /></Field>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <Button type="button" variant="secondary" onClick={() => setTemplateModal(false)}>Batal</Button>
            <Button loading={saving}>Simpan tugas</Button>
          </div>
        </form>
      </Modal>

      <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Beri item tugas" description="Satu item tugas dapat diberikan kepada beberapa user pada tanggal yang sama.">
        <form className="space-y-5" onSubmit={saveAssignment}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tugas kerja">
              <Select required value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)}>
                <option value="">Pilih tugas</option>
                {templates.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
              </Select>
            </Field>
            <DateField label="Tanggal dikerjakan" required value={assignmentDate} onChange={(event) => setAssignmentDate(event.target.value)} />
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">Pilih user</p>
                <p className="text-xs text-slate-500">{selectedUsers.length} dari {users.length} user dipilih</p>
              </div>
              <button type="button" className="text-xs font-bold text-blue-700 hover:text-blue-900" onClick={() => setSelectedUsers(selectedUsers.length === users.length ? [] : users.map((user) => user.id))}>
                {selectedUsers.length === users.length ? "Kosongkan" : "Pilih semua"}
              </button>
            </div>
            <div className="grid max-h-72 gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:grid-cols-2">
              {users.map((user) => {
                const active = selectedUsers.includes(user.id);
                return (
                  <button type="button" key={user.id} onClick={() => toggleUser(user.id)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${active ? "border-blue-300 bg-blue-50 shadow-sm" : "border-transparent bg-white hover:border-slate-200"}`}>
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"}`}>{active ? <Check size={14} /> : null}</span>
                    <span className="min-w-0"><span className="block truncate text-sm font-bold text-slate-900">{user.name}</span><span className="block truncate text-xs text-slate-500">@{user.username}</span></span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
            Tanggal lengkap: {formatDate(assignmentDate)}
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <Button type="button" variant="secondary" onClick={() => setAssignModal(false)}>Batal</Button>
            <Button loading={saving} disabled={!selectedTemplateId || !selectedUsers.length}>Bagikan ke {selectedUsers.length} user</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
