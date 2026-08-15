"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  KeyRound,
  PencilLine,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";

import { api } from "@attendance/lib/api";
import {
  currency,
  formatDate,
  initials,
} from "@attendance/lib/format";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@attendance/lib/security";
import type { User } from "@attendance/types/api";

import { Badge } from "@attendance/components/ui/badge";
import { Button } from "@attendance/components/ui/button";
import { Card } from "@attendance/components/ui/card";
import {
  Alert,
  EmptyState,
} from "@attendance/components/ui/feedback";
import { Field, Input } from "@attendance/components/ui/form";
import { Modal } from "@attendance/components/ui/modal";
import {
  Page,
  PageHeader,
} from "@attendance/components/ui/page";
import { useFeedback } from "@attendance/components/ui/feedback-provider";

import { useAuthStore } from "../../../store/auth.store";
import { resolveBackendAssetUrl } from "../../../utils/media";

export function UsersPage() {
  const { confirm, toast } = useFeedback();

  const baseUrl = useAuthStore((state) => state.baseUrl).replace(/\/$/, "");

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [editing, setEditing] = useState<User | "new" | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");

    try {
      const result = await api<{ users: User[] }>(
        `/admin/users?includeInactive=${includeInactive}`,
      );

      setUsers(result.users);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Data pengguna gagal dimuat.",
      );
    }
  }, [includeInactive]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      if (!term) return true;

      return (
        user.name.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term)
      );
    });
  }, [search, users]);

  function closeEditModal() {
    setEditing(null);
  }

  function closeResetPasswordModal() {
    setResetting(null);
  }

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    setError("");
    setNotice("");

    try {
      if (editing === "new") {
        await api("/admin/users", {
          method: "POST",
          body: JSON.stringify({
            name: form.get("name"),
            username: form.get("username"),
            password: form.get("password"),
            dailyRate: form.get("dailyRate"),
            role: "USER",
          }),
        });

        setNotice("Pengguna baru berhasil dibuat.");
      } else if (editing) {
        await api(`/admin/users/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: form.get("name"),
            username: form.get("username"),
            dailyRate: form.get("dailyRate"),
            isActive: form.get("isActive") === "on",
            reason: form.get("reason"),
          }),
        });

        setNotice(
          "Data dan tarif harian pengguna berhasil diperbarui.",
        );
      }

      closeEditModal();
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Pengguna gagal disimpan.",
      );
    }
  }

  async function resetPassword(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!resetting) return;

    const form = new FormData(event.currentTarget);

    setError("");
    setNotice("");

    try {
      await api(`/admin/users/${resetting.id}/reset-password`, {
        method: "PATCH",
        body: JSON.stringify({
          newPassword: form.get("newPassword"),
          reason: form.get("reason"),
        }),
      });

      setNotice(`Password ${resetting.name} berhasil diganti.`);
      closeResetPasswordModal();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Password gagal diganti.",
      );
    }
  }

  async function remove(user: User) {
    const accepted = await confirm({
      title: "Nonaktifkan akun user?",
      description:
        `Akun ${user.name} tidak dapat login lagi. ` +
        "Absensi, gaji, pembayaran, dan riwayat lainnya tetap aman tersimpan.",
      confirmLabel: "Nonaktifkan akun",
      tone: "danger",
      requireAcknowledgement: true,
    });

    if (!accepted) return;

    setError("");
    setNotice("");

    try {
      await api(`/admin/users/${user.id}`, {
        method: "DELETE",
        body: JSON.stringify({
          reason: "Akun dinonaktifkan melalui dashboard admin",
        }),
      });

      setNotice(
        "Akun dinonaktifkan tanpa menghapus riwayatnya.",
      );

      toast("Akun dinonaktifkan", {
        description: user.name,
        tone: "success",
      });

      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Akun gagal dinonaktifkan.",
      );
    }
  }

  return (
    <Page>
      <PageHeader
        title="Data pengguna"
        description="Buat akun, atur tarif harian, reset password, dan kelola status pengguna tanpa merusak riwayat transaksi."
        action={
          <Button onClick={() => setEditing("new")}>
            <Plus size={16} />
            Tambah pengguna
          </Button>
        }
      />

      {error ? <Alert>{error}</Alert> : null}

      {notice ? (
        <Alert tone="success">{notice}</Alert>
      ) : null}

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />

            <Input
              aria-label="Cari pengguna"
              className="pl-10"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama atau username…"
              type="search"
              value={search}
            />
          </div>

          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10">
            <input
              checked={includeInactive}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              onChange={(event) =>
                setIncludeInactive(event.target.checked)
              }
              type="checkbox"
            />

            Tampilkan akun nonaktif
          </label>
        </div>

        {filtered.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pengguna</th>
                  <th>Status</th>
                  <th>Tarif harian</th>
                  <th>Riwayat kerja</th>
                  <th>Dibuat</th>
                  <th aria-label="Aksi" />
                </tr>
              </thead>

              <tbody>
                {filtered.map((user) => {
                  const isActive =
                    user.isActive && !user.deletedAt;

                  const avatarSrc = resolveBackendAssetUrl(
                    user.avatarUrl,
                    baseUrl,
                  );

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-blue-50 text-[11px] font-black text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/20">
                            {initials(user.name)}

                            {avatarSrc ? (
                              <img
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover"
                                decoding="async"
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.remove();
                                }}
                                src={avatarSrc}
                              />
                            ) : null}
                          </span>

                          <div className="min-w-0">
                            <p className="truncate font-extrabold text-slate-800 dark:text-slate-100">
                              {user.name}
                            </p>

                            <p className="mt-1 truncate text-[10px] text-slate-400">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td>
                        <Badge
                          tone={isActive ? "green" : "red"}
                        >
                          {isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>

                      <td className="font-extrabold">
                        {currency.format(
                          Number(user.dailyRate),
                        )}

                        <p className="mt-1 text-[10px] font-normal text-slate-400">
                          berlaku saat ini
                        </p>
                      </td>

                      <td>
                        {user._count?.workEntries ?? 0} catatan
                      </td>

                      <td>
                        {user.createdAt
                          ? formatDate(user.createdAt)
                          : "—"}
                      </td>

                      <td>
                        <div className="flex justify-end gap-1">
                          <Button
                            aria-label={`Edit ${user.name}`}
                            onClick={() => setEditing(user)}
                            size="sm"
                            variant="ghost"
                          >
                            <PencilLine size={15} />
                          </Button>

                          <Button
                            aria-label={`Reset password ${user.name}`}
                            onClick={() => setResetting(user)}
                            size="sm"
                            variant="ghost"
                          >
                            <KeyRound size={15} />
                          </Button>

                          {isActive ? (
                            <Button
                              aria-label={`Nonaktifkan ${user.name}`}
                              onClick={() => void remove(user)}
                              size="sm"
                              variant="ghost"
                            >
                              <Trash2
                                className="text-rose-600"
                                size={15}
                              />
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Pengguna tidak ditemukan"
            description="Ubah kata pencarian atau buat pengguna baru."
          />
        )}
      </Card>

      <Modal
        open={editing !== null}
        onClose={closeEditModal}
        title={
          editing === "new"
            ? "Tambah pengguna"
            : "Edit pengguna"
        }
        description="Perubahan tarif hanya berlaku untuk pekerjaan berikutnya; transaksi lama tetap memakai snapshot."
      >
        {editing ? (
          <form
            className="space-y-4"
            onSubmit={saveUser}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama lengkap">
                <Input
                  defaultValue={
                    editing === "new" ? "" : editing.name
                  }
                  name="name"
                  required
                />
              </Field>

              <Field label="Username">
                <Input
                  autoCapitalize="none"
                  autoComplete="off"
                  defaultValue={
                    editing === "new"
                      ? ""
                      : editing.username
                  }
                  name="username"
                  pattern="[a-z0-9._-]{3,50}"
                  required
                />
              </Field>
            </div>

            {editing === "new" ? (
              <Field
                label="Password awal"
                hint={`Minimal ${PASSWORD_MIN_LENGTH} karakter. Pengguna dapat menggantinya setelah login.`}
              >
                <Input
                  autoComplete="new-password"
                  maxLength={PASSWORD_MAX_LENGTH}
                  minLength={PASSWORD_MIN_LENGTH}
                  name="password"
                  required
                  type="password"
                />
              </Field>
            ) : null}

            <Field label="Tarif harian">
              <Input
                defaultValue={
                  editing === "new"
                    ? "0"
                    : editing.dailyRate
                }
                min="0"
                name="dailyRate"
                required
                type="number"
              />
            </Field>

            {editing !== "new" ? (
              <>
                <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  <input
                    defaultChecked={
                      editing.isActive &&
                      !editing.deletedAt
                    }
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    name="isActive"
                    type="checkbox"
                  />

                  {editing.isActive &&
                  !editing.deletedAt ? (
                    <UserCheck
                      className="text-emerald-600"
                      size={17}
                    />
                  ) : (
                    <UserX
                      className="text-rose-600"
                      size={17}
                    />
                  )}

                  Akun aktif
                </label>

                <Field label="Alasan perubahan">
                  <Input
                    minLength={3}
                    name="reason"
                    placeholder="Contoh: Penyesuaian tarif mulai hari ini"
                    required
                  />
                </Field>
              </>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
              <Button
                onClick={closeEditModal}
                type="button"
                variant="secondary"
              >
                Batal
              </Button>

              <Button type="submit">
                Simpan pengguna
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={resetting !== null}
        onClose={closeResetPasswordModal}
        size="sm"
        title="Reset password"
        description={
          resetting
            ? `Buat password baru untuk ${resetting.name}. Semua sesi lama akan dikeluarkan.`
            : undefined
        }
      >
        <form
          className="space-y-4"
          onSubmit={resetPassword}
        >
          <Field
            label="Password baru"
            hint={`Minimal ${PASSWORD_MIN_LENGTH} karakter.`}
          >
            <Input
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              minLength={PASSWORD_MIN_LENGTH}
              name="newPassword"
              required
              type="password"
            />
          </Field>

          <Field label="Alasan">
            <Input
              defaultValue="Reset password atas permintaan pengguna"
              minLength={3}
              name="reason"
              required
            />
          </Field>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              onClick={closeResetPasswordModal}
              type="button"
              variant="secondary"
            >
              Batal
            </Button>

            <Button type="submit">
              <KeyRound size={15} />
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </Page>
  );
}