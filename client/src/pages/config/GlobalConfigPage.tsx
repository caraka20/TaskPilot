import { useEffect, useState, useCallback } from "react";
import { Button, Card, CardBody, CardHeader, Input, Switch } from "@heroui/react";
import { RefreshCw, Save, Settings2 } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import { useApi } from "../../hooks/useApi";
import { getGlobalConfig, saveGlobalConfigCompat } from "../../services/config.service";

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
  const gajiInvalid = !Number.isFinite(gajiPerJam) || gajiPerJam <= 0;
  const jedaInvalid = !Number.isFinite(batasJedaMenit) || batasJedaMenit < 0;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = await getGlobalConfig(api);
      setGajiPerJam(cfg?.gajiPerJam ?? 0);
      setBatasJedaMenit(cfg?.batasJedaMenit ?? 0);
      setJedaOtomatisAktif(!!cfg?.jedaOtomatisAktif);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  async function onSave() {
    const Swal = await swal();

    if (!Number.isFinite(gajiPerJam) || gajiPerJam <= 0) {
      await Swal.fire({ title: "Validasi Gagal", text: "Gaji per jam harus > 0.", icon: "error" });
      return;
    }
    if (!Number.isFinite(batasJedaMenit) || batasJedaMenit < 0) {
      await Swal.fire({ title: "Validasi Gagal", text: "Batas jeda tidak boleh negatif.", icon: "error" });
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
    <div className="mx-auto w-full max-w-5xl space-y-5 py-2 sm:py-4">
      <PageHeader
        eyebrow="Konfigurasi owner"
        title="Pengaturan global"
        description="Nilai dasar yang berlaku untuk seluruh pengguna, kecuali pengguna yang memiliki override khusus."
        icon={<Settings2 className="h-5 w-5" />}
        backTo="/config/effective"
        actions={
          <>
            <Button
              variant="flat"
              className="min-h-11 flex-1 rounded-2xl sm:flex-none"
              onPress={() => void load()}
              isLoading={loading}
              startContent={!loading && <RefreshCw className="h-4 w-4" />}
            >
              Muat ulang
            </Button>
            <Button
              color="primary"
              className="min-h-11 flex-1 rounded-2xl sm:flex-none"
              onPress={() => void onSave()}
              isLoading={saving}
              isDisabled={loading || gajiInvalid || jedaInvalid}
              startContent={!saving && <Save className="h-4 w-4" />}
            >
              Simpan
            </Button>
          </>
        }
      />

      <Card className="rounded-3xl border border-default-200/80 bg-content1 shadow-sm">
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
              errorMessage={!loading && gajiInvalid ? "Gaji per jam harus lebih dari 0." : undefined}
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
              errorMessage={!loading && jedaInvalid ? "Batas jeda tidak boleh negatif." : undefined}
              description="Durasi tidak aktif sebelum jeda otomatis dijalankan."
              classNames={{ inputWrapper: "min-h-12 rounded-2xl" }}
            />
            <div className="rounded-2xl border border-default-200 bg-default-50 p-4 md:col-span-2">
              <Switch isSelected={jedaOtomatisAktif} onValueChange={setJedaOtomatisAktif} isDisabled={loading}>
                <span className="font-semibold">Jeda otomatis aktif</span>
              </Switch>
              <p className="mt-2 text-sm leading-6 text-foreground-500">
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
