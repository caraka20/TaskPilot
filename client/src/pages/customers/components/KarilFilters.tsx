// client/src/pages/customers/components/KarilFilters.tsx
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

  // auto-apply (debounced) saat q/progress berubah
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
    <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter progress KARIL">
      {[
        { key: "all", label: "Semua" },
        { key: "complete", label: "Selesai" },
        { key: "incomplete", label: "Belum lengkap" },
      ].map((opt) => {
        const active = progress === (opt.key as any);
        return (
          <Button
            key={opt.key}
            size="sm"
            variant={active ? "solid" : "flat"}
            color={active ? "primary" : "default"}
            className={
              active
                ? "min-h-10 shrink-0 rounded-xl bg-indigo-600 px-3 text-white shadow-sm"
                : "min-h-10 shrink-0 rounded-xl border border-default-200 bg-default-100 px-3 text-foreground-600 hover:bg-default-200"
            }
            onPress={() => setProgress(opt.key as any)}
            aria-pressed={active}
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );

  const ActiveBadge = () => {
    const items: string[] = [];
    if (q.trim()) items.push(`Cari: "${q.trim()}"`);
    if (progress !== "all")
      items.push(`Progress: ${progress === "complete" ? "Selesai" : "Belum lengkap"}`);
    if (items.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-2">
        {items.map((t, i) => (
          <Chip
            key={i}
            size="sm"
            variant="flat"
            className="border border-default-200 bg-default-100 text-foreground-600"
          >
            {t}
          </Chip>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-default-200 bg-content1 p-3 sm:p-4 shadow-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          {/* Cari */}
          <div className="min-w-0 flex-1">
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
              classNames={{ inputWrapper: "min-h-12 rounded-2xl" }}
            />
          </div>

          {/* Progress */}
          <div className="min-w-0 lg:min-w-72">
            <label className="block text-xs font-medium text-foreground-500 mb-1">Progress</label>
            <ProgressChips />
          </div>

          {/* Aksi */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Button
              className="min-h-11 rounded-2xl bg-indigo-600 text-white shadow-sm"
              onPress={apply}
            >
              Terapkan
            </Button>
            <Button variant="flat" className="min-h-11 rounded-2xl bg-default-100" onPress={reset}>
              Reset
            </Button>
            <Tooltip content="Shortcut">
              <div className="ml-1 hidden items-center text-sm text-foreground-400 xl:flex">
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
