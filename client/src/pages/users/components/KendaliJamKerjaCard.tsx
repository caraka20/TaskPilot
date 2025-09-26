import { useEffect, useState } from "react";
import { Card, CardBody, Chip, Button, Tooltip } from "@heroui/react";
import { Link } from "react-router-dom";
import type { UserDetail } from "../../../services/users.service";
import { computeRunningSecondsAndStart, ymdLocalStr } from "../../../utils/jamkerja";
import { Settings2 } from "lucide-react";
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
    <Card shadow="sm" className="border border-default-100">
      <CardBody className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-foreground-500">Kendali Jam Kerja</div>

          <div className="flex items-center gap-2">
            <Chip size="sm" variant="flat" className="font-mono">{username}</Chip>
            <Tooltip content="Buka pengaturan override user ini">
              <Button
                as={Link}
                to={`/config/overrides?username=${encodeURIComponent(username)}`}
                size="sm"
                variant="flat"
                startContent={<Settings2 className="w-4 h-4" />}
              >
                Override Config
              </Button>
            </Tooltip>
          </div>
        </div>

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


        {/* Info jeda otomatis (selalu ditampilkan di halaman owner) */}
        <div className="mt-3 text-xs text-foreground-500">
          {cfgLoading
            ? "Memuat konfigurasi jeda otomatis…"
            : effCfg
              ? `Jeda otomatis: ${effCfg.jedaOtomatisAktif ? "Aktif" : "Nonaktif"} • Batas ${effCfg.batasJedaMenit ?? 0} menit`
              : "Jeda otomatis: —"}
        </div>
      </CardBody>
    </Card>
  );
}
