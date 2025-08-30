import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Pagination, Input, Select, SelectItem, Button,
} from "@heroui/react";
import { useEffect, useState } from "react";
import { listCustomerPayments } from "../../../services/customer.service";
import type { PaymentsListParams, PaymentsListResponse } from "../../../utils/customer";
import { fmtRp, toISODateOnly } from "../../../utils/customer";

export default function PaymentsTable({ customerId }: { customerId: number }) {
  const [params, setParams] = useState<PaymentsListParams>({ page: 1, limit: 5, sortDir: "desc" });
  const [data, setData] = useState<PaymentsListResponse>();
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listCustomerPayments(customerId, params);
      setData(res); // <-- wrapper sudah unwrap
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, JSON.stringify(params)]);

  const rows = data?.items ?? [];
  const pg = data?.pagination;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Input
          type="date"
          label="Start"
          value={params.start ?? ""}
          onValueChange={(v: string) =>
            setParams((p) => ({ ...p, page: 1, start: v ? toISODateOnly(v) : undefined }))
          }
        />
        <Input
          type="date"
          label="End"
          value={params.end ?? ""}
          onValueChange={(v: string) =>
            setParams((p) => ({ ...p, page: 1, end: v ? toISODateOnly(v) : undefined }))
          }
        />
        <Select
          label="Urutan"
          selectedKeys={[params.sortDir ?? "desc"]}
          onChange={(e) =>
            setParams((p) => ({ ...p, page: 1, sortDir: (e.target.value as "asc" | "desc") || "desc" }))
          }
        >
          <SelectItem key="desc">Terbaru → Lama</SelectItem>
          <SelectItem key="asc">Lama → Terbaru</SelectItem>
        </Select>
        <Select
          label="Limit"
          selectedKeys={[String(params.limit ?? 5)]}
          onChange={(e) =>
            setParams((p) => ({ ...p, page: 1, limit: Number(e.target.value) || 5 }))
          }
        >
          <SelectItem key="5">5</SelectItem>
          <SelectItem key="10">10</SelectItem>
          <SelectItem key="20">20</SelectItem>
        </Select>
        <Button variant="flat" onPress={() => setParams((p) => ({ ...p }))}>Refresh</Button>
      </div>

      <Table aria-label="Histori Pembayaran" removeWrapper isStriped>
        <TableHeader>
          <TableColumn>TANGGAL</TableColumn>
          <TableColumn>JUMLAH</TableColumn>
          <TableColumn>CATATAN</TableColumn>
        </TableHeader>
        <TableBody isLoading={loading} emptyContent={loading ? "Memuat..." : "Belum ada pembayaran"}>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{new Date(r.tanggalBayar).toLocaleString("id-ID")}</TableCell>
              <TableCell>{fmtRp(r.amount)}</TableCell>
              <TableCell>{r.catatan ?? "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {pg && (
        <div className="flex justify-end">
          <Pagination
            showControls
            page={pg.page}
            total={pg.totalPages}
            onChange={(p: number) => setParams((prev) => ({ ...prev, page: p }))}
          />
        </div>
      )}
    </div>
  );
}
