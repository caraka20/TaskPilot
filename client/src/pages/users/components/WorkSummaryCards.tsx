import { Card, CardBody } from "@heroui/react";
import { Clock, CalendarCheck, Timer } from "lucide-react";

function fmtHMSFromHours(h: number) {
  const total = Math.max(0, Math.round(h * 3600));
  const hh = String(Math.floor(total / 3600)).padStart(2, "0");
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
function fmtJam(h: number) {
  return (Math.round(h * 1000) / 1000).toLocaleString("id-ID");
}

export default function WorkSummaryCards({
  hari, minggu, semua,
}: { hari: number; minggu: number; semua: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card shadow="sm"><CardBody className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 grid place-items-center rounded-xl bg-default-100"><Clock className="h-5 w-5" /></div>
          <div>
            <div className="text-xs text-foreground-500">Jam Hari Ini</div>
            <div className="text-2xl font-extrabold tracking-tight">{fmtHMSFromHours(hari)}</div>
            <div className="text-xs text-foreground-500">≈ {fmtJam(hari)} jam</div>
          </div>
        </div>
      </CardBody></Card>

      <Card shadow="sm"><CardBody className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 grid place-items-center rounded-xl bg-default-100"><CalendarCheck className="h-5 w-5" /></div>
          <div>
            <div className="text-xs text-foreground-500">Jam Minggu Ini</div>
            <div className="text-2xl font-extrabold tracking-tight">{fmtJam(minggu)}<span className="text-sm font-medium"> jam</span></div>
            <div className="text-xs text-foreground-500">Akumulasi Senin–Minggu berjalan</div>
          </div>
        </div>
      </CardBody></Card>

      <Card shadow="sm"><CardBody className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 grid place-items-center rounded-xl bg-default-100"><Timer className="h-5 w-5" /></div>
          <div>
            <div className="text-xs text-foreground-500">Seluruh Jam</div>
            <div className="text-2xl font-extrabold tracking-tight">{fmtJam(semua)}<span className="text-sm font-medium"> jam</span></div>
            <div className="text-xs text-foreground-500">Total sepanjang waktu</div>
          </div>
        </div>
      </CardBody></Card>
    </div>
  );
}
