import { useEffect, useRef, useState } from "react";
import { Input, Button, Select, SelectItem, Chip } from "@heroui/react";
import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import type { ListParams, CustomerLayanan } from "../../../utils/customer";
import { CUSTOMER_LAYANAN_LABEL, CUSTOMER_LAYANAN_OPTIONS } from "../../../utils/customer";

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
  const [layanan, setLayanan] = useState<CustomerLayanan | "">(
    ((Array.isArray(initial?.layanan) ? initial?.layanan[0] : initial?.layanan) as CustomerLayanan) ?? ""
  );

  const didMount = useRef(false);

  const apply = () => {
    const val = q.trim();
    const payload: any = {
      page: 1,
      q: val || undefined,
      layanan: layanan || undefined,
    };
    onChange(payload);
  };

  const reset = () => {
    setQ("");
    setLayanan("");
    onChange({ q: undefined, page: 1, layanan: undefined });
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
  }, [q, layanan, autoSearch, debounceMs]);

  const ActiveBadge = () => {
    const items: string[] = [];
    if (q.trim()) items.push(`Cari: "${q.trim()}"`);
    if (layanan) items.push(`Layanan: ${CUSTOMER_LAYANAN_LABEL[layanan]}`);
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
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <SlidersHorizontal className="h-[18px] w-[18px]" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-foreground">Cari dan saring data</h3>
          <p className="mt-0.5 text-xs text-foreground-500">Pencarian otomatis diterapkan setelah Anda berhenti mengetik.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(240px,1fr)_minmax(210px,.45fr)_auto] md:items-end">
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

        <Select
          label="Jenis layanan"
          labelPlacement="outside"
          variant="bordered"
          isClearable
          selectedKeys={layanan ? new Set([layanan]) : new Set()}
          onSelectionChange={(keys) => {
            const value = (Array.from(keys)[0] as CustomerLayanan | undefined) ?? "";
            setLayanan(value);
          }}
          classNames={{ trigger: "min-h-11 rounded-xl bg-default-50 shadow-none" }}
        >
          {CUSTOMER_LAYANAN_OPTIONS.map((item) => (
            <SelectItem key={item}>{CUSTOMER_LAYANAN_LABEL[item]}</SelectItem>
          ))}
        </Select>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Button color="primary" className="min-h-11 rounded-xl px-6 font-semibold shadow-sm" startContent={<Search className="h-4 w-4" />} onPress={apply}>
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
