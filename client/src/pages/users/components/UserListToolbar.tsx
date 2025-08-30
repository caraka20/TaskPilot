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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Input
        placeholder="Cari user…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-md"
        startContent={<Search className="h-4 w-4" />}
        radius="lg"
        variant="bordered"
      />

      <div className="flex items-center gap-2">
        <Tabs
          aria-label="Rentang waktu"
          selectedKey={range}
          onSelectionChange={(k) => onRangeChange(k as RangeKey)}
          size="sm"
          radius="lg"
          color="primary"
          className="w-full sm:w-auto"
        >
          <Tab key="TODAY"  title={<div className="flex items-center gap-2">{iconFor("TODAY")}<span>Hari ini</span></div>} />
          <Tab key="WEEK"   title={<div className="flex items-center gap-2">{iconFor("WEEK")}<span>Minggu ini</span></div>} />
          <Tab key="MONTH"  title={<div className="flex items-center gap-2">{iconFor("MONTH")}<span>Bulan ini</span></div>} />
          <Tab key="ALL"    title={<div className="flex items-center gap-2">{iconFor("ALL")}<span>Semua</span></div>} />
        </Tabs>
        <Chip size="sm" color="primary" variant="flat" className="shadow-sm">
          {RANGE_LABEL[range]}
        </Chip>
      </div>
    </div>
  );
}
