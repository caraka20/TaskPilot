import { useEffect, useMemo, useRef, useState } from "react";
import { Input, Button, Select, SelectItem, Kbd, Tooltip, Chip } from "@heroui/react";
import type { ListParams, CustomerJenis } from "../../../utils/customer";

type Props = {
  initial?: Partial<ListParams> & { jenis?: CustomerJenis };
  onChange: (next: Partial<ListParams> & { jenis?: CustomerJenis | "ALL" }) => void;
  autoSearch?: boolean;
  debounceMs?: number;
};

export default function CustomerFilters({
  initial,
  onChange,
  autoSearch = true,
  debounceMs = 450,
}: Props) {
  const [q, setQ] = useState<string>(initial?.q ?? "");
  const [jenis, setJenis] = useState<CustomerJenis | "ALL">(
    (initial?.jenis as CustomerJenis) ?? "ALL"
  );

  const didMount = useRef(false);

  const apply = () => {
    const val = q.trim();
    const payload: any = { page: 1, jenis }; // kirim SELALU (termasuk "ALL")
    if (val) payload.q = val;
    onChange(payload);
  };

  const reset = () => {
    setQ("");
    setJenis("ALL");
    onChange({ q: undefined, page: 1, jenis: "ALL" } as any);
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
  }, [q, jenis, autoSearch, debounceMs]);

  const enterHint = useMemo(
    () => (
      <span className="hidden md:inline text-foreground-400">
        Tekan <Kbd>Enter</Kbd> untuk terapkan cepat.
      </span>
    ),
    []
  );

  // Badge ringkas untuk mempertegas filter aktif
  const ActiveBadge = () => {
    const items: string[] = [];
    if (q.trim()) items.push(`Cari: "${q.trim()}"`);
    if (jenis !== "ALL") items.push(`Jenis: ${jenis}`);
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
          <div className="flex-1 min-w-[220px]">
            <Input
              label="Cari (nama / NIM)"
              placeholder="zul"
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

          <Select
            label="Jenis"
            className="w-[180px]"
            selectedKeys={[jenis]}
            onChange={(e) =>
              setJenis(((e.target.value as CustomerJenis) || "ALL") as any)
            }
            variant="bordered"
          >
            <SelectItem key="ALL">Semua</SelectItem>
            <SelectItem key="TUTON">TUTON</SelectItem>
            <SelectItem key="KARIL">KARIL</SelectItem>
            <SelectItem key="TK">TK</SelectItem>
          </Select>

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
              <div className="ml-1">{enterHint}</div>
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
