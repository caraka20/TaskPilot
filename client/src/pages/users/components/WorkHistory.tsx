// client/src/pages/users/components/WorkHistory.tsx
import { useMemo, useState } from "react";
import {
  Card, CardBody, Tabs, Tab, Chip, Pagination,
  Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Select, SelectItem, Checkbox
} from "@heroui/react";
import { AlertCircle, CalendarClock, Clock3, PencilLine, Save, TimerReset } from "lucide-react";
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
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
}
function fromInputLocalValue(val: string): string | null {
  if (!val) return null;
  const date = new Date(val);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
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
  const [formError, setFormError] = useState<string>("");

  function openModal(row: any) {
    setEditing(row);
    setFStatus(row?.status ?? "AKTIF");
    setFMulai(toInputLocalValue(row?.jamMulai ?? row?.mulai ?? row?.tanggal ?? null));
    setFSelesai(toInputLocalValue(row?.jamSelesai ?? row?.selesai ?? null));
    setFRecalc(true);
    setFormError("");
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
    setFormError("");
  }

  async function handleSubmit() {
    if (!editing || busy) return;

    const mulaiIso = fromInputLocalValue(fMulai);
    const selesaiIso = fSelesai ? fromInputLocalValue(fSelesai) : null;

    if (!mulaiIso) {
      setFormError("Jam mulai wajib diisi dengan tanggal dan waktu yang valid.");
      return;
    }
    if (fStatus === "SELESAI" && !selesaiIso) {
      setFormError("Jam selesai wajib diisi saat status sesi adalah SELESAI.");
      return;
    }
    if (fSelesai && !selesaiIso) {
      setFormError("Jam selesai tidak valid.");
      return;
    }
    if (selesaiIso && new Date(selesaiIso).getTime() < new Date(mulaiIso).getTime()) {
      setFormError("Jam selesai tidak boleh lebih awal dari jam mulai.");
      return;
    }

    setFormError("");

    // konfirmasi sebelum update
    const c = await showConfirm({
      title: "Simpan perubahan sesi?",
      text: "Perubahan akan memengaruhi rekap jam & gaji (jika dihitung ulang).",
      confirmText: "Simpan",
      tone: "primary",
    });
    if (!c.isConfirmed) return;

    try {
      setBusy(true);
      showLoading("Menyimpan perubahan...");

      const id: number = editing.id;
      const payload: UpdateJamKerjaPayload = { status: fStatus, recalcGaji: fRecalc };

      payload.jamMulai = mulaiIso;

      // jamSelesai rules
      if (fStatus === "AKTIF") {
        payload.jamSelesai = null;
      } else if (fStatus === "SELESAI") {
        payload.jamSelesai = selesaiIso!;
      } else {
        payload.jamSelesai = selesaiIso;
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
      <Card className="overflow-hidden border border-indigo-100/80 bg-content1 shadow-[0_18px_45px_-34px_rgba(79,70,229,.42)] dark:border-indigo-400/15 dark:bg-content1">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400" aria-hidden="true" />
        <CardBody className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 dark:bg-indigo-400/10 dark:text-indigo-300 dark:ring-indigo-400/15">
                <Clock3 className="h-5 w-5" />
              </span>
              <div>
                <div className="text-lg font-bold text-foreground">{title}</div>
                <p className="text-xs text-foreground-500">Pantau dan koreksi waktu kerja secara aman.</p>
              </div>
            </div>
            <Tabs
              size="sm"
              radius="full"
              selectedKey={period}
              onSelectionChange={(k) => {
                setPage(1);
                setPeriod(k as any);
              }}
              classNames={{
                tabList: "w-full bg-default-100/80 p-1 rounded-2xl border border-default-200/70 sm:w-auto",
                cursor: "rounded-xl bg-content1 shadow-sm",
                tab: "min-h-10 flex-1 px-3 sm:flex-none",
              }}
            >
              <Tab key="hari" title="Hari ini" />
              <Tab key="minggu" title="Minggu ini" />
              <Tab key="bulan" title="Bulan ini" />
            </Tabs>
          </div>

          <div className="mt-5 grid gap-3 md:hidden">
            {pageItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-default-300 bg-default-50/60 px-4 py-10 text-center">
                <CalendarClock className="mx-auto h-6 w-6 text-foreground-300" />
                <p className="mt-3 text-sm font-semibold text-foreground-600">Belum ada histori</p>
                <p className="mt-1 text-xs text-foreground-400">Tidak ada sesi pada periode yang dipilih.</p>
              </div>
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
                  <article key={r?.id} className="rounded-2xl border border-default-200/80 bg-default-50/50 p-4 dark:bg-default-100/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-400">Sesi #{r?.id}</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{fmtDateTime(mulai)}</p>
                      </div>
                      <Chip size="sm" variant="flat" color={chipColor as any}>{r?.status ?? "-"}</Chip>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-content1 p-3 shadow-sm dark:bg-content2/80">
                        <p className="text-[11px] text-foreground-400">Selesai</p>
                        <p className="mt-1 text-xs font-semibold text-foreground-700">{fmtDateTime(selesai)}</p>
                      </div>
                      <div className="rounded-xl bg-content1 p-3 shadow-sm dark:bg-content2/80">
                        <p className="text-[11px] text-foreground-400">Durasi</p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-300">
                          <TimerReset className="h-4 w-4" /> {toHMS(detik)}
                        </p>
                      </div>
                    </div>
                    {canEdit && (
                      <Button
                        className="mt-3 min-h-11 w-full bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300"
                        variant="flat"
                        startContent={<PencilLine className="h-4 w-4" />}
                        onPress={() => openModal(r)}
                      >
                        Update sesi
                      </Button>
                    )}
                  </article>
                );
              })
            )}
          </div>

          <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-default-200/80 md:block">
            <table className="min-w-[760px] w-full text-sm">
              <thead>
                <tr className="bg-default-100/80 text-[11px] uppercase tracking-[0.1em] text-foreground-500">
                  <th className="px-4 py-3 text-left">Mulai</th>
                  <th className="px-4 py-3 text-left">Selesai</th>
                  <th className="px-4 py-3 text-left">Durasi</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  {canEdit && <th className="px-4 py-3 text-left">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 5 : 4} className="py-12 text-center text-foreground-400">
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
                      <tr key={r?.id} className="border-t border-default-100 transition-colors hover:bg-indigo-50/40 dark:hover:bg-indigo-400/5">
                        <td className="px-4 py-3.5 font-medium">{fmtDateTime(mulai)}</td>
                        <td className="px-4 py-3.5 text-foreground-600">{fmtDateTime(selesai)}</td>
                        <td className="px-4 py-3.5 font-semibold text-indigo-600 dark:text-indigo-300">{toHMS(detik)}</td>
                        <td className="px-4 py-3.5">
                          <Chip size="sm" variant="flat" color={chipColor as any}>
                            {r?.status ?? "-"}
                          </Chip>
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3.5">
                            <Button size="sm" variant="flat" color="primary" startContent={<PencilLine className="h-3.5 w-3.5" />} onPress={() => openModal(r)}>
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

          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-xs text-foreground-400 sm:flex-row">
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
      <Modal
        isOpen={open}
        onOpenChange={(v) => (!v ? resetModal() : setOpen(v))}
        isDismissable={!busy}
        placement="center"
        scrollBehavior="inside"
        classNames={{ base: "border border-default-200 bg-content1 shadow-2xl", backdrop: "bg-slate-950/55 backdrop-blur-sm" }}
      >
        <ModalContent>
          <form onSubmit={(event) => { event.preventDefault(); void handleSubmit(); }}>
            <ModalHeader className="flex items-center gap-3 border-b border-default-100 px-5 py-4">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
                <PencilLine className="h-5 w-5" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span>{editing ? `Update sesi #${editing.id}` : "Update sesi"}</span>
                <span className="text-xs font-normal text-foreground-500">Koreksi status dan waktu kerja user.</span>
              </span>
            </ModalHeader>
            <ModalBody className="space-y-4 px-5 py-5">
              {formError && (
                <div role="alert" className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <Select
                label="Status"
                labelPlacement="outside"
                variant="bordered"
                selectedKeys={[fStatus]}
                onSelectionChange={(keys) => {
                  const k = Array.from(keys)[0] as "AKTIF" | "JEDA" | "SELESAI";
                  if (!k) return;
                  setFStatus(k);
                  if (k === "AKTIF") setFSelesai("");
                  setFormError("");
                }}
              >
                <SelectItem key="AKTIF">AKTIF</SelectItem>
                <SelectItem key="JEDA">JEDA</SelectItem>
                <SelectItem key="SELESAI">SELESAI</SelectItem>
              </Select>

              <Input
                type="datetime-local"
                label="Jam Mulai"
                labelPlacement="outside"
                variant="bordered"
                step="1"
                value={fMulai}
                onChange={(e) => { setFMulai(e.target.value); setFormError(""); }}
                isRequired
              />

              <Input
                type="datetime-local"
                label={fStatus === "SELESAI" ? "Jam Selesai (wajib)" : "Jam Selesai (opsional)"}
                labelPlacement="outside"
                variant="bordered"
                step="1"
                value={fSelesai}
                onChange={(e) => { setFSelesai(e.target.value); setFormError(""); }}
                isDisabled={fStatus === "AKTIF"}
                isRequired={fStatus === "SELESAI"}
              />

              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 dark:border-amber-400/15 dark:bg-amber-400/5">
                <Checkbox isSelected={fRecalc} onValueChange={setFRecalc}>
                  <span className="font-semibold">Hitung ulang rekap jam dan gaji</span>
                </Checkbox>
                <p className="mt-1 pl-7 text-xs leading-5 text-foreground-500">
                  Nonaktifkan hanya jika perubahan waktu tidak boleh mengoreksi akumulasi payroll.
                </p>
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-default-100 px-5 py-4">
              <Button variant="light" onPress={resetModal} isDisabled={busy}>
                Batal
              </Button>
              <Button
                type="submit"
                color="primary"
                isLoading={busy}
                isDisabled={!fMulai || (fStatus === "SELESAI" && !fSelesai)}
                startContent={!busy ? <Save className="h-4 w-4" /> : undefined}
                className="font-semibold shadow-lg shadow-indigo-500/20"
              >
                Simpan
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}
