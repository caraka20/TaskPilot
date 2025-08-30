import { Card, CardBody, Chip } from "@heroui/react";
import JamControlsSelf from "../../../components/jam-kerja/JamControls";
import AdminJamControls from "./AdminJamControls";
import { useAuthStore } from "../../../store/auth.store";
import type { UserDetail } from "../../../services/users.service";

type AdminJamStatus = "TIDAK_AKTIF" | "AKTIF" | "JEDA";

interface Props {
  username: string;
  onChanged: () => void;
  userDetail?: UserDetail | null;
}

function ymd(x?: string | Date | null) {
  if (!x) return "";
  const d = new Date(x);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function KendaliJamKerjaCard({ username, onChanged, userDetail }: Props) {
  const { username: me, role } = useAuthStore();
  const isSelf = me === username;

  const list = Array.isArray(userDetail?.jamKerja) ? (userDetail as any).jamKerja as any[] : [];

  // cari segmen yang masih berjalan (jamSelesai null)
  const open = list.find((r) => r && r.jamSelesai == null);
  // fallback ke entri terbaru bila tidak ada yang berjalan
  const latest = open ?? list[0];

  const status: AdminJamStatus =
    latest?.status === "AKTIF" ? "AKTIF" :
    latest?.status === "JEDA"  ? "JEDA"  :
    "TIDAK_AKTIF";

  const activeSessionId: number | null =
    (open && typeof open.id === "number") ? open.id : null;

// Bila status JEDA dan baris jeda SUDAH DITUTUP (jamSelesai != null), jadikan target resume.
const resumeTargetId: number | null =
  status === "JEDA" && latest?.jamSelesai != null && typeof latest?.id === "number"
    ? latest.id
    : null;

// Akumulasi detik dari segmen yang SUDAH SELESAI / JEDA DITUTUP pada HARI YANG SAMA
const basisHari = ymd(open?.jamMulai) || ymd(new Date());
const detikBerjalan =
  list
    .filter((r) => r?.jamSelesai != null && ymd(r?.jamMulai) === basisHari)
    .reduce((acc, r) => acc + Math.max(0, Math.round(((r.totalJam ?? 0) as number) * 3600)), 0);

const startedAt = status === "AKTIF" ? (open?.jamMulai ?? null) : null;
const serverNow = new Date().toISOString();


  return (
    <Card shadow="sm" className="border border-default-100">
      <CardBody className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-foreground-500">Kendali Jam Kerja</div>
          <Chip size="sm" variant="flat" className="font-mono">{username}</Chip>
        </div>

        {isSelf || role !== "OWNER" ? (
          <JamControlsSelf
            status={status === "TIDAK_AKTIF" ? "TIDAK_AKTIF" : (status as any)}
            activeSessionId={activeSessionId ?? undefined}
            resumeTargetId={resumeTargetId ?? undefined}
            detikBerjalan={detikBerjalan}
            startedAt={startedAt}
            serverNow={serverNow}
            onChanged={onChanged}
          />
        ) : (
          <AdminJamControls
            targetUsername={username}
            status={status}
            activeSessionId={activeSessionId}
            resumeTargetId={resumeTargetId}
            detikBerjalan={detikBerjalan}
            startedAt={startedAt ?? null}
            serverNow={serverNow}
            onChanged={onChanged}
          />
        )}
      </CardBody>
    </Card>
  );
}
