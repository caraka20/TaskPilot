import { useEffect, useMemo, useState } from "react";
import { Input, Textarea, Checkbox, Button, Progress, Chip, Divider } from "@heroui/react";
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

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500" />

      <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
        {/* Kiri: Judul + Keterangan */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 text-sm font-semibold text-indigo-600">Judul KARIL</div>
            <Input
              placeholder="cth: Analisis Sistem Informasi"
              value={judul}
              onValueChange={setJudul}
              variant="bordered"
              isDisabled={busy}
            />
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold text-indigo-600">Keterangan</div>
            <Textarea
              placeholder="Catatan tambahan…"
              minRows={5}
              value={ket}
              onValueChange={setKet}
              variant="bordered"
              isDisabled={busy}
            />
          </div>
        </div>

        {/* Kanan: Tugas + Progress */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-indigo-600">Progress Tugas</div>
            <Chip size="sm" variant="flat" className="border bg-slate-50 text-slate-700 border-slate-200">
              {totalDone} / 4 selesai
            </Chip>
          </div>

          <Progress
            aria-label="Progress tugas KARIL"
            value={progress}
            color={progress >= 100 ? "success" : progress > 0 ? "primary" : "default"}
          />
          <div className="text-right text-xs text-slate-500">{progress.toFixed(0)}%</div>

          <Divider />

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Checkbox isSelected={t1} onValueChange={setT1} isDisabled={busy}>
                <span className="text-sm font-medium">Tugas 1</span>
              </Checkbox>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Checkbox isSelected={t2} onValueChange={setT2} isDisabled={busy}>
                <span className="text-sm font-medium">Tugas 2</span>
              </Checkbox>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Checkbox isSelected={t3} onValueChange={setT3} isDisabled={busy}>
                <span className="text-sm font-medium">Tugas 3</span>
              </Checkbox>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Checkbox isSelected={t4} onValueChange={setT4} isDisabled={busy}>
                <span className="text-sm font-medium">Tugas 4</span>
              </Checkbox>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              color="primary"
              className="bg-gradient-to-r from-violet-500 to-sky-500 text-white"
              isLoading={busy}
              isDisabled={disabled}
              onPress={handleSubmit}
            >
              Simpan KARIL
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
