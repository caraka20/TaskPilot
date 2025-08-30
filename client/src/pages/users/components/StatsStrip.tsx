import { Chip } from "@heroui/react";
import { Users, Activity, PauseCircle, Clock3, Wallet, Gauge } from "lucide-react";
import type { RangeKey, RowItem } from "./userlist.types";

export default function StatsStrip({
  users,
  range,
}: {
  users: RowItem[];
  range: RangeKey;
}) {
  const pick = (u: RowItem) => {
    switch (range) {
      case "TODAY": return { jam: u.totalJamHariIni,   gaji: u.totalGajiHariIni };
      case "WEEK":  return { jam: u.totalJamMingguIni, gaji: u.totalGajiMingguIni };
      case "MONTH": return { jam: u.totalJamBulanIni,  gaji: u.totalGajiBulanIni };
      default:      return { jam: u.totalJamSemua,     gaji: u.totalGajiSemua };
    }
  };

  const nUsers = users.length;
  let sumJam = 0, sumGaji = 0, maxJam = 0, aktif = 0, jeda = 0;

  for (const u of users) {
    const s = pick(u);
    sumJam += Number(s.jam) || 0;
    sumGaji += Number(s.gaji) || 0;
    maxJam = Math.max(maxJam, Number(s.jam) || 0);
    if (u.statusNow === "AKTIF") aktif += 1;
    if (u.statusNow === "JEDA") jeda += 1;
  }

  const fmtHours = (x: number) => (Math.round(x * 10) / 10).toFixed(1);
  const fmtRupiah = (x: number) => `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(x)}`;

  return (
    <div className="flex flex-wrap gap-2">
      <Chip variant="flat" startContent={<Users className="h-3.5 w-3.5" />}>Users: <b className="ml-1">{nUsers}</b></Chip>
      <Chip color="success" variant="flat" startContent={<Activity className="h-3.5 w-3.5" />}>Aktif: <b className="ml-1">{aktif}</b></Chip>
      <Chip color="warning" variant="flat" startContent={<PauseCircle className="h-3.5 w-3.5" />}>Jeda: <b className="ml-1">{jeda}</b></Chip>
      <Chip variant="flat" startContent={<Clock3 className="h-3.5 w-3.5" />}>Total Jam: <b className="ml-1">{fmtHours(sumJam)}</b></Chip>
      <Chip variant="flat" startContent={<Gauge className="h-3.5 w-3.5" />}>Max Jam: <b className="ml-1">{fmtHours(maxJam)}</b></Chip>
      <Chip variant="flat" startContent={<Wallet className="h-3.5 w-3.5" />}>Total Gaji: <b className="ml-1">{fmtRupiah(sumGaji)}</b></Chip>
    </div>
  );
}
