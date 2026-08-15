import { Input, Tab, Tabs } from "@heroui/react";
import { CalendarDays, CalendarRange, Infinity as InfinityIcon, Search, SlidersHorizontal, Sun } from "lucide-react";

import type { RangeKey } from "./userlist.types";

const PERIODS: Array<{ key: RangeKey; label: string; icon: typeof Sun }> = [
  { key: "TODAY", label: "Hari ini", icon: Sun },
  { key: "WEEK", label: "Minggu ini", icon: CalendarRange },
  { key: "MONTH", label: "Bulan ini", icon: CalendarDays },
  { key: "ALL", label: "Semua", icon: InfinityIcon },
];

export default function UserListToolbar({
  search,
  onSearchChange,
  range,
  onRangeChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  range: RangeKey;
  onRangeChange: (value: RangeKey) => void;
}) {
  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Direktori tim</p>
            <h2 className="mt-0.5 text-lg font-bold text-foreground">Cari dan tinjau performa user</h2>
            <p className="mt-1 text-sm text-foreground-500">Pilih periode untuk menyesuaikan akumulasi jam dan payroll.</p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(260px,380px)_auto] lg:items-center">
          <Input
            aria-label="Cari pengguna"
            placeholder="Cari nama atau username…"
            value={search}
            onValueChange={onSearchChange}
            startContent={<Search className="h-4 w-4 text-foreground-400" />}
            variant="bordered"
            classNames={{
              inputWrapper: "min-h-11 rounded-xl border-default-200 bg-default-50/60 shadow-none data-[hover=true]:border-primary/40",
            }}
          />

          <div className="-mx-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0">
            <Tabs
              aria-label="Rentang waktu"
              selectedKey={range}
              onSelectionChange={(key) => onRangeChange(key as RangeKey)}
              size="sm"
              color="primary"
              classNames={{
                base: "w-max min-w-full lg:min-w-0",
                tabList: "min-w-full gap-1 rounded-xl bg-default-100/80 p-1 lg:min-w-0",
                tab: "h-9 min-w-max rounded-lg px-3",
                tabContent: "text-xs font-semibold",
                cursor: "rounded-lg",
              }}
            >
              {PERIODS.map(({ key, label, icon: Icon }) => (
                <Tab
                  key={key}
                  title={<span className="flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" />{label}</span>}
                />
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
