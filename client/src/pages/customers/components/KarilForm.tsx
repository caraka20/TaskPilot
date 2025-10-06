import React, { useMemo, useRef, useState } from "react";
import { Button, Progress, Chip, Divider, Tooltip } from "@heroui/react";
import type { KarilDetail, UpsertKarilPayload } from "../../../services/karil.service";

/**
 * Anti-reset FINAL:
 * - Judul & Keterangan: pure uncontrolled (defaultValue + ref), NO state, NO useEffect.
 * - Checkbox: controlled ringan (boolean) untuk progress.
 * - Submit: baca nilai teks langsung dari ref.
 */

type Props = {
  initial?: KarilDetail | null;
  onSubmit: (payload: UpsertKarilPayload) => void | Promise<void>;
  busy?: boolean;
};

export default function KarilForm({ initial, onSubmit, busy }: Props) {
  // ====== refs untuk field teks (UNCONTROLLED) ======
  const judulRef = useRef<HTMLInputElement | null>(null);
  const ketRef = useRef<HTMLTextAreaElement | null>(null);

  // ====== checkbox (CONTROLLED ringan) ======
  const [t1, setT1] = useState(!!initial?.tugas1);
  const [t2, setT2] = useState(!!initial?.tugas2);
  const [t3, setT3] = useState(!!initial?.tugas3);
  const [t4, setT4] = useState(!!initial?.tugas4);

  // ====== derived ======
  const totalDone = useMemo(() => [t1, t2, t3, t4].filter(Boolean).length, [t1, t2, t3, t4]);
  const progress = useMemo(() => (totalDone / 4) * 100, [totalDone]);
  const progressInt = Math.round(progress);
  const progressTone = progressInt >= 100 ? "success" : progressInt > 0 ? "primary" : "default";

  // disable tombol kalau kosong atau busy
  const judulNow = () => (judulRef.current?.value ?? "").trim();
  const disabled = busy || !judulNow();

  // ====== submit ======
  const handleSubmit = async () => {
    const payload: UpsertKarilPayload = {
      judul: judulNow(),
      tugas1: t1,
      tugas2: t2,
      tugas3: t3,
      tugas4: t4,
      keterangan: (() => {
        const k = (ketRef.current?.value ?? "").trim();
        return k || undefined;
      })(),
    };
    await onSubmit(payload);
  };

  // ====== UI helpers ======
  const SectionCard: React.FC<{ children: React.ReactNode; title?: string; hint?: string }> = ({ children, title, hint }) => (
    <div className="rounded-2xl border border-default-200 bg-content1 p-4">
      {title && <div className="mb-2 text-sm font-semibold text-foreground">{title}</div>}
      {hint && <div className="mb-3 text-xs text-foreground-500">{hint}</div>}
      {children}
    </div>
  );

  const CheckItem: React.FC<{
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }> = ({ label, checked, onChange }) => (
    <label
      className={[
        "flex cursor-pointer select-none items-center gap-2 rounded-xl border border-default-200 bg-content2 px-3 py-2 transition",
        checked ? "ring-1 ring-success-400/40" : "",
      ].join(" ")}
    >
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-default-300 accent-emerald-500"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={busy}
      />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </label>
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-default-200 bg-content1 shadow-md">
      {/* Accent */}
      <div
        className={[
          "h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500",
          progressInt >= 100 ? "from-emerald-400 via-teal-500 to-emerald-600" : "",
        ].join(" ")}
      />

      <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
        {/* Kiri: Judul + Keterangan (UNCONTROLLED) */}
        <div className="flex flex-col gap-4">
          <SectionCard title="Judul KARIL" hint="Isi dengan judul karya ilmiah.">
            <div className="relative">
              <input
                ref={judulRef}
                type="text"
                placeholder="cth: Analisis Sistem Informasi"
                className="w-full rounded-xl border border-default-200 bg-content1 px-3 py-2 text-foreground outline-none ring-0 focus:border-default-300 focus:ring-2 focus:ring-indigo-400/30"
                disabled={busy}
                defaultValue={initial?.judul ?? ""}
                // autofocus lembut: biarkan browser handle; atau:
                // autoFocus
              />
            </div>
          </SectionCard>

          <SectionCard title="Keterangan" hint="Catatan tambahan (opsional).">
            <div className="relative">
              <textarea
                ref={ketRef}
                placeholder="Catatan tambahan…"
                rows={6}
                className="w-full resize-y rounded-xl border border-default-200 bg-content1 px-3 py-2 text-foreground outline-none ring-0 focus:border-default-300 focus:ring-2 focus:ring-indigo-400/30"
                disabled={busy}
                defaultValue={initial?.keterangan ?? ""}
              />
            </div>
          </SectionCard>
        </div>

        {/* Kanan: Tugas + Progress (CONTROLLED ringan) */}
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
              <Progress aria-label="Progress tugas KARIL" value={progress} color={progressTone} className="w-full" />
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
              <CheckItem label="Tugas 1" checked={t1} onChange={setT1} />
              <CheckItem label="Tugas 2" checked={t2} onChange={setT2} />
              <CheckItem label="Tugas 3" checked={t3} onChange={setT3} />
              <CheckItem label="Tugas 4" checked={t4} onChange={setT4} />
            </div>

            <div className="mt-4 flex justify-end">
              <Tooltip content={busy ? "Sedang menyimpan…" : !judulNow() ? "Judul wajib diisi" : "Simpan perubahan"}>
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
