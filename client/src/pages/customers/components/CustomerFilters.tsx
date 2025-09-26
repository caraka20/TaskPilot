import { useEffect, useMemo, useRef, useState } from "react";
import { Input, Button, Select, SelectItem, Kbd, Tooltip, Chip } from "@heroui/react";
import type { ListParams, CustomerJenis } from "../../../utils/customer";
import { CUSTOMER_JENIS_OPTIONS } from "../../../utils/customer";

type Props = {
  initial?: Partial<ListParams>; // jenis optional (single value) → kalau kosong = semua
  onChange: (next: Partial<ListParams>) => void;
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
  const [jenis, setJenis] = useState<CustomerJenis | "">(
    ((Array.isArray(initial?.jenis) ? initial?.jenis[0] : initial?.jenis) as CustomerJenis) ?? ""
  );

  const didMount = useRef(false);

  const apply = () => {
    const val = q.trim();
    const payload: any = { page: 1 };
    if (val) payload.q = val;
    if (jenis) payload.jenis = jenis; // single value
    onChange(payload);
  };

  const reset = () => {
    setQ("");
    setJenis("");
    onChange({ q: undefined, page: 1, jenis: undefined });
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

  const ActiveBadge = () => {
    const items: string[] = [];
    if (q.trim()) items.push(`Cari: "${q.trim()}"`);
    if (jenis) items.push(`Jenis: ${jenis}`);
    if (items.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Chip
          size="sm"
          variant="flat"
          className="border border-default-100 bg-default-50 text-foreground-600"
        >
          {items.join(" • ")}
        </Chip>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-default-100 bg-content1 p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex-1 min-w-[220px]">
            <Input
              label="Cari (nama / NIM)"
              placeholder="nama / nim"
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
            variant="bordered"
            isClearable
            selectedKeys={jenis ? new Set([jenis]) : new Set()}
            onSelectionChange={(keys) => {
              const val = (Array.from(keys)[0] as CustomerJenis | undefined) ?? "";
              setJenis(val);
            }}
          >
            {CUSTOMER_JENIS_OPTIONS.map((k) => (
              <SelectItem key={k}>{k}</SelectItem>
            ))}
          </Select>

          <div className="flex items-center gap-2">
            <Button
              color="primary"
              className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-sm"
              onPress={apply}
            >
              Terapkan
            </Button>
            <Button variant="flat" className="bg-default-100" onPress={reset}>
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
