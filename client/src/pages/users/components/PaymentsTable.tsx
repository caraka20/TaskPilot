type PayItem = {
  id?: number;
  tanggal?: string;      // "YYYY-MM-DD" atau ISO
  jumlah?: number;
  catatan?: string | null;
};

function toRp(n?: number) {
  const v = Number.isFinite(n ?? NaN) ? Number(n) : 0;
  return `Rp. ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(v)}`;
}

export default function PaymentsTable({
  items = [],
  pageInfo,
}: {
  items?: PayItem[];
  pageInfo?: { page?: number; total?: number };
}) {
  const empty = !items || items.length === 0;

  return (
    <div className="rounded-2xl border border-default-100 bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <div className="text-xl font-semibold">Riwayat Pembayaran</div>
          <div className="text-xs text-foreground-400">
            Catatan semua pembayaran yang pernah Anda terima
          </div>
        </div>
        <div className="text-xs text-foreground-400">
          {pageInfo?.total ? `Hal ${pageInfo.page ?? 1}/${pageInfo.total}` : "Hal 1/1"}
        </div>
      </div>
      <div className="border-t border-default-100" />

      {empty ? (
        <div className="px-6 py-12 text-center">
          <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-default-100 grid place-items-center">
            <span className="text-2xl">💸</span>
          </div>
          <div className="font-medium">Belum ada pembayaran.</div>
          <div className="text-xs text-foreground-400">Pembayaran yang masuk akan tampil di sini.</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-content2/80 backdrop-blur">
              <tr className="[&>th]:px-4 [&>th]:py-3 text-left text-foreground-500">
                <th>Tanggal</th>
                <th>Jumlah</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody className="[&>tr:nth-child(even)]:bg-content1/40">
              {items.map((r, i) => (
                <tr key={r.id ?? i} className="border-t border-default-100">
                  <td className="px-4 py-3">{r.tanggal ?? "-"}</td>
                  <td className="px-4 py-3 font-semibold">{toRp(r.jumlah)}</td>
                  <td className="px-4 py-3 text-foreground-500">{r.catatan ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
