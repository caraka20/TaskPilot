import { useEffect, useState } from "react";
import { Button, Card, CardBody, Chip, Input } from "@heroui/react";
import { Activity, ArrowLeft, Globe2, Search, SlidersHorizontal, Trash2, UserRound, UserRoundCog } from "lucide-react";
import { Link } from "react-router-dom";

import WorkspacePageHeader from "../../components/common/WorkspacePageHeader";
import ConfigForm from "../../components/config/ConfigForm";
import { useApi } from "../../hooks/useApi";
import {
  deleteUserOverride,
  getEffectiveConfig,
  putUserOverride,
  type EffectiveKonfigurasiResponse,
  type KonfigurasiResponse,
} from "../../services/config.service";
import { showConfirm, showToast } from "../../utils/alert";

export default function OverridesConfigPage() {
  const api = useApi();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [effective, setEffective] = useState<EffectiveKonfigurasiResponse | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);

  const normalizedUsername = username.trim();

  async function loadEffective() {
    if (!normalizedUsername) return;
    setLoading(true);
    setMessage(null);
    try {
      const result = await getEffectiveConfig(api, normalizedUsername);
      setEffective(result);
      if (!result) setMessage({ tone: "info", text: "Pengguna ini memakai konfigurasi global." });
    } catch (cause) {
      setEffective(null);
      setMessage({
        tone: "error",
        text: cause instanceof Error ? cause.message : "Gagal memuat konfigurasi pengguna.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function upsertOverride(values: KonfigurasiResponse) {
    if (!normalizedUsername) return;
    const confirmation = await showConfirm({
      title: `Simpan override ${normalizedUsername}?`,
      text: "Nilai ini akan menggantikan konfigurasi global untuk pengguna tersebut.",
      confirmText: "Simpan override",
      tone: "primary",
    });
    if (!confirmation.isConfirmed) return;
    setLoading(true);
    setMessage(null);
    try {
      await putUserOverride(api, normalizedUsername, values);
      const result = await getEffectiveConfig(api, normalizedUsername);
      setEffective(result);
      setMessage({ tone: "success", text: "Override berhasil disimpan." });
      await showToast("Override pengguna berhasil disimpan.");
    } catch (cause) {
      setMessage({
        tone: "error",
        text: cause instanceof Error ? cause.message : "Gagal menyimpan override.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function removeOverride() {
    if (!normalizedUsername) return;
    const confirmation = await showConfirm({
      title: `Hapus override ${normalizedUsername}?`,
      text: "Pengguna akan kembali mengikuti konfigurasi global.",
      confirmText: "Hapus override",
      tone: "danger",
    });
    if (!confirmation.isConfirmed) return;
    setLoading(true);
    setMessage(null);
    try {
      await deleteUserOverride(api, normalizedUsername);
      const result = await getEffectiveConfig(api, normalizedUsername);
      setEffective(result);
      setMessage({ tone: "success", text: "Override dihapus. Pengguna kembali memakai konfigurasi global." });
      await showToast("Override dihapus. Konfigurasi global kembali berlaku.");
    } catch (cause) {
      setMessage({
        tone: "error",
        text: cause instanceof Error ? cause.message : "Gagal menghapus override.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setEffective(null);
    setMessage(null);
  }, [username]);

  const statusClasses = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    error: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
    info: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
  };

  return (
    <div className="app-page-shell">
      <WorkspacePageHeader
        eyebrow="ARTECH • Konfigurasi owner"
        title="Override pengguna"
        description="Terapkan pengaturan khusus untuk satu pengguna tanpa mengubah konfigurasi global pengguna lainnya."
        icon={UserRoundCog}
        actions={
          <Button
            as={Link}
            to="/config/effective"
            variant="flat"
            className="min-h-10 rounded-xl border border-white/15 bg-white/10 font-semibold text-white hover:bg-white/15"
            startContent={<ArrowLeft className="h-4 w-4" />}
          >
            Konfigurasi efektif
          </Button>
        }
        metrics={[
          {
            label: "Pengguna target",
            value: normalizedUsername || "Belum dipilih",
            icon: UserRound,
            tone: "cyan",
          },
          {
            label: "Sumber konfigurasi",
            value:
              effective?.scope === "USER"
                ? "Override pengguna"
                : effective
                  ? "Konfigurasi global"
                  : "Belum dimuat",
            icon: Globe2,
            tone: effective?.scope === "USER" ? "violet" : "indigo",
          },
          {
            label: "Status",
            value: loading ? "Memuat…" : message?.tone === "error" ? "Perlu diperiksa" : "Siap dikelola",
            icon: Activity,
            tone: message?.tone === "error" ? "amber" : "emerald",
          },
        ]}
      />

      <Card className="app-section shadow-none">
        <CardBody className="gap-4 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-bold">Cari pengguna</h2>
            <p className="mt-1 text-sm text-foreground-500">
              Masukkan username persis seperti yang terdaftar pada sistem.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Input
              label="Username"
              labelPlacement="outside"
              placeholder="contoh: raka20"
              value={username}
              onValueChange={setUsername}
              onKeyDown={(event) => event.key === "Enter" && void loadEffective()}
              autoComplete="off"
              className="flex-1"
              classNames={{ inputWrapper: "min-h-12 rounded-2xl" }}
              startContent={<Search className="h-4 w-4 text-foreground-400" />}
            />
            <Button
              color="primary"
              className="min-h-12 rounded-2xl sm:min-w-36"
              onPress={() => void loadEffective()}
              isLoading={loading}
              isDisabled={!normalizedUsername}
              startContent={!loading && <Search className="h-4 w-4" />}
            >
              Muat konfigurasi
            </Button>
            <Button
              color="danger"
              variant="flat"
              className="min-h-12 rounded-2xl sm:min-w-36"
              onPress={() => void removeOverride()}
              isDisabled={!normalizedUsername || loading || effective?.scope !== "USER"}
              startContent={<Trash2 className="h-4 w-4" />}
            >
              Hapus override
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card className="app-section shadow-none">
        <CardBody className="gap-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Konfigurasi efektif</h2>
              <p className="mt-1 text-sm text-foreground-500">Nilai yang saat ini berlaku untuk pengguna terpilih.</p>
            </div>
            <Chip variant="flat" startContent={<SlidersHorizontal className="h-3.5 w-3.5" />}>
              {effective?.scope === "USER" ? "Override user" : effective ? "Konfigurasi global" : normalizedUsername || "Belum dipilih"}
            </Chip>
          </div>

          {!normalizedUsername ? (
            <p className="rounded-2xl border border-dashed border-default-300 p-5 text-sm text-foreground-500">
              Masukkan username dan pilih “Muat konfigurasi” untuk melihat nilai efektif.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Gaji per jam", effective?.gajiPerJam != null ? `Rp ${Number(effective.gajiPerJam).toLocaleString("id-ID")}` : "—"],
                ["Batas jeda", effective?.batasJedaMenit != null ? `${effective.batasJedaMenit} menit` : "—"],
                ["Jeda otomatis", effective ? (effective.jedaOtomatisAktif ? "Aktif" : "Nonaktif") : "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-default-200 bg-default-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground-400">{label}</p>
                  <p className="mt-2 break-words text-lg font-bold">{value}</p>
                </div>
              ))}
            </div>
          )}

          {effective && (
            <div className="grid gap-3 border-t border-default-200/70 pt-5 text-sm sm:grid-cols-2">
              <p><span className="text-foreground-500">Terakhir diperbarui:</span> <strong>{effective.updatedAt ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(effective.updatedAt)) : "Belum tercatat"}</strong></p>
              <p><span className="text-foreground-500">Diperbarui oleh:</span> <strong>{effective.updatedBy?.namaLengkap || effective.updatedBy?.username || "Belum tercatat"}</strong></p>
            </div>
          )}
        </CardBody>
      </Card>

      <ConfigForm
        title="Atur override"
        initial={effective ?? undefined}
        loading={loading}
        submitLabel="Simpan override"
        onSubmit={upsertOverride}
      />

      {message && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${statusClasses[message.tone]}`}
          role={message.tone === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
