// client/src/pages/customers/components/matrix/MatrixTable.tsx
import { useEffect, useRef, useState, useMemo, memo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableColumn,
  Button,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Switch,
} from "@heroui/react";
import { Clipboard, Pencil, Trash2 } from "lucide-react";
import Swal from "sweetalert2";

import { SESSIONS, isTugas } from "./constants";
import SessionsCell from "./SessionsCell";
import type { MinimalCourse, Pair } from "./types";
import type { TutonItemResponse } from "../../../../services/tuton.service";
import { updateCourse, deleteCourse } from "../../../../services/tuton.service";

type Status = "SELESAI" | "BELUM";

type Props = {
  normalized: Array<{ id: number; matkul: string } & MinimalCourse>;
  pairsByCourse: Record<number, Pair[]>;
  pairsVersion: number;
  conflicts: Set<string>;
  conflictIds?: Set<number>;
  absenHeaderMode: Record<number, Status>;
  onToggleHeaderAbsen: (sesi: number) => void;
  isCopas: (cid: number, kind: "DISKUSI" | "TUGAS", sesi: number) => boolean;
  toggleCopas: (cid: number, kind: "DISKUSI" | "TUGAS", sesi: number) => void;
  copyMatkul: (rowId: number, text: string) => void;
  copiedId?: number | null;
  markDirty: (it?: TutonItemResponse) => void;

  /** kontrol visibilitas tombol edit/delete */
  isOwner?: boolean;
};

type Column = { key: string; label: React.ReactNode; sesi?: number };

/** Tombol salin */
const CopyMatkulButton = memo(function CopyMatkulButton({
  rowId,
  text,
  onCopy,
}: {
  rowId: number;
  text: string;
  onCopy: (rowId: number, text: string) => void;
}) {
  const [justCopied, setJustCopied] = useState(false);
  const timer = useRef<number | null>(null);

  const doCopy = () => {
    try {
      onCopy(rowId, text);
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    } finally {
      setJustCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setJustCopied(false), 1400) as unknown as number;
    }
  };

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className="relative inline-flex items-center">
      <span
        role="status"
        aria-live="polite"
        className={[
          "pointer-events-none absolute -top-3 right-0 z-50 rounded-md",
          "bg-emerald-600/95 text-white text-[10px] px-2 py-0.5 shadow",
          "transition-all duration-200 will-change-transform",
          justCopied ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1",
        ].join(" ")}
      >
        Disalin
      </span>

      <Tooltip content="Salin nama matkul" placement="top" offset={6} showArrow>
        <Button
          size="sm"
          isIconOnly
          variant="flat"
          className="bg-default-100 text-foreground-600 cursor-pointer hover:bg-default-200 active:bg-default-300 transition-colors"
          onPress={doCopy}
          aria-label={`Salin nama matkul ${text}`}
          title="Salin nama matkul"
        >
          <Clipboard className="h-4 w-4" />
        </Button>
      </Tooltip>
    </div>
  );
});

export default function MatrixTable({
  normalized,
  pairsByCourse,
  pairsVersion,
  conflicts,
  conflictIds,
  absenHeaderMode,
  onToggleHeaderAbsen,
  isCopas,
  toggleCopas,
  copyMatkul,
  markDirty,
}: Props) {
  // ====== State modal Edit ======
  const [editOpen, setEditOpen] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editCourseId, setEditCourseId] = useState<number | null>(null);
  const [editMatkul, setEditMatkul] = useState("");
  const [editResetItems, setEditResetItems] = useState(false);

  const openEdit = (courseId: number, currentMatkul: string) => {
    setEditCourseId(courseId);
    setEditMatkul(currentMatkul);
    setEditResetItems(false);
    setEditOpen(true);
  };

  const confirmSaveEdit = async () => {
    if (!editCourseId) return;
    const { value: ok } = await Swal.fire({
      icon: "question",
      title: "Simpan perubahan matakuliah?",
      text: editResetItems
        ? "Item akan direset (hapus semua & buat default 19 item). Lanjutkan?"
        : "Perubahan nama matkul akan disimpan.",
      showCancelButton: true,
      confirmButtonText: "Simpan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#2563eb",
    });
    if (!ok) return;

    setEditBusy(true);
    try {
      await updateCourse(editCourseId, {
        matkul: editMatkul.trim() || undefined,
        resetItems: editResetItems || undefined,
      });
      await Swal.fire({
        icon: "success",
        title: "Tersimpan",
        timer: 1200,
        showConfirmButton: false,
      });
      setEditOpen(false);

      // ✅ reload data
      markDirty();
      window.location.reload();
    } catch (e: any) {
      await Swal.fire({
        icon: "error",
        title: "Gagal menyimpan",
        text: e?.response?.data?.message || e?.message || "Terjadi kesalahan",
      });
    } finally {
      setEditBusy(false);
    }
  };

  const onDeleteCourse = async (courseId: number, matkul: string) => {
    const ok = await Swal.fire({
      icon: "warning",
      title: "Hapus matakuliah?",
      html: `Anda akan menghapus <b>${matkul}</b> beserta semua item di dalamnya.`,
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
    });
    if (!ok.isConfirmed) return;

    try {
      await deleteCourse(courseId);
      await Swal.fire({
        icon: "success",
        title: "Terhapus",
        timer: 1000,
        showConfirmButton: false,
      });

      // ✅ reload data
      markDirty();
      window.location.reload();
    } catch (e: any) {
      await Swal.fire({
        icon: "error",
        title: "Gagal menghapus",
        text: e?.response?.data?.message || e?.message || "Terjadi kesalahan",
      });
    }
  };

  // ====== Conflict normalize ======
  const norm = (s: string) => (s || "").trim().replace(/\s+/g, " ").toUpperCase();
  const conflictKeySet = useMemo(() => {
    const arr = Array.from(conflicts ?? new Set<string>());
    return new Set(arr.map(norm));
  }, [conflicts, pairsVersion]);

  // ====== Columns ======
  const W_MATKUL = "w-[360px]";
  const W_NARROW = "w-[56px] md:w-[64px]";
  const W_NORMAL = "w-[92px] md:w-[108px]";

  const columns: Column[] = [
    { key: "MATKUL", label: "MATKUL" },
    ...SESSIONS.map((s) => {
      const isDone = (absenHeaderMode[s.sesi] ?? "BELUM") === "SELESAI";
      return {
        key: `S${s.sesi}`,
        sesi: s.sesi,
        label: (
          <div className="flex flex-col items-center gap-1">
            <div className="font-medium">{s.label}</div>
            <Button
              size="sm"
              radius="full"
              aria-label={`Toggle absen sesi ${s.sesi}`}
              className={[
                "h-6 px-3 text-[11px]",
                isDone ? "bg-emerald-600 text-white" : "bg-default-200 text-foreground-700",
              ].join(" ")}
              onPress={() => onToggleHeaderAbsen(s.sesi)}
              title={isDone ? "Set Absen → BELUM" : "Set Absen → SELESAI"}
            >
              {isDone ? "Absen ✓" : "Absen"}
            </Button>
          </div>
        ),
      };
    }),
  ];

  const conflictClasses = "tuton-conflict-bg tuton-conflict-ring tuton-conflict-cell tuton-conflict-hover";

  return (
    <>
      <div className="overflow-x-auto">
        <Table
          key={pairsVersion}
          aria-label="Tuton Matrix"
          removeWrapper
          classNames={{
            table:
              "min-w-[1100px] table-fixed text-[13px] border border-default-200 border-separate border-spacing-0",
            thead: "sticky top-0 z-10 shadow-sm",
            th: "bg-blue-600 text-white font-medium text-[13px] py-2 px-2 text-center border border-blue-500/70",
            td: "py-2 px-2 align-middle text-center border border-default-200 overflow-visible",
          }}
          selectionMode="none"
        >
          <TableHeader columns={columns}>
            {(column) => {
              const widthCls =
                column.key === "MATKUL"
                  ? W_MATKUL
                  : column.sesi && isTugas(column.sesi)
                  ? W_NORMAL
                  : W_NARROW;

              return (
                <TableColumn
                  key={column.key}
                  className={[
                    column.key === "MATKUL"
                      ? "text-left sticky left-0 z-30 shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.06)] bg-blue-600"
                      : "text-center",
                    widthCls,
                  ].join(" ")}
                >
                  {column.label}
                </TableColumn>
              );
            }}
          </TableHeader>

          <TableBody items={normalized} emptyContent="Belum ada course">
            {(c) => {
              const isConflictRow =
                (conflictIds?.has(c.id) ?? false) ||
                (!conflictIds && conflictKeySet.has(norm(c.matkul)));

              return (
                <TableRow key={c.id}>
                  {(columnKey) => {
                    if (columnKey === "MATKUL") {
                      const stickyBg = isConflictRow ? "" : "bg-content1";

                      return (
                        <TableCell
                          className={[
                            "text-left overflow-visible relative",
                            "sticky left-0 z-20",
                            stickyBg,
                            "shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.06)]",
                            "overflow-x-hidden overscroll-x-none touch-pan-y",
                            W_MATKUL,
                            isConflictRow ? `${conflictClasses} tuton-conflict-accent` : "",
                          ].join(" ")}
                        >

                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <Tooltip content={c.matkul} placement="top-start" offset={6} showArrow>
                                <div
                                  className="truncate text-[14px] md:text-[15px] font-semibold tracking-[0.015em] text-foreground leading-tight"
                                  title={c.matkul}
                                >
                                  {c.matkul}
                                </div>
                              </Tooltip>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                                <>
                                  <Tooltip content="Edit matkul" placement="top">
                                    <Button
                                      size="sm"
                                      isIconOnly
                                      variant="flat"
                                      className="bg-default-100 text-foreground-600 hover:bg-default-200 rounded-xl"
                                      onPress={() => openEdit(c.id, c.matkul)}
                                      aria-label={`Edit ${c.matkul}`}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </Tooltip>

                                  <Tooltip content="Hapus matkul" placement="top">
                                    <Button
                                      size="sm"
                                      isIconOnly
                                      variant="flat"
                                      className="bg-default-100 text-danger-600 hover:bg-default-200 rounded-xl"
                                      onPress={() => onDeleteCourse(c.id, c.matkul)}
                                      aria-label={`Hapus ${c.matkul}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </Tooltip>
                                </>

                              <CopyMatkulButton
                                rowId={c.id}
                                text={c.matkul}
                                onCopy={(rowId, text) => {
                                  copyMatkul(rowId, text);
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>
                      );
                    }

                    const sesiMatch = String(columnKey).match(/^S(\d+)$/i);
                    const sesiNum = sesiMatch ? parseInt(sesiMatch[1], 10) : NaN;
                    const arr: Pair[] = pairsByCourse[c.id] ?? [];
                    const p = Number.isFinite(sesiNum) ? arr.find((x) => x.sesi === sesiNum) : undefined;

                    const isNarrow = Number.isFinite(sesiNum) && !isTugas(sesiNum);

                    return (
                      <TableCell
                        className={[
                          Number.isFinite(sesiNum)
                            ? (isNarrow ? `${W_NARROW} px-1` : `${W_NORMAL} px-2`)
                            : "",
                          isConflictRow ? conflictClasses : "",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-center">
                          <SessionsCell
                            sesi={Number.isFinite(sesiNum) ? sesiNum : 0}
                            diskusi={p?.diskusi}
                            tugas={p?.tugas}
                            isCopasDiskusi={!!(
                              p?.diskusi && isCopas(c.id, "DISKUSI", Number.isFinite(sesiNum) ? sesiNum : 0)
                            )}
                            isCopasTugas={!!(
                              p?.tugas && isCopas(c.id, "TUGAS", Number.isFinite(sesiNum) ? sesiNum : 0)
                            )}
                            toggleCopasDiskusi={() =>
                              Number.isFinite(sesiNum) && toggleCopas(c.id, "DISKUSI", sesiNum)
                            }
                            toggleCopasTugas={() =>
                              Number.isFinite(sesiNum) && toggleCopas(c.id, "TUGAS", sesiNum)
                            }
                            markDirty={markDirty}
                            compact
                          />
                        </div>
                      </TableCell>
                    );
                  }}
                </TableRow>
              );
            }}
          </TableBody>
        </Table>
      </div>

      {/* ===== Modal Edit Matakuliah ===== */}
      <Modal isOpen={editOpen} onOpenChange={setEditOpen} size="md" placement="center" backdrop="blur">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Edit Matakuliah</ModalHeader>
              <ModalBody className="gap-4">
                <Input
                  label="Nama matakuliah"
                  placeholder="Masukkan nama matakuliah"
                  value={editMatkul}
                  onValueChange={setEditMatkul}
                  isDisabled={editBusy}
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">Reset items</div>
                    <div className="text-foreground-500 text-[12px]">
                      Hapus semua item dan buat ulang 19 item default (8 Diskusi, 8 Absen, 3 Tugas).
                    </div>
                  </div>
                  <Switch
                    isSelected={editResetItems}
                    onValueChange={setEditResetItems}
                    isDisabled={editBusy}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={() => onClose()} isDisabled={editBusy}>
                  Batal
                </Button>
                <Button color="primary" onPress={confirmSaveEdit} isLoading={editBusy}>
                  Simpan
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
