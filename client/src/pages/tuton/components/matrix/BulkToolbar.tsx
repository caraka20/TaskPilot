// client/src/pages/customers/components/BulkToolbar.tsx
import { useState } from "react";
import { Button, Chip, Tooltip } from "@heroui/react";
import { CheckSquare, ClipboardCheck, Layers } from "lucide-react";
import { SESSIONS, isTugas } from "./constants";

export type BulkToolbarProps = {
  sesi: number;
  setSesi: (s: number) => void;
  onBulkStatus: (jenis: "ABSEN" | "DISKUSI" | "TUGAS", sesi: number) => Promise<void>;
  onBulkCopas: (jenis: "DISKUSI" | "TUGAS", sesi: number) => Promise<void>;
  onBulkCompleteSession?: (sesi: number) => Promise<void>;
};

export default function BulkToolbar({
  sesi,
  setSesi,
  onBulkStatus,
  onBulkCopas,
  onBulkCompleteSession,
}: BulkToolbarProps) {
  const [busy, setBusy] = useState(false);

  const handleComplete = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (onBulkCompleteSession) {
        // gunakan handler khusus jika disuplai parent
        await onBulkCompleteSession(sesi);
      } else {
        // fallback bawaan: selesaiin semuanya untuk 1 sesi
        await onBulkStatus("DISKUSI", sesi);
        await onBulkStatus("ABSEN", sesi);
        if (isTugas(sesi)) {
          await onBulkStatus("TUGAS", sesi);
        }
        await onBulkCopas("DISKUSI", sesi);
        if (isTugas(sesi)) {
          await onBulkCopas("TUGAS", sesi);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={[
        "flex flex-col gap-3 p-3 border-b border-default-200",
        "bg-content1",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Selector sesi */}
        <div className="flex items-center gap-2">
          <Chip
            size="sm"
            variant="flat"
            className="bg-default-100 dark:bg-content2 dark:text-foreground-600"
          >
            Bulk Aksi per Sesi
          </Chip>

          <div className="flex items-center gap-1">
            {SESSIONS.map((s) => {
              const active = sesi === s.sesi;
              const baseBtn =
                "px-2.5 py-1.5 rounded-md text-[12px] font-medium transition ring-1 ring-inset";
              const inactiveCls =
                "bg-default-50 text-foreground-600 border border-default-200 " +
                "hover:bg-default-100 " +
                "dark:bg-content2 dark:text-foreground-500 dark:hover:bg-content2/80 dark:border-default-200/60";
              const activeCls =
                "text-white border border-transparent bg-gradient-to-r from-sky-600 to-indigo-600 shadow-sm " +
                "dark:bg-[linear-gradient(90deg,rgba(14,22,38,.92),rgba(14,22,38,.92))] " +
                "dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] dark:ring-sky-400/40";

              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSesi(s.sesi)}
                  className={[baseBtn, active ? activeCls : inactiveCls].join(" ")}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Aksi bulk */}
        <div className="flex items-center gap-2 flex-wrap">
          <Tooltip placement="bottom" offset={6} content="Set semua Diskusi di sesi terpilih menjadi SELESAI">
            <Button
              size="sm"
              className="bg-sky-600 text-white"
              startContent={<CheckSquare className="h-4 w-4" />}
              onPress={() => onBulkStatus("DISKUSI", sesi)}
            >
              Diskusi Done
            </Button>
          </Tooltip>

          <Tooltip placement="bottom" offset={6} content="Set semua Absen di sesi terpilih menjadi SELESAI">
            <Button
              size="sm"
              className="bg-emerald-600 text-white"
              startContent={<CheckSquare className="h-4 w-4" />}
              onPress={() => onBulkStatus("ABSEN", sesi)}
            >
              Absen Done
            </Button>
          </Tooltip>

          <Tooltip placement="bottom" offset={6} content="Set semua Tugas di sesi terpilih menjadi SELESAI">
            <span>
              <Button
                size="sm"
                className="bg-violet-600 text-white disabled:opacity-60"
                startContent={<CheckSquare className="h-4 w-4" />}
                onPress={() => onBulkStatus("TUGAS", sesi)}
                isDisabled={!isTugas(sesi)}
              >
                Tugas Done
              </Button>
            </span>
          </Tooltip>

          <div className="w-px h-6 bg-default-200 mx-1" />

          <Tooltip placement="bottom" offset={6} content="Tandai COPAS Diskusi untuk semua course di sesi terpilih (draft)">
            <Button
              size="sm"
              variant="flat"
              className="bg-default-100 dark:bg-content2"
              startContent={<ClipboardCheck className="h-4 w-4" />}
              onPress={() => onBulkCopas("DISKUSI", sesi)}
            >
              Copas Diskusi
            </Button>
          </Tooltip>

          <Tooltip placement="bottom" offset={6} content="Tandai COPAS Tugas untuk semua course di sesi terpilih (draft)">
            <span>
              <Button
                size="sm"
                variant="flat"
                className="bg-default-100 dark:bg-content2 disabled:opacity-60"
                startContent={<ClipboardCheck className="h-4 w-4" />}
                onPress={() => onBulkCopas("TUGAS", sesi)}
                isDisabled={!isTugas(sesi)}
              >
                Copas Tugas
              </Button>
            </span>
          </Tooltip>

          <Tooltip
            placement="bottom"
            offset={6}
            content="Set A/D/T jadi SELESAI & tandai COPAS Diskusi/Tugas untuk sesi terpilih"
          >
            <Button
              size="sm"
              className="bg-green-700 text-white"
              startContent={<Layers className="h-4 w-4" />}
              onPress={handleComplete}
              isLoading={busy}
              isDisabled={busy}
            >
              Selesai 1 Sesi
            </Button>
          </Tooltip>

          <Chip
            size="sm"
            variant="flat"
            className="bg-default-100 dark:bg-content2 dark:text-foreground-600"
            startContent={<Layers className="h-3.5 w-3.5" />}
          >
            Sesi {sesi}
          </Chip>
        </div>
      </div>
    </div>
  );
}
