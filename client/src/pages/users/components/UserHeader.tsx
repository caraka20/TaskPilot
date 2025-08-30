import { Chip } from "@heroui/react";
import { ShieldCheck, User as UserIcon } from "lucide-react";
import type { UserDetail } from "../../../services/users.service";
import type { WorkStatus } from "./WorkStatusBadge";
import WorkStatusBadge from "./WorkStatusBadge";
import JedaToggle from "./JedaToggle";
import type { Konfigurasi } from "../../../services/konfigurasi.service";

interface Props {
  data: UserDetail;
  role: string | undefined;
  currentStatus: WorkStatus;
  canSeeJeda: boolean;
  hasOverride: boolean;
  resolvedJeda: boolean;
  globalCfg: Konfigurasi | null;
  saving: boolean;
  onToggleJeda: (next: boolean) => void;
  onUseGlobalDefault: () => void;
}

export default function UserHeader({
  data,
  role,
  currentStatus,
  canSeeJeda,
  hasOverride,
  resolvedJeda,
  globalCfg,
  saving,
  onToggleJeda,
  onUseGlobalDefault,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 grid place-items-center shadow-md">
          <UserIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            {data.namaLengkap}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Chip size="sm" variant="flat" className="font-mono">
              {data.username}
            </Chip>
            <Chip
              size="sm"
              color={data.role === "OWNER" ? "primary" : "secondary"}
              variant="flat"
              startContent={<ShieldCheck className="h-3.5 w-3.5" />}
            >
              {data.role}
            </Chip>

            <WorkStatusBadge status={currentStatus} />

            {canSeeJeda && (
              <Chip size="sm" color={hasOverride ? "warning" : "success"} variant="flat" className="ml-1">
                {hasOverride ? "Override" : "Default (Global)"}
              </Chip>
            )}
          </div>
        </div>
      </div>

      <JedaToggle
        role={role}
        canSeeJeda={canSeeJeda}
        hasOverride={hasOverride}
        resolvedJeda={resolvedJeda}
        globalCfg={globalCfg}
        saving={saving}
        onToggleJeda={onToggleJeda}
        onUseGlobalDefault={onUseGlobalDefault}
      />
    </div>
  );
}
