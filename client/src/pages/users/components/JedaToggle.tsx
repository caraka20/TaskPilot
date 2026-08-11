import { Button, Switch, Tooltip } from "@heroui/react";
import { Pause, Play, Undo2 } from "lucide-react";
import type { Konfigurasi } from "../../../services/konfigurasi.service";

interface Props {
  role: string | undefined;
  resolvedJeda: boolean;
  hasOverride: boolean;
  globalCfg: Konfigurasi | null;
  saving: boolean;
  canSeeJeda: boolean;
  onToggleJeda: (next: boolean) => void;
  onUseGlobalDefault: () => void;
}

export default function JedaToggle({
  role,
  resolvedJeda,
  hasOverride,
  globalCfg,
  saving,
  canSeeJeda,
  onToggleJeda,
  onUseGlobalDefault,
}: Props) {
  if (!canSeeJeda) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-foreground-500">
        Jeda Otomatis
        {!hasOverride && typeof globalCfg?.jedaOtomatisAktif !== "undefined" && (
          <span className="ml-2 text-foreground-400">
            (Global: {globalCfg?.jedaOtomatisAktif ? "Aktif" : "Nonaktif"})
          </span>
        )}
      </span>

      <Tooltip
        content={
          role !== "OWNER"
            ? "Hanya OWNER yang dapat mengubah"
            : resolvedJeda
            ? "Nonaktifkan jeda otomatis"
            : "Aktifkan jeda otomatis"
        }
      >
        <Switch
          isDisabled={role !== "OWNER" || saving}
          isSelected={resolvedJeda}
          onValueChange={onToggleJeda}
          color="primary"
        >
          <span className="inline-flex items-center gap-1">
            {resolvedJeda ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {resolvedJeda ? "Aktif" : "Nonaktif"}
          </span>
        </Switch>
      </Tooltip>

      {role === "OWNER" && hasOverride && (
        <Tooltip content="Hapus override & pakai default global">
          <Button
            size="sm"
            variant="flat"
            startContent={<Undo2 className="h-4 w-4" />}
            onPress={onUseGlobalDefault}
            isLoading={saving}
          >
            Gunakan Default Global
          </Button>
        </Tooltip>
      )}
    </div>
  );
}
