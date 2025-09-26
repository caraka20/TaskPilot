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

  /** Chip status tugas (Selesai / Belum) */
  const TaskPill = ({ on }: { on?: boolean }) => (
    <Chip
      size="sm"
      variant="flat"
      color={on ? "success" : "default"}
      className={[
        "border",
        on
          ? "border-success-200 bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300 dark:border-success-400/20"
          : "border-default-200 bg-content2 text-foreground-600",
      ].join(" ")}
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

  return (
    <Card
      className={[
        "mt-6 overflow-hidden rounded-2xl border border-default-200 bg-content1 shadow-md",
        isComplete ? "ring-1 ring-success-400/40" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Accent bar */}
      <div
        className={[
          "h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500",
          isComplete ? "from-emerald-400 via-teal-500 to-emerald-600" : "",
        ].join(" ")}
      />

      <CardHeader className="flex flex-col gap-2 pt-4">
        <div className="flex w-full items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold text-foreground">{label} — Detail</div>
            {isComplete && (
              <Chip
                size="sm"
                color="success"
                variant="flat"
                className="border border-success-200 bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300 dark:border-success-400/20"
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
          <div className="text-sm text-foreground-500">Belum ada data {label} untuk customer ini.</div>
        ) : (
          <div className="w-full">
            <div className="text-xs uppercase tracking-wide text-foreground-500">Judul</div>
            <div className="text-base font-medium text-foreground" title={karil.judul}>
              <span className="inline-flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 text-foreground-400" />
                <span className="line-clamp-3">{karil.judul}</span>
              </span>
            </div>
          </div>
        )}

        {karil && isComplete && (
          <div className="mt-2 rounded-xl border border-success-200 bg-success-50/80 p-3 dark:bg-success-500/10 dark:border-success-400/20">
            <div className="flex items-center gap-2 text-success-700 dark:text-success-300">
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
          {/* Kolom kiri: progress tugas */}
          <div className="rounded-2xl border border-default-200 bg-content1 p-4">
            <div className="mb-3 text-sm font-semibold text-foreground">Progress Tugas</div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between rounded-lg border border-default-200 bg-content2 px-3 py-2">
                <span className="text-sm text-foreground-600">Tugas 1</span>
                <TaskPill on={karil.tugas1} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-default-200 bg-content2 px-3 py-2">
                <span className="text-sm text-foreground-600">Tugas 2</span>
                <TaskPill on={karil.tugas2} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-default-200 bg-content2 px-3 py-2">
                <span className="text-sm text-foreground-600">Tugas 3</span>
                <TaskPill on={karil.tugas3} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-default-200 bg-content2 px-3 py-2">
                <span className="text-sm text-foreground-600">Tugas 4</span>
                <TaskPill on={karil.tugas4} />
              </div>
            </div>

            <div className="mt-2 text-xs text-foreground-500">
              Selesai:{" "}
              <span className="font-medium text-foreground">{karil.doneTasks}</span> /{" "}
              <span className="font-medium text-foreground">{karil.totalTasks}</span> tugas
            </div>
          </div>

          {/* Kolom kanan: keterangan + meta + progress bar */}
          <div className="rounded-2xl border border-default-200 bg-content1 p-4">
            <div className="mb-2 text-sm font-semibold text-foreground">Keterangan</div>

            <div className="min-h-[64px] rounded-xl border border-default-200 bg-content2 p-3 text-sm text-foreground whitespace-pre-wrap">
              {karil.keterangan ?? "—"}
            </div>

            <Divider className="my-4 bg-default-200" />

            <div className="grid grid-cols-1 gap-3 text-xs text-foreground-500 sm:grid-cols-2">
              <div>
                Diubah: <span className="font-medium text-foreground">{time(karil.updatedAt)}</span>
              </div>
              <div>
                Dibuat: <span className="font-medium text-foreground">{time(karil.createdAt)}</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 text-sm text-foreground-600">Persentase penyelesaian</div>
              <Progress
                aria-label="Progress"
                value={pct}
                className="w-full"
                color={isComplete ? "success" : pct > 0 ? "primary" : "default"}
              />
              <div
                className={[
                  "mt-1 text-right text-xs",
                  isComplete ? "text-success-600 font-medium dark:text-success-400" : "text-foreground-500",
                ].join(" ")}
              >
                {pct}%
              </div>

              {isComplete && canManage && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Tooltip content={`Perbarui catatan/arsipkan status ${label}`}>
                    <Button
                      size="sm"
                      variant="flat"
                      className="rounded-full bg-success-50 text-success-700 border border-success-200 dark:bg-success-500/10 dark:text-success-300 dark:border-success-400/25"
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
