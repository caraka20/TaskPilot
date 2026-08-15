import { Chip } from "@heroui/react";
import { Coffee, Settings2 } from "lucide-react";
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
  withTopBorder?: boolean;
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
  withTopBorder = false,
}: Props) {
  return (
    <div className={`px-5 py-5 sm:px-6 ${withTopBorder ? "border-t border-default-200/70" : ""}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
            <Settings2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-foreground">Konfigurasi kerja @{data.username}</p>
              <WorkStatusBadge status={currentStatus} />
              {canSeeJeda && (
                <Chip size="sm" color={hasOverride ? "warning" : "success"} variant="flat">
                  {hasOverride ? "Override user" : "Mengikuti global"}
                </Chip>
              )}
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs leading-5 text-foreground-500">
              <Coffee className="h-3.5 w-3.5" /> Atur kebijakan jeda otomatis tanpa mengubah histori kerja.
            </p>
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
    </div>
  );
}
