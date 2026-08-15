import { Button } from "@heroui/react";
import {
  Activity,
  PauseCircle,
  RefreshCw,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import WorkspacePageHeader, {
  type WorkspaceHeaderMetric,
} from "../../../components/common/WorkspacePageHeader";

type Props = {
  role?: string;
  countUsers: number;
  countAktif: number;
  countJeda: number;
  loading?: boolean;
  onRefresh?: () => void;
};

export default function UserListHeader({
  role,
  countUsers,
  countAktif,
  countJeda,
  loading = false,
  onRefresh,
}: Props) {
  const metrics: [
    WorkspaceHeaderMetric,
    WorkspaceHeaderMetric,
    WorkspaceHeaderMetric,
  ] = [
    {
      label: "Total pengguna",
      value: `${countUsers} pengguna`,
      icon: UsersRound,
      tone: "cyan",
    },
    {
      label: "Sedang bekerja",
      value: `${countAktif} pengguna`,
      icon: Activity,
      tone: "emerald",
    },
    {
      label: "Sedang jeda",
      value: `${countJeda} pengguna`,
      icon: PauseCircle,
      tone: countJeda > 0 ? "amber" : "cyan",
    },
  ];

  return (
    <WorkspacePageHeader
      eyebrow="ARTECH • User Management"
      title="Pengguna & tenaga kerja"
      description="Kelola akun, hak akses, aktivitas kerja, dan payroll seluruh anggota tim."
      icon={UsersRound}
      actions={
        <>
          <Button
            onPress={onRefresh}
            isLoading={loading}
            startContent={
              !loading ? (
                <RefreshCw className="h-4 w-4" />
              ) : undefined
            }
            className="min-h-11 shrink-0 rounded-xl bg-white/10 px-4 font-semibold text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15"
          >
            Muat ulang
          </Button>

          {role === "OWNER" && (
            <Button
              as={Link}
              to="/users/register"
              startContent={<UserPlus className="h-4 w-4" />}
              className="min-h-11 shrink-0 rounded-xl bg-white px-4 font-semibold text-[#0b2948] shadow-sm transition hover:bg-slate-50"
            >
              Tambah user
            </Button>
          )}
        </>
      }
      metrics={metrics}
    />
  );
}