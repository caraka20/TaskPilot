import { useEffect, useState } from "react";
import { Chip, Button, Tooltip } from "@heroui/react";
import { Link } from "react-router-dom";
import type { UserDetail } from "../../../services/users.service";
import { computeRunningSecondsAndStart, ymdLocalStr } from "../../../utils/jamkerja";
import { Clock3, Settings2 } from "lucide-react";
import { useApi } from "../../../hooks/useApi";
import { getEffectiveConfig, type KonfigurasiResponse } from "../../../services/config.service";
import JamControls from "../../../components/jam-kerja/JamControls";

type AdminJamStatus = "TIDAK_AKTIF" | "AKTIF" | "JEDA";

interface Props {
  username: string;
  onChanged: () => void;
  userDetail?: UserDetail | null;
}

export default function KendaliJamKerjaCard({ username, onChanged, userDetail }: Props) {
  const api = useApi();

  const list = Array.isArray(userDetail?.jamKerja) ? ((userDetail as any).jamKerja as any[]) : [];

  // segmen yang masih berjalan (jamSelesai null)
  const open = list.find((r) => r && r.jamSelesai == null) ?? null;
  // fallback ke entri terbaru bila tidak ada yang berjalan
  const latest = open ?? list[0] ?? null;

  const status: AdminJamStatus =
    latest?.status === "AKTIF" ? "AKTIF" :
    latest?.status === "JEDA"  ? "JEDA"  :
    "TIDAK_AKTIF";

  const activeSessionId: number | null =
    open && typeof open.id === "number" ? open.id : null;

  // Bila status JEDA dan baris jeda SUDAH DITUTUP (jamSelesai != null), jadikan target resume.
  const resumeTargetId: number | null =
    status === "JEDA" && latest?.jamSelesai != null && typeof latest?.id === "number"
      ? latest.id
      : null;

  // === DETIK BERJALAN & startedAt (konsisten dengan halaman user) ===
  const { seconds: detikBerjalan, startedAt } = computeRunningSecondsAndStart(list);
  const serverNow = new Date().toISOString();

  // (opsional, jika ada kebutuhan memajang basis hari)
  void ymdLocalStr(open?.jamMulai ?? new Date());

  // === Effective config (untuk menampilkan info jeda otomatis) ===
  const [effCfg, setEffCfg] = useState<KonfigurasiResponse | null>(null);
  const [cfgLoading, setCfgLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setCfgLoading(true);
      try {
        const cfg = await getEffectiveConfig(api, username);
        if (mounted) setEffCfg(cfg ?? null);
      } finally {
        if (mounted) setCfgLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [api, username]);

  return (
    <section className="overflow-hidden rounded-[22px] border border-default-200/80 bg-content1 shadow-[0_10px_30px_rgba(15,23,42,.05)]">
      <div className="flex flex-col gap-3 border-b border-default-200/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Clock3 className="h-4 w-4" /></span>
          <div><p className="font-bold text-foreground">Kendali jam kerja</p><p className="mt-0.5 text-xs text-foreground-500">Kontrol sesi aktif milik @{username}</p></div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chip size="sm" variant="flat" className="font-mono">{username}</Chip>
          <Tooltip content="Buka pengaturan override user ini">
            <Button
              as={Link}
              to={`/config/overrides?username=${encodeURIComponent(username)}`}
              size="sm"
              className="min-h-10 rounded-xl font-semibold"
              variant="flat"
              startContent={<Settings2 className="h-4 w-4" />}
            >
              Override Config
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <JamControls
          mode="owner"
          targetUsername={username}
          status={status}
          activeSessionId={activeSessionId ?? undefined}
          resumeTargetId={resumeTargetId ?? undefined}
          detikBerjalan={detikBerjalan}
          startedAt={startedAt ?? null}
          serverNow={serverNow}
          onChanged={onChanged}
          autoPauseEnabled={Boolean(effCfg?.jedaOtomatisAktif)}
          autoPauseMinutes={Number.isFinite(effCfg?.batasJedaMenit as number)
            ? Math.max(1, Number(effCfg?.batasJedaMenit))
            : 5}
        />

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-default-50 px-4 py-3 text-xs text-foreground-500 dark:bg-default-100/50">
          <Settings2 className="h-3.5 w-3.5 shrink-0 text-primary" />
          {cfgLoading
            ? "Memuat konfigurasi jeda otomatis…"
            : effCfg
              ? `Jeda otomatis: ${effCfg.jedaOtomatisAktif ? "Aktif" : "Nonaktif"} • Batas ${effCfg.batasJedaMenit ?? 0} menit`
              : "Jeda otomatis: —"}
        </div>
      </div>
    </section>
  );
}
