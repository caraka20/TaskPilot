// client/src/pages/customers/components/KarilFilters.tsx
import { useEffect, useRef, useState } from "react";
import { Input, Button, Chip, Select, SelectItem } from "@heroui/react";
import { CheckCircle2, Clock3, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import type { KarilListParams } from "../../../services/karil.service";

type Props = {
  initial?: Partial<KarilListParams>;
  onChange: (next: Partial<KarilListParams>) => void;
  autoSearch?: boolean;
  debounceMs?: number;
  label?: string;
};

export default function KarilFilters({
  initial,
  onChange,
  autoSearch = true,
  debounceMs = 450,
  label = "KARIL",
}: Props) {
  const [q, setQ] = useState(initial?.q ?? "");
  const [progress, setProgress] = useState<"all" | "complete" | "incomplete">(
    (initial?.progress as any) ?? "all"
  );
  const [tugasBelum, setTugasBelum] = useState<"all" | "1" | "2" | "3" | "4">(
    initial?.tugasBelum ?? "all"
  );

  const didMount = useRef(false);
  const isMetode = label.toLowerCase().includes("metode");

  const apply = () => {
    const payload: Partial<KarilListParams> = {
      page: 1,
      limit: initial?.limit ?? 10,
    };
    payload.q = q.trim() || undefined;
    payload.progress = progress;
    payload.tugasBelum = tugasBelum;
    onChange(payload);
  };

  const reset = () => {
    setQ("");
    setProgress("all");
    setTugasBelum("all");
    onChange({
      page: 1,
      limit: initial?.limit ?? 10,
      q: undefined,
      progress: "all",
      tugasBelum: "all",
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
  }, [q, progress, tugasBelum, autoSearch, debounceMs]);

  const ProgressChips = () => (
    <div className="flex min-h-11 gap-1 rounded-xl bg-default-100 p-1" role="group" aria-label={`Filter progress ${label}`}>
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
                ? `min-h-9 flex-1 shrink-0 rounded-lg px-3 text-white shadow-sm ${isMetode ? "bg-emerald-600" : "bg-indigo-600"}`
                : "min-h-9 flex-1 shrink-0 rounded-lg bg-transparent px-3 text-foreground-600 hover:bg-content1"
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
    if (tugasBelum !== "all") items.push(`Tugas ${tugasBelum} belum selesai`);
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
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isMetode ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "bg-violet-500/10 text-violet-600 dark:text-violet-300"}`}>
            <SlidersHorizontal className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-foreground">Cari dan saring data</h2>
            <p className="mt-0.5 text-xs text-foreground-500">Temukan customer berdasarkan identitas atau progres tugas.</p>
          </div>
        </div>
        <div className="hidden items-center gap-4 text-xs text-foreground-400 lg:flex">
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 4 tugas selesai</span>
          <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-amber-500" /> Perlu dilanjutkan</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1.2fr)_minmax(280px,.9fr)_minmax(180px,.65fr)_auto] lg:items-end">
        <Input
          label="Nama atau NIM"
          labelPlacement="outside"
          placeholder="Cari customer…"
          value={q}
          onValueChange={setQ}
          onKeyDown={(event) => event.key === "Enter" && apply()}
          variant="bordered"
          isClearable
          onClear={() => setQ("")}
          startContent={<Search className="h-4 w-4 text-foreground-400" />}
          classNames={{ inputWrapper: "min-h-11 rounded-xl bg-default-50 shadow-none" }}
        />

        <div className="min-w-0">
          <label className="mb-1.5 block text-xs font-medium text-foreground-600">Status progres</label>
          <ProgressChips />
        </div>

        <Select
          label="Tugas yang belum selesai"
          labelPlacement="outside"
          selectedKeys={[tugasBelum]}
          onSelectionChange={(keys) => setTugasBelum((Array.from(keys)[0] as typeof tugasBelum) ?? "all")}
          variant="bordered"
          classNames={{ trigger: "min-h-11 rounded-xl bg-default-50 shadow-none" }}
        >
          <SelectItem key="all">Semua tugas</SelectItem>
          <SelectItem key="1">Tugas 1</SelectItem>
          <SelectItem key="2">Tugas 2</SelectItem>
          <SelectItem key="3">Tugas 3</SelectItem>
          <SelectItem key="4">Tugas 4</SelectItem>
        </Select>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Button
            className={`min-h-11 rounded-xl px-5 font-semibold text-white shadow-sm ${isMetode ? "bg-emerald-600" : "bg-indigo-600"}`}
            startContent={<Search className="h-4 w-4" />}
            onPress={apply}
          >
            Terapkan
          </Button>
          <Button isIconOnly aria-label="Reset filter" variant="bordered" className="min-h-11 min-w-11 rounded-xl bg-content1" onPress={reset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-3"><ActiveBadge /></div>
    </div>
  );
}
