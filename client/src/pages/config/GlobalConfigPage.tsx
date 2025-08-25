import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, Input, Spacer, Switch, Tooltip } from "@heroui/react";
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
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [gajiPerJam, setGajiPerJam] = useState<number>(0);
  const [batasJedaMenit, setBatasJedaMenit] = useState<number>(0);
  const [jedaOtomatisAktif, setJedaOtomatisAktif] = useState<boolean>(false);

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
    <div className="px-4 py-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="flat"
            onPress={() => nav(-1)}
            startContent={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z" />
              </svg>
            }
          >
            Kembali
          </Button>
          <h1 className="text-3xl font-extrabold tracking-tight">Global Config</h1>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip content="Muat ulang dari server">
            <Button size="sm" variant="flat" onPress={() => void load()} isLoading={loading}>
              Refresh
            </Button>
          </Tooltip>
          <Button size="sm" color="primary" variant="solid" onPress={() => void onSave()} isLoading={saving}>
            Simpan Global
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border border-default-200 shadow-sm">
        <CardHeader className="text-xl font-semibold">Edit Global Config</CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <Input
              label="Gaji per Jam (Rp)"
              type="number"
              value={String(gajiPerJam ?? "")}
              onChange={(e) => setGajiPerJam(Number(e.target.value || 0))}
              isDisabled={loading}
              labelPlacement="outside"
              placeholder="mis. 15000"
            />
            <Input
              label="Batas Jeda (menit)"
              type="number"
              value={String(batasJedaMenit ?? "")}
              onChange={(e) => setBatasJedaMenit(Number(e.target.value || 0))}
              isDisabled={loading}
              labelPlacement="outside"
              placeholder="mis. 10"
            />
            <div className="flex items-center gap-3">
              <Switch isSelected={jedaOtomatisAktif} onValueChange={setJedaOtomatisAktif} isDisabled={loading}>
                Jeda Otomatis Aktif
              </Switch>
            </div>
          </div>

          <Spacer y={2} />

          <div className="flex justify-end gap-2">
            <Button variant="flat" onPress={() => void load()} isDisabled={loading || saving}>
              Reset
            </Button>
            <Button color="primary" onPress={() => void onSave()} isLoading={saving}>
              Simpan Global
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
