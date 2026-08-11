import { Input, Tabs, Tab, Chip } from "@heroui/react";
import { Search, Sun, CalendarRange, CalendarDays, Infinity as InfinityIcon } from "lucide-react";
import type { RangeKey } from "./userlist.types";
import { RANGE_LABEL } from "./userlist.types";

export default function UserListToolbar({
  search,
  onSearchChange,
  range,
  onRangeChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  range: RangeKey;
  onRangeChange: (v: RangeKey) => void;
}) {
  const iconFor = (k: RangeKey) =>
    k === "TODAY" ? <Sun className="h-4 w-4" /> :
    k === "WEEK"  ? <CalendarRange className="h-4 w-4" /> :
    k === "MONTH" ? <CalendarDays className="h-4 w-4" /> :
                    <InfinityIcon className="h-4 w-4" />;

  return (
    <section
      className="flex flex-col gap-3 rounded-2xl border border-default-200/80 bg-content1 p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between"
      aria-label="Filter pengguna"
    >
      <Input
        aria-label="Cari pengguna"
        placeholder="Cari username…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full lg:max-w-md"
        startContent={<Search className="h-4 w-4" />}
        radius="lg"
        variant="bordered"
        classNames={{ inputWrapper: "min-h-11" }}
      />

      <div className="min-w-0 lg:flex lg:items-center lg:gap-2">
        <div className="-mx-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0">
          <Tabs
            aria-label="Rentang waktu"
            selectedKey={range}
            onSelectionChange={(key) => onRangeChange(key as RangeKey)}
            size="sm"
            radius="lg"
            color="primary"
            classNames={{
              base: "w-max min-w-full lg:min-w-0",
              tabList: "min-w-full gap-1 bg-default-100/70 p-1 lg:min-w-0",
              tab: "h-10 min-w-max px-3",
              tabContent: "text-xs font-semibold sm:text-sm",
            }}
          >
            <Tab
              key="TODAY"
              title={<div className="flex items-center gap-1.5">{iconFor("TODAY")}<span>Hari ini</span></div>}
            />
            <Tab
              key="WEEK"
              title={<div className="flex items-center gap-1.5">{iconFor("WEEK")}<span>Minggu</span></div>}
            />
            <Tab
              key="MONTH"
              title={<div className="flex items-center gap-1.5">{iconFor("MONTH")}<span>Bulan</span></div>}
            />
            <Tab
              key="ALL"
              title={<div className="flex items-center gap-1.5">{iconFor("ALL")}<span>Semua</span></div>}
            />
          </Tabs>
        </div>
        <Chip
          size="sm"
          color="primary"
          variant="flat"
          className="hidden shrink-0 shadow-sm xl:inline-flex"
        >
          {RANGE_LABEL[range]}
        </Chip>
      </div>
    </section>
  );
}
