"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff, MessageSquareText, PencilLine, Plus, Trash2 } from "lucide-react";
import { api } from "@attendance/lib/api";
import { formatDate } from "@attendance/lib/format";
import type { DashboardNote, User } from "@attendance/types/api";
import { Badge } from "@attendance/components/ui/badge";
import { Button } from "@attendance/components/ui/button";
import { Card, CardContent } from "@attendance/components/ui/card";
import { Alert, EmptyState } from "@attendance/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@attendance/components/ui/form";
import { Modal } from "@attendance/components/ui/modal";
import { Page, PageHeader } from "@attendance/components/ui/page";
import { useFeedback } from "@attendance/components/ui/feedback-provider";

export function NotesPage() {
  const { confirm, toast } = useFeedback();
  const [notes, setNotes] = useState<DashboardNote[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<DashboardNote | "new" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const [noteResult, userResult] = await Promise.all([api<{ notes: DashboardNote[] }>("/admin/notes"), api<{ users: User[] }>("/admin/users")]);
      setNotes(noteResult.notes); setUsers(userResult.users);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Catatan gagal dimuat."); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const creating = editing === "new";
    try {
      if (editing === "new") await api("/admin/notes", { method: "POST", body: JSON.stringify({ userId: form.get("userId"), title: form.get("title"), message: form.get("message") }) });
      else if (editing) await api(`/admin/notes/${editing.id}`, { method: "PATCH", body: JSON.stringify({ title: form.get("title"), message: form.get("message"), isActive: form.get("isActive") === "on", reason: form.get("reason") }) });
      setEditing(null); setNotice("Catatan pribadi berhasil disimpan.");
      toast(creating ? "Catatan berhasil dibuat" : "Catatan berhasil diperbarui", {
        description: creating ? "Pesan langsung tersedia untuk user yang dipilih." : "Perubahan catatan sudah diterapkan.",
        tone: "success",
      });
      await load();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Catatan gagal disimpan.";
      setError(message);
      toast("Catatan belum dapat disimpan", { description: message, tone: "error" });
    }
  }

  async function remove(note: DashboardNote) {
    const accepted = await confirm({
      title: "Hapus catatan pribadi?",
      description: `Catatan “${note.title || "Catatan admin"}” akan hilang dari dashboard ${note.user?.name ?? "user"}.`,
      confirmLabel: "Hapus catatan",
      tone: "danger",
      requireAcknowledgement: true,
    });
    if (!accepted) return;
    try { await api(`/admin/notes/${note.id}`, { method: "DELETE", body: JSON.stringify({ reason: "Catatan dihapus melalui dashboard" }) }); setNotice("Catatan berhasil dihapus."); toast("Catatan dihapus", { description: note.user?.name, tone: "success" }); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Catatan gagal dihapus."); }
  }

  return <Page>
    <PageHeader title="Catatan pengguna" description="Kirim arahan pribadi yang hanya terlihat pada dashboard pengguna yang dipilih sampai dinonaktifkan atau dihapus." action={<Button onClick={() => setEditing("new")}><Plus size={16} />Buat catatan</Button>} />
    {error ? <Alert>{error}</Alert> : null}{notice ? <Alert tone="success">{notice}</Alert> : null}
    {notes.length ? <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{notes.map((note) => <Card key={note.id}><CardContent><div className="flex items-start justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><MessageSquareText size={18} /></span><Badge tone={note.isActive ? "green" : "gray"}>{note.isActive ? <span className="flex items-center gap-1"><Eye size={11} />Tampil</span> : <span className="flex items-center gap-1"><EyeOff size={11} />Nonaktif</span>}</Badge></div><p className="mt-4 text-[10px] font-extrabold uppercase tracking-widest text-[#2f7df4]">Untuk {note.user?.name}</p><h3 className="mt-2 font-extrabold text-slate-900">{note.title || "Catatan admin"}</h3><p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-500">{note.message}</p><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><p className="text-[10px] text-slate-400">Diperbarui {formatDate(note.updatedAt)}</p><div className="flex"><Button size="sm" variant="ghost" onClick={() => setEditing(note)}><PencilLine size={15} /></Button><Button size="sm" variant="ghost" onClick={() => void remove(note)}><Trash2 className="text-rose-600" size={15} /></Button></div></div></CardContent></Card>)}</div> : <Card><EmptyState title="Belum ada catatan pribadi" description="Buat arahan atau informasi penting untuk pengguna tertentu." /></Card>}
    <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Buat catatan pribadi" : "Edit catatan pribadi"}>{editing ? <form className="space-y-4" onSubmit={save}>{editing === "new" ? <Field label="Pengguna"><Select defaultValue="" name="userId" required><option disabled value="">Pilih pengguna</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name} (@{user.username})</option>)}</Select></Field> : <Field label="Pengguna"><Input disabled value={editing.user?.name ?? ""} /></Field>}<Field label="Judul"><Input defaultValue={editing === "new" ? "" : editing.title ?? ""} name="title" /></Field><Field label="Isi catatan"><Textarea defaultValue={editing === "new" ? "" : editing.message} name="message" required /></Field>{editing !== "new" ? <><label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-xs font-bold"><input defaultChecked={editing.isActive} name="isActive" type="checkbox" />Tampilkan di dashboard pengguna</label><Field label="Alasan perubahan"><Input name="reason" minLength={3} required /></Field></> : null}<div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setEditing(null)}>Batal</Button><Button type="submit">Simpan</Button></div></form> : null}</Modal>
  </Page>;
}
