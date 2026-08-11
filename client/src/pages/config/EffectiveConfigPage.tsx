import { useCallback, useEffect, useState } from "react";
import { Button, Card, CardBody, Chip, Skeleton } from "@heroui/react";
import { Clock3, RefreshCw, Settings2, TimerReset, Wallet2 } from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import StatePanel from "../../components/common/StatePanel";
import { useApi } from "../../hooks/useApi";
import { getEffectiveConfig, type KonfigurasiResponse } from "../../services/config.service";
import { useAuthStore } from "../../store/auth.store";

export default function EffectiveConfigPage() {
  const api = useApi();
  const { username } = useAuthStore();
  const [config, setConfig] = useState<KonfigurasiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!username) {
      setConfig(null);
      setError("Username pengguna tidak tersedia.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setConfig(await getEffectiveConfig(api, username));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal memuat konfigurasi efektif.");
    } finally {
      setLoading(false);
    }
  }, [api, username]);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = [
    {
      label: "Gaji per jam",
      value:
        typeof config?.gajiPerJam === "number"
          ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(config.gajiPerJam)
          : "—",
      hint: "Tarif yang digunakan pada perhitungan jam kerja.",
      icon: Wallet2,
      tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    },
    {
      label: "Batas jeda",
      value: typeof config?.batasJedaMenit === "number" ? `${config.batasJedaMenit} menit` : "—",
      hint: "Batas aktivitas sebelum sistem menjalankan jeda.",
      icon: Clock3,
      tone: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    },
    {
      label: "Jeda otomatis",
      value: config ? (config.jedaOtomatisAktif ? "Aktif" : "Nonaktif") : "—",
      hint: config?.jedaOtomatisAktif
        ? "Sistem dapat menjeda sesi secara otomatis."
        : "Sesi tidak dijeda secara otomatis.",
      icon: TimerReset,
      tone: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 py-2 sm:py-4">
      <PageHeader
        eyebrow="Konfigurasi"
        title="Pengaturan efektif"
        description="Ringkasan pengaturan yang sedang berlaku untuk akun Anda, termasuk konfigurasi global dan override pengguna."
        icon={<Settings2 className="h-5 w-5" />}
        actions={
          <>
            <Chip variant="flat" className="max-w-full truncate">{username || "Pengguna"}</Chip>
            <Button
              color="primary"
              variant="flat"
              className="min-h-11 flex-1 rounded-2xl sm:flex-none"
              onPress={() => void load()}
              isLoading={loading}
              startContent={!loading && <RefreshCw className="h-4 w-4" />}
            >
              Muat ulang
            </Button>
          </>
        }
      />

      {error ? (
        <StatePanel
          kind="error"
          title="Konfigurasi tidak dapat dimuat"
          description={error}
          actionLabel="Coba lagi"
          onAction={() => void load()}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map(({ label, value, hint, icon: Icon, tone }) => (
            <Card key={label} className="rounded-3xl border border-default-200/80 bg-content1 shadow-sm">
              <CardBody className="gap-4 p-5 sm:p-6">
                <div className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground-500">{label}</p>
                  {loading ? (
                    <Skeleton className="mt-2 h-8 w-32 rounded-xl" />
                  ) : (
                    <p className="mt-1 break-words text-2xl font-extrabold tracking-tight text-foreground">
                      {value}
                    </p>
                  )}
                  <p className="mt-2 text-sm leading-6 text-foreground-500">{hint}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
