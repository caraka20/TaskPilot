import { useEffect, useRef, useState } from "react";
import { Input, Button, Kbd, Chip, Tooltip } from "@heroui/react";
import type { KarilListParams } from "../../../services/karil.service";

type Props = {
  initial?: Partial<KarilListParams>;
  onChange: (next: Partial<KarilListParams>) => void;
  autoSearch?: boolean;
  debounceMs?: number;
};

export default function KarilFilters({
  initial,
  onChange,
  autoSearch = true,
  debounceMs = 450,
}: Props) {
  const [q, setQ] = useState(initial?.q ?? "");
  const [progress, setProgress] = useState<"all" | "complete" | "incomplete">(
    (initial?.progress as any) ?? "all"
  );

  const didMount = useRef(false);

  const apply = () => {
    const payload: Partial<KarilListParams> = {
      page: 1,
      limit: initial?.limit ?? 10,
    };
    if (q.trim()) payload.q = q.trim();
    if (progress !== "all") payload.progress = progress;
    onChange(payload);
  };

  const reset = () => {
    setQ("");
    setProgress("all");
    onChange({
      page: 1,
      limit: initial?.limit ?? 10,
      q: undefined,
      progress: "all",
    });
  };

  useEffect(() => {
    if (!autoSearch) return;
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    const t = setTimeout(apply, debounceMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, progress, autoSearch, debounceMs]);

  const ProgressChips = () => (
    <div className="flex items-center gap-2">
      {[
        { key: "all", label: "Semua" },
        { key: "complete", label: "Selesai" },
        { key: "incomplete", label: "Belum lengkap" },
      ].map((opt) => {
        const active = progress === (opt.key as any);
        return (
          <Chip
            key={opt.key}
            size="sm"
            variant={active ? "solid" : "flat"}
            color={active ? "primary" : "default"}
            className={active ? "shadow-sm" : "border border-slate-200 bg-slate-50"}
            onClick={() => setProgress(opt.key as any)}
          >
            {opt.label}
          </Chip>
        );
      })}
    </div>
  );

  const ActiveBadge = () => {
    const items: string[] = [];
    if (q.trim()) items.push(`Cari: "${q.trim()}"`);
    if (progress !== "all") items.push(`Progress: ${progress === "complete" ? "Selesai" : "Belum lengkap"}`);
    if (items.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-2">
        {items.map((t, i) => (
          <Chip key={i} size="sm" variant="flat" className="border border-slate-200 bg-slate-50">
            {t}
          </Chip>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex-1 min-w-[240px]">
            <Input
              label="Cari (nama / NIM)"
              placeholder="ketik nama atau NIM"
              value={q}
              onValueChange={setQ}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              variant="bordered"
              isClearable
              onClear={() => setQ("")}
              startContent={
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-foreground-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              }
            />
          </div>

          {/* Progress — pilih salah satu (Chips premium) */}
          <div className="min-w-[240px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Progress</label>
            <ProgressChips />
          </div>

          {/* Tombol aksi */}
          <div className="flex items-center gap-2">
            <Button
              color="primary"
              className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-sm"
              onPress={apply}
            >
              Terapkan
            </Button>
            <Button variant="flat" className="bg-slate-50" onPress={reset}>
              Reset
            </Button>
            <Tooltip content="Shortcut">
              <div className="hidden sm:flex items-center text-foreground-400 text-sm ml-1">
                Tekan <Kbd className="mx-1">Enter</Kbd> untuk cepat.
              </div>
            </Tooltip>
          </div>
        </div>

        <div className="mt-3">
          <ActiveBadge />
        </div>
      </div>
    </div>
  );
}
