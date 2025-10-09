import React, { useMemo, useState } from "react";
import { Button, Progress, Chip, Divider, Tooltip } from "@heroui/react";
import type { UpsertKarilPayload, KarilDetail } from "../../../services/karil.service";

type Props = {
  initial?: KarilDetail | null;
  onSubmit: (payload: UpsertKarilPayload) => void | Promise<void>;
  busy?: boolean;
};

export default function KarilForm({ initial, onSubmit, busy }: Props) {
  // ✅ pakai state full controlled
  const [judul, setJudul] = useState(initial?.judul ?? "");
  const [keterangan, setKeterangan] = useState(initial?.keterangan ?? "");
  const [t1, setT1] = useState(!!initial?.tugas1);
  const [t2, setT2] = useState(!!initial?.tugas2);
  const [t3, setT3] = useState(!!initial?.tugas3);
  const [t4, setT4] = useState(!!initial?.tugas4);

  const totalDone = useMemo(() => [t1, t2, t3, t4].filter(Boolean).length, [t1, t2, t3, t4]);
  const progress = useMemo(() => (totalDone / 4) * 100, [totalDone]);
  const progressInt = Math.round(progress);
  const progressTone = progressInt >= 100 ? "success" : progressInt > 0 ? "primary" : "default";

  const disabled = busy || !judul.trim();

  const handleSubmit = async () => {
    const payload: UpsertKarilPayload = {
      judul: judul.trim(),
      tugas1: t1,
      tugas2: t2,
      tugas3: t3,
      tugas4: t4,
      keterangan: keterangan.trim() || null,
    };
    console.log("[KarilForm] SUBMIT payload:", payload);
    await onSubmit(payload);
  };

  const CheckItem = ({ label, checked, onChange }: any) => (
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
      {/* Accent bar */}
      <div
        className={[
          "h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500",
          progressInt >= 100 ? "from-emerald-400 via-teal-500 to-emerald-600" : "",
        ].join(" ")}
      />
      <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
        {/* Kiri: input teks */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-default-200 bg-content1 p-4">
            <div className="mb-2 text-sm font-semibold text-foreground">Judul KARIL</div>
            <input
              type="text"
              placeholder="cth: Analisis Sistem Informasi"
              className="w-full rounded-xl border border-default-200 bg-content1 px-3 py-2 text-foreground outline-none ring-0 focus:border-default-300 focus:ring-2 focus:ring-indigo-400/30"
              disabled={busy}
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
            />
          </div>

          <div className="rounded-2xl border border-default-200 bg-content1 p-4">
            <div className="mb-2 text-sm font-semibold text-foreground">Keterangan</div>
            <textarea
              placeholder="Catatan tambahan…"
              rows={6}
              className="w-full resize-y rounded-xl border border-default-200 bg-content1 px-3 py-2 text-foreground outline-none ring-0 focus:border-default-300 focus:ring-2 focus:ring-indigo-400/30"
              disabled={busy}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
            />
          </div>
        </div>

        {/* Kanan: checklist & progress */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-default-200 bg-content1 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-foreground">Progress Tugas</div>
              <Chip size="sm" variant="flat">
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
              <div className="mt-1 text-right text-xs text-foreground-500">
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
              <Tooltip
                isDisabled={busy || !judul.trim()}
                content={!judul.trim() ? "Judul wajib diisi" : "Simpan perubahan"}
              >
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
          </div>
        </div>
      </div>
    </div>
  );
}
