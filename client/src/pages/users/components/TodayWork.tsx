import { Card, CardBody, CardHeader, Chip } from "@heroui/react";
import type { JamKerjaItem } from "../../../services/users.service";

function fmtTime(s: string) {
  const d = new Date(s);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
function fmtDurasiH(totalJam: number) {
  const sec = Math.round(totalJam * 3600);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}j ${m}m`;
}

export default function TodayWork({ items }: { items: JamKerjaItem[] }) {
  return (
    <Card shadow="sm">
      <CardHeader className="flex items-center justify-between">
        <span className="text-sm text-foreground-500">Histori Jam Kerja (Hari Ini)</span>
        <Chip size="sm" variant="flat">{items.length} entri</Chip>
      </CardHeader>
      <CardBody className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-foreground-500">
            <tr>
              <th className="text-left py-2">Mulai</th>
              <th className="text-left py-2">Selesai</th>
              <th className="text-left py-2">Durasi</th>
              <th className="text-left py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={4} className="py-3 text-foreground-400">Belum ada entri hari ini.</td></tr>
            ) : items.map((it) => (
              <tr key={it.id} className="border-t border-default-100">
                <td className="py-2">{fmtTime(it.jamMulai)}</td>
                <td className="py-2">{it.jamSelesai ? fmtTime(it.jamSelesai) : "-"}</td>
                <td className="py-2 tabular-nums">{fmtDurasiH(it.totalJam)}</td>
                <td className="py-2">
                  <Chip size="sm" variant="flat" color={it.status === "AKTIF" ? "success" : it.status === "JEDA" ? "warning" : "default"}>
                    {it.status}
                  </Chip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}
