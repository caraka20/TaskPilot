import { useEffect, useState, useCallback } from "react";
import { Button, Card, CardBody, CardHeader, Input, Switch } from "@heroui/react";
import { ArrowLeft, Banknote, Clock3, History, RefreshCw, Save, Settings2, TimerReset, UserRound, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import WorkspacePageHeader from "../../components/common/WorkspacePageHeader";
import { useApi } from "../../hooks/useApi";
import { getGlobalConfig, saveGlobalConfigCompat, type KonfigurasiResponse } from "../../services/config.service";

/** Lazy load SweetAlert2 */
async function swal() {
  const s = await import("sweetalert2");
  return s.default;
}

type GlobalPayload = {
  gajiPerJam: number;
  batasJedaMenit: number;
  jedaOtomatisAktif: boolean;
};

export default function GlobalConfigPage() {
  const api = useApi();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [gajiPerJam, setGajiPerJam] = useState<number>(0);
  const [batasJedaMenit, setBatasJedaMenit] = useState<number>(0);
  const [jedaOtomatisAktif, setJedaOtomatisAktif] = useState<boolean>(false);
  const [meta, setMeta] = useState<Pick<KonfigurasiResponse, "updatedAt" | "updatedBy">>({});
  const gajiInvalid = !Number.isFinite(gajiPerJam) || gajiPerJam < 1000;
  const jedaInvalid = !Number.isFinite(batasJedaMenit) || batasJedaMenit < 1 || batasJedaMenit > 120;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = await getGlobalConfig(api);
      setGajiPerJam(cfg?.gajiPerJam ?? 0);
      setBatasJedaMenit(cfg?.batasJedaMenit ?? 0);
      setJedaOtomatisAktif(!!cfg?.jedaOtomatisAktif);
      setMeta({ updatedAt: cfg.updatedAt, updatedBy: cfg.updatedBy });
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  async function onSave() {
    const Swal = await swal();

    if (!Number.isFinite(gajiPerJam) || gajiPerJam < 1000) {
      await Swal.fire({ title: "Validasi Gagal", text: "Gaji per jam minimal Rp 1.000.", icon: "error" });
      return;
    }
    if (!Number.isFinite(batasJedaMenit) || batasJedaMenit < 1 || batasJedaMenit > 120) {
      await Swal.fire({ title: "Validasi Gagal", text: "Batas jeda harus 1–120 menit.", icon: "error" });
      return;
    }

    const confirm = await Swal.fire({
      title: "Simpan Global Config?",
      text: "Perubahan berlaku untuk seluruh user (kecuali override).",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Simpan",
      cancelButtonText: "Batal",
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      const payload: GlobalPayload = { gajiPerJam, batasJedaMenit, jedaOtomatisAktif };
      await saveGlobalConfigCompat(api, payload);

      await Swal.fire({
        title: "Tersimpan!",
        text: "Global config berhasil disimpan.",
        icon: "success",
        timer: 1400,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });

      void load();
    } catch (e: any) {
      await Swal.fire({
        title: "Gagal menyimpan",
        text: e?.response?.data?.message ?? e?.message ?? "Terjadi kesalahan tak terduga.",
        icon: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-page-shell">
      <WorkspacePageHeader
        eyebrow="ARTECH • Konfigurasi owner"
        title="Pengaturan global"
        description="Nilai dasar yang berlaku untuk seluruh pengguna, kecuali pengguna yang memiliki override khusus."
        icon={Settings2}
        actions={
          <>
            <Button
              as={Link}
              to="/config/effective"
              variant="flat"
              className="min-h-10 rounded-xl border border-white/15 bg-white/10 font-semibold text-white hover:bg-white/15"
              startContent={<ArrowLeft className="h-4 w-4" />}
            >
              Konfigurasi efektif
            </Button>
            <Button
              variant="flat"
              className="min-h-10 rounded-xl border border-white/15 bg-white/10 font-semibold text-white hover:bg-white/15"
              onPress={() => void load()}
              isLoading={loading}
              startContent={!loading && <RefreshCw className="h-4 w-4" />}
            >
              Muat ulang
            </Button>
            <Button
              className="min-h-10 rounded-xl bg-white font-semibold text-[#0b2948] shadow-sm"
              onPress={() => void onSave()}
              isLoading={saving}
              isDisabled={loading || gajiInvalid || jedaInvalid}
              startContent={!saving && <Save className="h-4 w-4" />}
            >
              Simpan
            </Button>
          </>
        }
        metrics={[
          {
            label: "Gaji per jam",
            value: loading ? "Memuat…" : `Rp ${Number(gajiPerJam || 0).toLocaleString("id-ID")}`,
            icon: Banknote,
            tone: "emerald",
          },
          {
            label: "Batas jeda",
            value: loading ? "Memuat…" : `${Number(batasJedaMenit || 0)} menit`,
            icon: TimerReset,
            tone: "cyan",
          },
          {
            label: "Jeda otomatis",
            value: loading ? "Memuat…" : jedaOtomatisAktif ? "Aktif" : "Nonaktif",
            icon: Zap,
            tone: jedaOtomatisAktif ? "emerald" : "amber",
          },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="app-section flex items-center gap-4 p-5">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300"><History className="h-5 w-5" /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground-400">Terakhir diperbarui</p>
            <p className="mt-1 font-semibold">{meta.updatedAt ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date(meta.updatedAt)) : "Belum tercatat"}</p>
          </div>
        </div>
        <div className="app-section flex items-center gap-4 p-5">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"><UserRound className="h-5 w-5" /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground-400">Diperbarui oleh</p>
            <p className="mt-1 font-semibold">{meta.updatedBy?.namaLengkap || meta.updatedBy?.username || "Belum tercatat"}</p>
          </div>
        </div>
      </div>

      <Card className="app-section shadow-none">
        <CardHeader className="flex-col items-start gap-1 px-5 pb-0 pt-5 sm:px-6 sm:pt-6">
          <h2 className="text-lg font-bold">Nilai konfigurasi</h2>
          <p className="text-sm text-foreground-500">Periksa nilai sebelum menyimpan karena perubahan langsung memengaruhi perhitungan sistem.</p>
        </CardHeader>
        <CardBody className="gap-6 p-5 sm:p-6">
          <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
            <Input
              label="Gaji per Jam (Rp)"
              type="number"
              value={String(gajiPerJam ?? "")}
              onChange={(e) => setGajiPerJam(Number(e.target.value || 0))}
              isDisabled={loading}
              labelPlacement="outside"
              placeholder="mis. 15000"
              inputMode="numeric"
              isInvalid={!loading && gajiInvalid}
              min={1000}
              errorMessage={!loading && gajiInvalid ? "Tarif minimal Rp 1.000 per jam." : undefined}
              description="Tarif dasar untuk menghitung total gaji dari durasi kerja."
              classNames={{ inputWrapper: "min-h-12 rounded-2xl" }}
            />
            <Input
              label="Batas Jeda (menit)"
              type="number"
              value={String(batasJedaMenit ?? "")}
              onChange={(e) => setBatasJedaMenit(Number(e.target.value || 0))}
              isDisabled={loading}
              labelPlacement="outside"
              placeholder="mis. 10"
              inputMode="numeric"
              isInvalid={!loading && jedaInvalid}
              min={1}
              max={120}
              errorMessage={!loading && jedaInvalid ? "Batas jeda harus 1–120 menit." : undefined}
              description="Durasi tidak aktif sebelum jeda otomatis dijalankan."
              classNames={{ inputWrapper: "min-h-12 rounded-2xl" }}
            />
            <div className="rounded-2xl bg-default-50 p-4 ring-1 ring-default-200/70 md:col-span-2">
              <Switch isSelected={jedaOtomatisAktif} onValueChange={setJedaOtomatisAktif} isDisabled={loading}>
                <span className="font-semibold">Jeda otomatis aktif</span>
              </Switch>
              <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-foreground-500">
                <Clock3 className="mt-1 h-4 w-4 shrink-0" />
                Ketika aktif, sistem dapat menjeda sesi kerja setelah batas waktu yang ditentukan.
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-default-200 pt-5 sm:flex-row sm:justify-end">
            <Button variant="flat" className="min-h-11 rounded-2xl" onPress={() => void load()} isDisabled={loading || saving}>
              Reset
            </Button>
            <Button
              color="primary"
              className="min-h-11 rounded-2xl"
              onPress={() => void onSave()}
              isLoading={saving}
              isDisabled={loading || gajiInvalid || jedaInvalid}
              startContent={!saving && <Save className="h-4 w-4" />}
            >
              Simpan pengaturan global
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
