import { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Tooltip,
  Spinner,
} from "@heroui/react";
import { useNavigate } from "react-router-dom";
import type { KonfigurasiResponse } from "../../services/config.service";

// util kecil untuk SweetAlert2 tanpa bikin import merah kalau paket belum terpasang
async function sweetAlert(
  type: "toast" | "confirm" | "alert",
  opts: {
    title?: string;
    text?: string;
    icon?: "success" | "error" | "warning" | "info" | "question";
    confirmText?: string;
    cancelText?: string;
  } = {}
) {
  const Swal = (await import("sweetalert2")).default;

  if (type === "toast") {
    return Swal.fire({
      title: opts.title ?? "Berhasil",
      icon: opts.icon ?? "success",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 1400,
      timerProgressBar: true,
    });
  }

  if (type === "confirm") {
    const res = await Swal.fire({
      title: opts.title ?? "Lanjut?",
      text: opts.text,
      icon: opts.icon ?? "question",
      showCancelButton: true,
      confirmButtonText: opts.confirmText ?? "Ya",
      cancelButtonText: opts.cancelText ?? "Batal",
      reverseButtons: true,
    });
    return res.isConfirmed;
  }

  return Swal.fire({
    title: opts.title ?? "Info",
    text: opts.text,
    icon: opts.icon ?? "info",
  });
}

type Props = {
  username: string;
  data: KonfigurasiResponse | null;
  loading?: boolean;
  /** dipanggil saat klik Refresh; boleh async */
  onRefresh?: () => Promise<void> | void;
};

export default function EffectiveConfigCard({
  username,
  data,
  loading = false,
  onRefresh,
}: Props) {
  const nav = useNavigate();
  const [internalLoading, setInternalLoading] = useState(false);
  const busy = loading || internalLoading;

  const gajiPerJam = data?.gajiPerJam ?? 0;
  const batasJeda = data?.batasJedaMenit ?? 0;
  const jedaAktif = !!data?.jedaOtomatisAktif;

  async function handleOpenGlobal() {
    const ok = await sweetAlert("confirm", {
      title: "Buka Global Config?",
      text: "Kamu akan diarahkan ke halaman konfigurasi global.",
      icon: "question",
      confirmText: "Buka",
      cancelText: "Batal",
    });
    if (ok) nav("/config/global");
  }

  async function handleOpenOverride() {
    const ok = await sweetAlert("confirm", {
      title: "Kelola Override per User?",
      text: "Kamu akan diarahkan ke halaman pengaturan override.",
      icon: "question",
      confirmText: "Lanjut",
      cancelText: "Batal",
    });
    if (ok) nav("/config/overrides");
  }

  async function handleRefresh() {
    if (!onRefresh) return;
    try {
      setInternalLoading(true);
      await onRefresh();
      await sweetAlert("toast", { title: "Konfigurasi diperbarui", icon: "success" });
    } catch (e: unknown) {
      await sweetAlert("alert", {
        title: "Gagal memperbarui",
        text: e instanceof Error ? e.message : "Terjadi kesalahan tak terduga.",
        icon: "error",
      });
    } finally {
      setInternalLoading(false);
    }
  }

  return (
    <Card className="rounded-2xl shadow-sm border border-default-200 bg-content1/70">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center size-10 rounded-xl bg-primary-100 text-primary-700">
            {/* ikon sederhana */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 5h16v2H4zM4 9h16v10H4zM6 11v6h12v-6H6z" />
            </svg>
          </div>

        <div>
          <div className="text-base font-semibold">Konfigurasi Efektif</div>
          <div className="text-foreground-500 text-xs">Ringkasan pengaturan aktif</div>
        </div>
        </div>

        <div className="flex items-center gap-2">
          {username && <Chip variant="flat">{username}</Chip>}

          <Tooltip content="Atur konfigurasi global" placement="top">
            <Button size="sm" variant="flat" radius="lg" onPress={handleOpenGlobal}>
              Atur Global
            </Button>
          </Tooltip>

          <Tooltip content="Kelola override per user" placement="top">
            <Button
              size="sm"
              variant="flat"
              color="warning"
              radius="lg"
              onPress={handleOpenOverride}
            >
              Kelola Override
            </Button>
          </Tooltip>

          <Tooltip content="Muat ulang konfigurasi" placement="top">
            <Button
              size="sm"
              variant="solid"
              color="primary"
              radius="lg"
              onPress={handleRefresh}
              isLoading={busy}
            >
              {busy ? "Memuat…" : "Refresh"}
            </Button>
          </Tooltip>
        </div>
      </CardHeader>

      <CardBody>
        {busy && (
          <div className="flex items-center gap-2 text-sm text-foreground-500 mb-4">
            <Spinner size="sm" /> Memuat konfigurasi…
          </div>
        )}

        {/* 3 statistik ringkas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Stat
            label="Gaji per Jam"
            value={gajiPerJam.toLocaleString("id-ID")}
            hint="Nilai dasar per jam"
          />
          <Stat
            label="Batas Jeda (menit)"
            value={batasJeda.toLocaleString("id-ID")}
            hint="Auto pause jika melebihi"
          />
          <div className="p-4 rounded-xl border bg-content2/50">
            <div className="text-sm text-foreground-500 mb-2">Jeda Otomatis</div>
            <div className="flex items-center gap-2">
              <Chip
                variant="flat"
                color={jedaAktif ? "success" : "default"}
                className="font-medium"
                size="sm"
              >
                {jedaAktif ? "Aktif" : "Nonaktif"}
              </Chip>
              <span className="text-xs text-foreground-500">
                {jedaAktif ? "Sesi akan jeda otomatis" : "Tidak ada jeda otomatis"}
              </span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="p-4 rounded-xl border bg-content2/50">
      <div className="text-sm text-foreground-500">{label}</div>
      <div className="text-3xl leading-tight font-semibold mt-1">{value}</div>
      {hint && <div className="text-xs text-foreground-500 mt-1">{hint}</div>}
    </div>
  );
}
