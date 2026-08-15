// client/src/pages/customers/components/BulkToolbar.tsx
import { useState } from "react";
import { Button, Tooltip } from "@heroui/react";
import { CheckSquare, ClipboardCheck, Layers, SlidersHorizontal } from "lucide-react";
import { SESSIONS, isDiskusi, isTugas } from "./constants";

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
        if (isDiskusi(sesi)) {
          await onBulkStatus("DISKUSI", sesi);
        }
        await onBulkStatus("ABSEN", sesi);
        if (isTugas(sesi)) {
          await onBulkStatus("TUGAS", sesi);
        }
        if (isDiskusi(sesi)) {
          await onBulkCopas("DISKUSI", sesi);
        }
        if (isTugas(sesi)) {
          await onBulkCopas("TUGAS", sesi);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-b border-slate-200/70 bg-slate-50/80 px-3 py-3 dark:border-slate-800 dark:bg-slate-950/35 sm:px-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#1b5278] ring-1 ring-slate-200 dark:bg-slate-900 dark:text-sky-300 dark:ring-slate-700 sm:grid">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500 dark:text-slate-400">
                Aksi per sesi
              </p>
              <span className="rounded-full bg-[#1b5278]/10 px-2.5 py-1 text-[10px] font-black text-[#1b5278] dark:bg-sky-400/10 dark:text-sky-300 sm:hidden">
                Sesi {sesi}
              </span>
            </div>
            <div className="flex max-w-full items-center gap-1.5 overflow-x-auto pb-1 touch-pan-x sm:pb-0">
            {SESSIONS.map((s) => {
              const active = sesi === s.sesi;

              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSesi(s.sesi)}
                  aria-pressed={active}
                  className={[
                    "grid h-9 min-w-10 shrink-0 place-items-center rounded-xl px-3 text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2",
                    active
                      ? "bg-[#173f5f] text-white shadow-[0_6px_14px_-8px_rgba(15,55,82,.9)] ring-1 ring-[#173f5f] dark:bg-sky-500 dark:ring-sky-400"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-sky-50 hover:text-[#1b5278] hover:ring-sky-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-sky-400/10",
                  ].join(" ")}
                >
                  {s.label}
                </button>
              );
            })}
            </div>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center xl:justify-end">
          <Tooltip placement="bottom" offset={6} content="Set semua Diskusi di sesi terpilih menjadi SELESAI">
            <Button
              size="sm"
              variant="flat"
              className="min-h-9 rounded-xl bg-sky-100 px-3 font-bold text-sky-700 disabled:opacity-45 dark:bg-sky-400/10 dark:text-sky-300"
              startContent={<CheckSquare className="h-4 w-4" />}
              onPress={() => onBulkStatus("DISKUSI", sesi)}
              isDisabled={!isDiskusi(sesi)}
            >
              Diskusi selesai
            </Button>
          </Tooltip>

          <Tooltip placement="bottom" offset={6} content="Set semua Absen di sesi terpilih menjadi SELESAI">
            <Button
              size="sm"
              variant="flat"
              className="min-h-9 rounded-xl bg-emerald-100 px-3 font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
              startContent={<CheckSquare className="h-4 w-4" />}
              onPress={() => onBulkStatus("ABSEN", sesi)}
            >
              Absen selesai
            </Button>
          </Tooltip>

          <Tooltip placement="bottom" offset={6} content="Set semua Tugas di sesi terpilih menjadi SELESAI">
            <span>
              <Button
                size="sm"
                variant="flat"
                className="min-h-9 rounded-xl bg-violet-100 px-3 font-bold text-violet-700 disabled:opacity-45 dark:bg-violet-400/10 dark:text-violet-300"
                startContent={<CheckSquare className="h-4 w-4" />}
                onPress={() => onBulkStatus("TUGAS", sesi)}
                isDisabled={!isTugas(sesi)}
              >
                Tugas selesai
              </Button>
            </span>
          </Tooltip>

          <div className="mx-0.5 hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" />

          <Tooltip placement="bottom" offset={6} content="Tandai COPAS Diskusi untuk semua course di sesi terpilih (draft)">
            <Button
              size="sm"
              variant="flat"
              className="min-h-9 rounded-xl bg-white px-3 font-bold text-slate-600 ring-1 ring-slate-200 disabled:opacity-45 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
              startContent={<ClipboardCheck className="h-4 w-4" />}
              onPress={() => onBulkCopas("DISKUSI", sesi)}
              isDisabled={!isDiskusi(sesi)}
            >
              Copas Diskusi
            </Button>
          </Tooltip>

          <Tooltip placement="bottom" offset={6} content="Tandai COPAS Tugas untuk semua course di sesi terpilih (draft)">
            <span>
              <Button
                size="sm"
                variant="flat"
                className="min-h-9 rounded-xl bg-white px-3 font-bold text-slate-600 ring-1 ring-slate-200 disabled:opacity-45 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
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
              className="col-span-2 min-h-9 rounded-xl bg-[#0b6b57] px-4 font-bold text-white shadow-[0_7px_16px_-10px_rgba(11,107,87,.9)] sm:col-span-1"
              startContent={<Layers className="h-4 w-4" />}
              onPress={handleComplete}
              isLoading={busy}
              isDisabled={busy}
            >
              Selesaikan sesi
            </Button>
          </Tooltip>

          <span className="hidden rounded-full bg-[#1b5278]/10 px-3 py-1.5 text-[10px] font-black text-[#1b5278] dark:bg-sky-400/10 dark:text-sky-300 sm:inline-flex">
            Sesi {sesi}
          </span>
        </div>
      </div>
    </div>
  );
}
