"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Camera, KeyRound, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@attendance/lib/api";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@attendance/lib/security";
import type { User } from "@attendance/types/api";
import { Button } from "@attendance/components/ui/button";
import { Card, CardContent, CardHeader } from "@attendance/components/ui/card";
import { Alert } from "@attendance/components/ui/feedback";
import { Field, Input } from "@attendance/components/ui/form";
import { Page, PageHeader } from "@attendance/components/ui/page";
import { useAuthStore } from "../../../store/auth.store";
import { resolveBackendAssetUrl } from "../../../utils/media";

type AccountPageProps = {
  user: User;
  showHeader?: boolean;
};

export function AccountPage({ user: initialUser, showHeader = true }: AccountPageProps) {
  const navigate = useNavigate();
  const { baseUrl, setAvatarUrl, reset } = useAuthStore();
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const avatarSrc = resolveBackendAssetUrl(user.avatarUrl, baseUrl);

  useEffect(() => {
    api<{ user: Omit<User, "role"> & { role: "OWNER" | "USER"; namaLengkap?: string } }>("/auth/me")
      .then(({ user: current }) => {
        const normalized = {
          ...current,
          role: current.role === "OWNER" ? "ADMIN" as const : "USER" as const,
          name: current.name || current.namaLengkap || current.username,
        };
        setUser(normalized);
        setAvatarUrl(normalized.avatarUrl ?? "");
      })
      .catch((error) => setMessage({ tone: "error", text: error instanceof Error ? error.message : "Profil gagal dimuat." }));
  }, [setAvatarUrl]);

  async function uploadAvatar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("avatar");
    if (!(file instanceof File) || !file.size) {
      setMessage({ tone: "error", text: "Pilih foto profil terlebih dahulu." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ tone: "error", text: "Ukuran foto profil maksimal 2 MB." });
      return;
    }
    setAvatarLoading(true);
    setMessage(null);
    try {
      const result = await api<{ user: Pick<User, "avatarUrl"> }>("/auth/avatar", { method: "POST", body: form });
      const avatarUrl = result.user.avatarUrl ?? "";
      setUser((current) => ({ ...current, avatarUrl }));
      setAvatarUrl(avatarUrl);
      setMessage({ tone: "success", text: "Foto profil berhasil diperbarui." });
      event.currentTarget.reset();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Foto profil gagal diunggah." });
    } finally {
      setAvatarLoading(false);
    }
  }

  async function deleteAvatar() {
    setAvatarLoading(true);
    setMessage(null);
    try {
      await api("/auth/avatar", { method: "DELETE" });
      setUser((current) => ({ ...current, avatarUrl: null }));
      setAvatarUrl("");
      setMessage({ tone: "success", text: "Foto profil berhasil dihapus." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Foto profil gagal dihapus." });
    } finally {
      setAvatarLoading(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("currentPassword"));
    const newPassword = String(form.get("newPassword"));
    const confirmation = String(form.get("confirmation"));
    if (newPassword !== confirmation) {
      setMessage({ tone: "error", text: "Konfirmasi password baru tidak sama." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await api("/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setMessage({ tone: "success", text: "Password berhasil diubah. Kamu akan diarahkan ke halaman login." });
      window.setTimeout(() => {
        reset();
        navigate("/login", { replace: true });
      }, 900);
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Password gagal diubah." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page>
      {showHeader ? (
        <PageHeader title="Pengaturan akun" description="Kelola keamanan akun dan informasi akses yang sedang digunakan." />
      ) : null}
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
      <div className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
        <Card>
          <CardHeader title="Profil dan foto" description="JPG, PNG, atau WebP dengan ukuran maksimal 2 MB." />
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-cyan-50 p-4 dark:border-indigo-400/20 dark:from-indigo-500/10 dark:to-cyan-500/5">
              <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                {avatarSrc ? <img alt={`Foto ${user.name}`} className="h-full w-full object-cover" src={avatarSrc} /> : <UserRound />}
              </span>
              <div><p className="font-extrabold">{user.name}</p><p className="text-xs text-slate-500">@{user.username}</p></div>
            </div>
            <form className="space-y-3" onSubmit={uploadAvatar}>
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-200" htmlFor="avatar-upload">Pilih foto profil</label>
              <input accept="image/jpeg,image/png,image/webp" className="block min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:font-bold file:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:file:bg-indigo-500/15 dark:file:text-indigo-200" id="avatar-upload" name="avatar" type="file" />
              <div className="grid gap-2 sm:grid-cols-2">
                <Button loading={avatarLoading} type="submit"><Camera size={16} />Unggah foto</Button>
                <Button disabled={!user.avatarUrl || avatarLoading} type="button" variant="secondary" onClick={() => void deleteAvatar()}><Trash2 size={16} />Hapus foto</Button>
              </div>
            </form>
            <div className="flex items-center gap-3 text-xs text-slate-600"><ShieldCheck className="text-emerald-600" size={18} /><span>Hak akses: <strong>{user.role === "ADMIN" ? "Administrator" : "Pengguna"}</strong></span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Ubah password" description={`Gunakan minimal ${PASSWORD_MIN_LENGTH} karakter dan jangan membagikannya kepada orang lain.`} />
          <CardContent>
            <form className="space-y-4" onSubmit={changePassword}>
              <Field label="Password saat ini"><Input autoComplete="current-password" maxLength={PASSWORD_MAX_LENGTH} minLength={PASSWORD_MIN_LENGTH} name="currentPassword" required type="password" /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Password baru"><Input autoComplete="new-password" maxLength={PASSWORD_MAX_LENGTH} minLength={PASSWORD_MIN_LENGTH} name="newPassword" required type="password" /></Field>
                <Field label="Ulangi password baru"><Input autoComplete="new-password" maxLength={PASSWORD_MAX_LENGTH} minLength={PASSWORD_MIN_LENGTH} name="confirmation" required type="password" /></Field>
              </div>
              <Button loading={loading} type="submit"><KeyRound size={16} />Simpan password baru</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
