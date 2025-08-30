import React, { useMemo, useState } from "react";
import { Card, CardBody, Tabs, Tab, Chip, Pagination } from "@heroui/react";
import { toHMS } from "../../../utils/format";

type Props = {
  items: any[];                   // daftar histori (desc)
  serverNow?: string | null;
  title?: string;
};

function ymd(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function fmtDateTime(x?: string | Date | null) {
  if (!x) return "-";
  const d = typeof x === "string" ? new Date(x) : x;
  return d.toLocaleString("id-ID");
}

export default function WorkHistory({ items = [], title = "Histori Jam Kerja" }: Props) {
  const [period, setPeriod] = useState<"hari" | "minggu" | "bulan">("hari");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = useMemo(() => {
    const now = new Date();
    const start =
      period === "hari"
        ? ymd(now)
        : period === "minggu"
        ? ymd(new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7)))
        : ymd(new Date(now.getFullYear(), now.getMonth(), 1));
    return items.filter((r) => {
      const t = ymd(new Date((r?.tanggal as any) ?? r?.jamMulai ?? now));
      return t >= start;
    });
  }, [items, period]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <Card className="border border-default-200/70 bg-background/90 backdrop-blur-sm">
      <CardBody className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-semibold">{title}</div>
          <Tabs
            size="sm"
            radius="full"
            selectedKey={period}
            onSelectionChange={(k) => {
              setPage(1);
              setPeriod(k as any);
            }}
            classNames={{
              tabList:
                "bg-content2 p-1 rounded-full border border-default-200/70 shadow-inner",
              cursor: "rounded-full",
              tab: "px-3",
            }}
          >
            <Tab key="hari" title="Hari ini" />
            <Tab key="minggu" title="Minggu ini" />
            <Tab key="bulan" title="Bulan ini" />
          </Tabs>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[680px] w-full text-sm">
            <thead>
              <tr className="text-foreground-500">
                <th className="text-left py-2">Mulai</th>
                <th className="text-left py-2">Selesai</th>
                <th className="text-left py-2">Durasi</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-foreground-400">
                    Belum ada data.
                  </td>
                </tr>
              ) : (
                pageItems.map((r) => {
                  const mulai = r?.tanggal ?? r?.jamMulai ?? null;
                  const selesai = r?.jamSelesai ?? null;
                  const detik = Math.max(0, Math.round(((r?.totalJam ?? 0) as number) * 3600));
                  const chipColor =
                    r?.status === "AKTIF"
                      ? "success"
                      : r?.status === "JEDA"
                      ? "warning"
                      : r?.status === "SELESAI"
                      ? "secondary"
                      : "default";
                  return (
                    <tr key={r?.id} className="border-t border-default-100">
                      <td className="py-3">{fmtDateTime(mulai)}</td>
                      <td className="py-3">{fmtDateTime(selesai)}</td>
                      <td className="py-3">{toHMS(detik)}</td>
                      <td className="py-3">
                        <Chip size="sm" variant="flat" color={chipColor as any}>
                          {r?.status ?? "-"}
                        </Chip>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-foreground-400">
          <div>{filtered.length} entri</div>
          <Pagination
            total={totalPages}
            page={page}
            onChange={setPage}
            showControls
            radius="full"
            classNames={{ item: "bg-content2" }}
          />
        </div>
      </CardBody>
    </Card>
  );
}
