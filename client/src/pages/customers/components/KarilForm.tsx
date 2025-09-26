import { useEffect, useMemo, useState } from "react";
import { Input, Textarea, Checkbox, Button, Progress, Chip, Divider, Tooltip } from "@heroui/react";
import type { KarilDetail, UpsertKarilPayload } from "../../../services/karil.service";

type Props = {
  initial?: KarilDetail | null;     // data dari DB (boleh null/undefined)
  onSubmit: (payload: UpsertKarilPayload) => void | Promise<void>;
  busy?: boolean;
};

export default function KarilForm({ initial, onSubmit, busy }: Props) {
  const [judul, setJudul] = useState<string>("");
  const [ket, setKet] = useState<string>("");
  const [t1, setT1] = useState(false);
  const [t2, setT2] = useState(false);
  const [t3, setT3] = useState(false);
  const [t4, setT4] = useState(false);

  // Sync state dari initial setiap kali berubah (misal: selesai load atau selesai save)
  useEffect(() => {
    if (!initial) {
      setJudul("");
      setKet("");
      setT1(false); setT2(false); setT3(false); setT4(false);
      return;
    }
    setJudul(initial.judul ?? "");
    setKet(initial.keterangan ?? "");
    setT1(!!initial.tugas1);
    setT2(!!initial.tugas2);
    setT3(!!initial.tugas3);
    setT4(!!initial.tugas4);
  }, [initial]);

  const totalDone = useMemo(() => [t1, t2, t3, t4].filter(Boolean).length, [t1, t2, t3, t4]);
  const progress = useMemo(() => (totalDone / 4) * 100, [totalDone]);
  const progressInt = Math.round(progress);

  const disabled = busy || !judul.trim();

  const handleSubmit = async () => {
    const payload: UpsertKarilPayload = {
      judul: judul.trim(),
      tugas1: t1,
      tugas2: t2,
      tugas3: t3,
      tugas4: t4,
      keterangan: ket.trim() || undefined,
    };
    await onSubmit(payload);
  };

  const SectionCard: React.FC<{ children: React.ReactNode; title?: string; hint?: string }> = ({ children, title, hint }) => (
    <div className="rounded-2xl border border-default-200 bg-content1 p-4">
      {title && <div className="mb-2 text-sm font-semibold text-foreground">{title}</div>}
      {hint && <div className="mb-3 text-xs text-foreground-500">{hint}</div>}
      {children}
    </div>
  );

  const taskBox = (label: string, checked: boolean, onChange: (v: boolean) => void) => (
    <div
      className={[
        "rounded-xl border border-default-200 bg-content2 px-3 py-2 transition",
        checked ? "ring-1 ring-success-400/40" : "",
      ].join(" ")}
    >
      <Checkbox
        isSelected={checked}
        onValueChange={onChange}
        isDisabled={busy}
        color={checked ? "success" : "default"}
        classNames={{
          label: "text-sm font-medium text-foreground",
        }}
      >
        {label}
      </Checkbox>
    </div>
  );

  const progressTone = progressInt >= 100 ? "success" : progressInt > 0 ? "primary" : "default";

  return (
    <div className="overflow-hidden rounded-2xl border border-default-200 bg-content1 shadow-md">
      {/* Accent line */}
      <div
        className={[
          "h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500",
          progressInt >= 100 ? "from-emerald-400 via-teal-500 to-emerald-600" : "",
        ].join(" ")}
      />

      <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
        {/* Kiri: Judul + Keterangan */}
        <div className="flex flex-col gap-4">
          <SectionCard title="Judul KARIL" hint="Isi dengan judul karya ilmiah.">
            <Input
              aria-label="Judul KARIL"
              placeholder="cth: Analisis Sistem Informasi"
              value={judul}
              onValueChange={setJudul}
              variant="bordered"
              isDisabled={busy}
              classNames={{
                inputWrapper: "bg-content1",
              }}
            />
          </SectionCard>

          <SectionCard title="Keterangan" hint="Catatan tambahan (opsional).">
            <Textarea
              aria-label="Keterangan KARIL"
              placeholder="Catatan tambahan…"
              minRows={5}
              value={ket}
              onValueChange={setKet}
              variant="bordered"
              isDisabled={busy}
              classNames={{
                inputWrapper: "bg-content1",
              }}
            />
          </SectionCard>
        </div>

        {/* Kanan: Tugas + Progress */}
        <div className="flex flex-col gap-4">
          <SectionCard>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-foreground">Progress Tugas</div>
              <Chip
                size="sm"
                variant="flat"
                className={[
                  "border",
                  progressInt >= 100
                    ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-300 dark:border-success-400/20"
                    : "bg-content2 text-foreground-600 border-default-200",
                ].join(" ")}
              >
                {totalDone} / 4 selesai
              </Chip>
            </div>

            <div className="mt-3">
              <Progress
                aria-label="Progress tugas KARIL"
                value={progress}
                color={progressTone}
                className="w-full"
              />
              <div
                className={[
                  "mt-1 text-right text-xs",
                  progressInt >= 100 ? "text-success-600 font-medium dark:text-success-400" : "text-foreground-500",
                ].join(" ")}
              >
                {progressInt}%
              </div>
            </div>

            <Divider className="my-4 bg-default-200" />

            <div className="grid grid-cols-2 gap-3">
              {taskBox("Tugas 1", t1, setT1)}
              {taskBox("Tugas 2", t2, setT2)}
              {taskBox("Tugas 3", t3, setT3)}
              {taskBox("Tugas 4", t4, setT4)}
            </div>

            <div className="mt-4 flex justify-end">
              <Tooltip content={disabled ? "Judul wajib diisi" : "Simpan perubahan"}>
                <Button
                  color="primary"
                  className="bg-gradient-to-r from-violet-500 to-sky-500 text-white shadow-sm"
                  isLoading={busy}
                  isDisabled={disabled}
                  onPress={handleSubmit}
                >
                  Simpan KARIL
                </Button>
              </Tooltip>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
