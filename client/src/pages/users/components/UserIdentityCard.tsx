import { Button, Chip } from "@heroui/react";
import { Activity, ArrowLeft, Clock3, Eye, ShieldCheck, UserRound, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";

import WorkspacePageHeader from "../../../components/common/WorkspacePageHeader";

type Props = {
  namaLengkap: string;
  username: string;
  role: string;
  status?: "AKTIF" | "JEDA" | "OFF" | "SELESAI";
  totalJam: string;
  totalGaji: string;
  avatarUrl?: string | null;
  accountActive?: boolean;
  billingAccess?: boolean;
};

function initials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "US";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function statusMeta(status?: Props["status"]) {
  if (status === "AKTIF") return { label: "Sedang bekerja", color: "success" as const, dot: "bg-emerald-400 animate-pulse" };
  if (status === "JEDA") return { label: "Sedang jeda", color: "warning" as const, dot: "bg-amber-400" };
  if (status === "SELESAI") return { label: "Selesai", color: "secondary" as const, dot: "bg-violet-400" };
  return { label: "Tidak bekerja", color: "default" as const, dot: "bg-slate-400" };
}

export default function UserIdentityCard({
  namaLengkap,
  username,
  role,
  status,
  totalJam,
  totalGaji,
  avatarUrl,
  accountActive = true,
  billingAccess = false,
}: Props) {
  const workStatus = statusMeta(status);

  return (
    <WorkspacePageHeader
      eyebrow="ARTECH • Profil pengguna"
      title={namaLengkap || username}
      description={`@${username} • ${role} • ${accountActive ? "Akun aktif" : "Akun nonaktif"}${billingAccess ? " • Memiliki akses tagihan customer" : ""}`}
      icon={UserRound}
      actions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/10 text-sm font-extrabold text-white ring-1 ring-white/20">
            {avatarUrl ? (
              <img
                alt={`Foto ${namaLengkap}`}
                className="h-full w-full object-cover"
                src={avatarUrl}
              />
            ) : (
              initials(namaLengkap || username)
            )}
          </div>
          <Chip
            size="sm"
            variant="flat"
            className={`border border-white/10 font-semibold text-white ${accountActive ? "bg-emerald-400/15" : "bg-rose-400/15"}`}
          >
            <ShieldCheck className="mr-1 h-3.5 w-3.5" />
            {accountActive ? "Akun aktif" : "Akun nonaktif"}
          </Chip>
          {billingAccess ? (
            <Chip
              size="sm"
              variant="flat"
              className="border border-white/10 bg-cyan-400/15 font-semibold text-white"
            >
              <Eye className="mr-1 h-3.5 w-3.5" />
              Akses tagihan
            </Chip>
          ) : null}
          <Button
            as={Link}
            to="/users"
            variant="flat"
            className="min-h-10 rounded-xl border border-white/15 bg-white/10 font-semibold text-white hover:bg-white/15"
            startContent={<ArrowLeft className="h-4 w-4" />}
          >
            Daftar user
          </Button>
        </div>
      }
      metrics={[
        {
          label: "Status kerja",
          value: (
            <span className="inline-flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${workStatus.dot}`} />
              {workStatus.label}
            </span>
          ),
          icon: Activity,
          tone: status === "AKTIF" ? "emerald" : status === "JEDA" ? "amber" : "cyan",
        },
        {
          label: "Total jam kerja",
          value: totalJam,
          icon: Clock3,
          tone: "cyan",
        },
        {
          label: "Upah keseluruhan",
          value: totalGaji,
          icon: WalletCards,
          tone: "emerald",
        },
      ]}
    />
  );
}
