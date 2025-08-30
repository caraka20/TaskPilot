// client/src/pages/customers/components/KarilDetailSection.tsx
import {
  Card, CardHeader, CardBody, Chip, Divider, Progress, Button, Tooltip,
} from "@heroui/react";
import { FileText, Trophy, Sparkles } from "lucide-react";
import type { KarilDetail as KarilDetailType } from "../../../services/karil.service";

type Props = {
  karil?: KarilDetailType | null;
  isKaril?: boolean;
  /** tampilkan tombol Kelola untuk role yang punya akses (default: true) */
  canManage?: boolean;
  onManage?: () => void;
  className?: string;
  label?: string;
  /** @deprecated — gunakan canManage */
  isOwner?: boolean;
};

export default function KarilDetailSection({
  karil,
  isKaril = false,
  canManage = true,
  onManage,
  className = "",
  label = "KARIL",
}: Props) {
  if (!karil && !isKaril) return null;

  const pct = Math.round(((karil?.progress ?? 0) || 0) * 100);
  const isComplete = pct >= 100;

  const TaskPill = ({ on }: { on?: boolean }) => (
    <Chip
      size="sm"
      variant="flat"
      className={`border ${on ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-600 border-slate-200"}`}
      startContent={
        on ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
          </svg>
        )
      }
    >
      {on ? "Selesai" : "Belum"}
    </Chip>
  );

  const time = (s?: string) =>
    s
      ? new Date(s).toLocaleString("id-ID", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <Card
      className={[
        "mt-6 overflow-hidden border border-slate-200 shadow-md rounded-2xl",
        isComplete ? "ring-1 ring-emerald-200" : "",
        className,
      ].filter(Boolean).join(" ")}
    >
      <div
        className={[
          "h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500",
          isComplete ? "from-emerald-400 via-teal-500 to-emerald-600" : "",
        ].join(" ")}
      />

      <CardHeader className="flex flex-col gap-2 pt-4">
        <div className="flex w-full items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold text-slate-900">{label} — Detail</div>
            {isComplete && (
              <Chip
                size="sm"
                variant="flat"
                className="border border-emerald-200 bg-emerald-50 text-emerald-700"
                startContent={<Trophy className="h-3.5 w-3.5" />}
              >
                Selesai 100%
              </Chip>
            )}
          </div>

          {canManage && (
            <Tooltip content={`Kelola atau perbarui data ${label}`}>
              <Button
                size="sm"
                className={[
                  "text-white shadow-sm",
                  isComplete ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-violet-500 to-sky-500",
                ].join(" ")}
                onPress={onManage}
              >
                Kelola / Upsert {label}
              </Button>
            </Tooltip>
          )}
        </div>

        {!karil ? (
          <div className="text-sm text-slate-500">Belum ada data {label} untuk customer ini.</div>
        ) : (
          <div className="w-full">
            <div className="text-xs uppercase tracking-wide text-slate-500">Judul</div>
            <div className="text-base font-medium text-slate-900" title={karil.judul}>
              <span className="inline-flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 text-slate-400" />
                <span className="line-clamp-3">{karil.judul}</span>
              </span>
            </div>
          </div>
        )}

        {karil && isComplete && (
          <div className="mt-2 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">
                Keren! Semua tugas {label} sudah rampung dan tervalidasi.
              </span>
            </div>
          </div>
        )}
      </CardHeader>

      {karil && (
        <CardBody className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 text-sm font-semibold text-slate-700">Progress Tugas</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-600">Tugas 1</span><TaskPill on={karil.tugas1} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-600">Tugas 2</span><TaskPill on={karil.tugas2} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-600">Tugas 3</span><TaskPill on={karil.tugas3} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-600">Tugas 4</span><TaskPill on={karil.tugas4} />
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Selesai: <span className="font-medium text-slate-700">{karil.doneTasks}</span> /{" "}
              <span className="font-medium text-slate-700">{karil.totalTasks}</span> tugas
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-2 text-sm font-semibold text-slate-700">Keterangan</div>
            <div className="min-h-[64px] rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">
              {karil.keterangan ?? "—"}
            </div>

            <Divider className="my-4 bg-slate-100" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-500">
              <div>Diubah: <span className="font-medium text-slate-700">{time(karil.updatedAt)}</span></div>
              <div>Dibuat: <span className="font-medium text-slate-700">{time(karil.createdAt)}</span></div>
            </div>

            <div className="mt-4">
              <div className="mb-2 text-sm text-slate-600">Persentase penyelesaian</div>
              <Progress aria-label="Progress" value={pct} className={["w-full", isComplete ? "[&>div>div]:bg-emerald-500" : ""].join(" ")} />
              <div className={["mt-1 text-right text-xs", isComplete ? "text-emerald-600 font-medium" : "text-slate-500"].join(" ")}>
                {pct}%
              </div>

              {isComplete && canManage && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Tooltip content={`Perbarui catatan/arsipkan status ${label}`}>
                    <Button
                      size="sm"
                      variant="flat"
                      className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full"
                      onPress={onManage}
                    >
                      Kelola Setelah Selesai
                    </Button>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
        </CardBody>
      )}
    </Card>
  );
}
