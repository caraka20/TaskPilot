// client/src/pages/users/components/WorkHistory.tsx
import { useMemo, useState } from "react";
import {
  Card, CardBody, Tabs, Tab, Chip, Pagination,
  Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Select, SelectItem, Checkbox
} from "@heroui/react";
import type { AxiosInstance } from "axios";
import { toHMS } from "../../../utils/format";
import { updateJamKerjaStrict, type UpdateJamKerjaPayload } from "../../../services/jamKerja.service";
import { showApiError, showConfirm, showLoading, closeAlert, showSuccess } from "../../../utils/alert"

type Props = {
  items: any[];                   // daftar histori (desc)
  serverNow?: string | null;
  title?: string;
  api: AxiosInstance;
  canEdit?: boolean;
  onUpdated?: () => void | Promise<void>;
};

function ymd(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function fmtDateTime(x?: string | Date | null) {
  if (!x) return "-";
  const d = typeof x === "string" ? new Date(x) : x;
  return d.toLocaleString("id-ID");
}

// == helpers datetime-local ==
function toInputLocalValue(iso?: string | Date | null): string {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
function fromInputLocalValue(val: string): string | null {
  if (!val) return null;
  return new Date(val).toISOString();
}

export default function WorkHistory({
  items = [],
  title = "Histori Jam Kerja",
  api,
  canEdit = true,
  onUpdated,
}: Props) {
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

  // ====== Modal Update state ======
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [fStatus, setFStatus] = useState<"AKTIF" | "JEDA" | "SELESAI">("AKTIF");
  const [fMulai, setFMulai] = useState<string>("");     // datetime-local
  const [fSelesai, setFSelesai] = useState<string>(""); // datetime-local
  const [fRecalc, setFRecalc] = useState<boolean>(true);

  function openModal(row: any) {
    setEditing(row);
    setFStatus(row?.status ?? "AKTIF");
    setFMulai(toInputLocalValue(row?.jamMulai ?? row?.mulai ?? row?.tanggal ?? null));
    setFSelesai(toInputLocalValue(row?.jamSelesai ?? row?.selesai ?? null));
    setFRecalc(true);
    setOpen(true);
  }
  function resetModal() {
    setOpen(false);
    setBusy(false);
    setEditing(null);
    setFStatus("AKTIF");
    setFMulai("");
    setFSelesai("");
    setFRecalc(true);
  }

  async function handleSubmit() {
    if (!editing) return;

    // konfirmasi sebelum update
    const c = await showConfirm({
      title: "Simpan perubahan sesi?",
      text: "Perubahan akan memengaruhi rekap jam & gaji (jika dihitung ulang).",
      confirmText: "Simpan",
    });
    if (!c.isConfirmed) return;

    try {
      setBusy(true);
      showLoading("Menyimpan perubahan...");

      const id: number = editing.id;
      const payload: UpdateJamKerjaPayload = { status: fStatus, recalcGaji: fRecalc };

      // jamMulai
      if (fMulai) payload.jamMulai = fromInputLocalValue(fMulai)!;

      // jamSelesai rules
      if (fStatus === "AKTIF") {
        payload.jamSelesai = null;
      } else if (fStatus === "SELESAI") {
        if (!fSelesai) throw new Error("Untuk status SELESAI, jam selesai wajib diisi.");
        payload.jamSelesai = fromInputLocalValue(fSelesai)!;
      } else {
        payload.jamSelesai = fSelesai ? fromInputLocalValue(fSelesai) : null;
      }

      await updateJamKerjaStrict(api, id, payload);

      closeAlert(); // tutup loading
      await showSuccess("Berhasil", "Jam kerja berhasil diupdate.");

      resetModal();
      await onUpdated?.();
    } catch (e) {
      closeAlert();
      await showApiError(e);
      setBusy(false);
    }
  }

  return (
    <>
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
                tabList: "bg-content2 p-1 rounded-full border border-default-200/70 shadow-inner",
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
            <table className="min-w-[760px] w-full text-sm">
              <thead>
                <tr className="text-foreground-500">
                  <th className="text-left py-2">Mulai</th>
                  <th className="text-left py-2">Selesai</th>
                  <th className="text-left py-2">Durasi</th>
                  <th className="text-left py-2">Status</th>
                  {canEdit && <th className="text-left py-2">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 5 : 4} className="py-8 text-center text-foreground-400">
                      Belum ada data.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((r) => {
                    const mulai = r?.jamMulai ?? r?.tanggal ?? null;
                    const selesai = r?.jamSelesai ?? null;
                    const detik = Math.max(0, Math.round(((r?.totalJam ?? 0) as number) * 3600));
                    const chipColor =
                      r?.status === "AKTIF" ? "success"
                      : r?.status === "JEDA" ? "warning"
                      : r?.status === "SELESAI" ? "secondary"
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
                        {canEdit && (
                          <td className="py-3">
                            <Button size="sm" variant="flat" onPress={() => openModal(r)}>
                              Update
                            </Button>
                          </td>
                        )}
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

      {/* Modal Update */}
      <Modal isOpen={open} onOpenChange={(v) => (!v ? resetModal() : setOpen(v))}>
        <ModalContent>
          <>
            <ModalHeader className="flex flex-col gap-1">
              {editing ? `Update #${editing.id}` : "Update Sesi"}
            </ModalHeader>
            <ModalBody className="space-y-3">
              <Select
                label="Status"
                selectedKeys={[fStatus]}
                onSelectionChange={(keys) => {
                  const k = Array.from(keys)[0] as "AKTIF" | "JEDA" | "SELESAI";
                  setFStatus(k);
                  if (k === "AKTIF") setFSelesai("");
                }}
              >
                <SelectItem key="AKTIF">AKTIF</SelectItem>
                <SelectItem key="JEDA">JEDA</SelectItem>
                <SelectItem key="SELESAI">SELESAI</SelectItem>
              </Select>

              <Input
                type="datetime-local"
                label="Jam Mulai"
                value={fMulai}
                onChange={(e) => setFMulai(e.target.value)}
              />

              <Input
                type="datetime-local"
                label={fStatus === "SELESAI" ? "Jam Selesai (wajib)" : "Jam Selesai (opsional)"}
                value={fSelesai}
                onChange={(e) => setFSelesai(e.target.value)}
                isDisabled={fStatus === "AKTIF"}
              />

              <Checkbox isSelected={fRecalc} onValueChange={setFRecalc}>
                Hitung ulang total gaji (recalcGaji)
              </Checkbox>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={resetModal} isDisabled={busy}>
                Batal
              </Button>
              <Button color="primary" onPress={handleSubmit} isLoading={busy}>
                Simpan
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </>
  );
}
