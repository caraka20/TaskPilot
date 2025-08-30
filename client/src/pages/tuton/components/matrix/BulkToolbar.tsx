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
  return (
    <div className="flex flex-col gap-3 p-3 border-b border-default-200 bg-gradient-to-br from-white to-slate-50">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Selector sesi */}
        <div className="flex items-center gap-2">
          <Chip size="sm" variant="flat" className="bg-default-100">
            Bulk Aksi per Sesi
          </Chip>
          <div className="flex items-center gap-1">
            {SESSIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSesi(s.sesi)}
                className={[
                  "px-2.5 py-1.5 rounded-md text-[12px] font-medium border transition",
                  sesi === s.sesi
                    ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                    : "bg-white text-foreground-600 border-default-300 hover:bg-default-100",
                ].join(" ")}
              >
                {s.label}
              </button>
            ))}
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
              className="bg-default-100"
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
                className="bg-default-100 disabled:opacity-60"
                startContent={<ClipboardCheck className="h-4 w-4" />}
                onPress={() => onBulkCopas("TUGAS", sesi)}
                isDisabled={!isTugas(sesi)}
              >
                Copas Tugas
              </Button>
            </span>
          </Tooltip>

          <Tooltip placement="bottom" offset={6} content="Set A/D/T jadi SELESAI & tandai COPAS Diskusi/Tugas untuk sesi terpilih">
            <span>
              <Button
                size="sm"
                className="bg-green-700 text-white disabled:opacity-60"
                startContent={<Layers className="h-4 w-4" />}
                onPress={() => onBulkCompleteSession?.(sesi)}
                isDisabled={!onBulkCompleteSession}
              >
                Selesai 1 Sesi
              </Button>
            </span>
          </Tooltip>

          <Chip
            size="sm"
            variant="flat"
            className="bg-default-100"
            startContent={<Layers className="h-3.5 w-3.5" />}
          >
            Sesi {sesi}
          </Chip>
        </div>
      </div>
    </div>
  );
}
