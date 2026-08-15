// client/src/pages/customers/components/matrix/MatrixTable.tsx
import { useEffect, useRef, useState, useMemo, memo } from "react";
import { flushSync } from "react-dom";
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

import { SESSIONS } from "./constants";
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

const editCourseModalClassNames = {
  wrapper:
    "z-[2200] items-stretch justify-stretch p-0 sm:items-center sm:justify-center sm:p-5",
  backdrop: "bg-slate-950/55 backdrop-blur-[5px]",
  base:
    "m-0 flex h-dvh max-h-dvh w-screen max-w-none flex-col overflow-hidden rounded-none border-0 bg-white text-foreground shadow-[0_28px_90px_-24px_rgba(2,12,27,.52)] dark:bg-slate-950 sm:h-auto sm:min-h-0 sm:max-h-[80dvh] sm:w-[36rem] sm:max-w-[calc(100vw-2rem)] sm:rounded-[24px] sm:border sm:border-white/70 dark:sm:border-slate-700/80",
  closeButton:
    "right-4 top-4 z-30 grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 ring-1 ring-slate-200/80 transition hover:bg-sky-50 hover:text-[#174c6d] dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-sky-400/10 dark:hover:text-sky-200",
} as const;

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
          "pointer-events-none absolute -top-4 right-0 z-50 rounded-lg",
          "bg-emerald-600/95 px-2 py-1 text-[9px] font-bold text-white shadow-lg",
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
          className="min-h-9 min-w-9 cursor-pointer rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-sky-50 hover:text-[#1b5278] active:bg-sky-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-sky-400/10 md:min-h-8 md:min-w-8"
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
  const [editCourseId, setEditCourseId] = useState<number | null>(null);
  const [editMatkul, setEditMatkul] = useState("");
  const [editResetItems, setEditResetItems] = useState(false);
  const editSaveLock = useRef(false);

  const openEdit = (courseId: number, currentMatkul: string) => {
    setEditCourseId(courseId);
    setEditMatkul(currentMatkul);
    setEditResetItems(false);
    setEditOpen(true);
  };

  const resetEditState = () => {
    setEditOpen(false);
    setEditCourseId(null);
    setEditMatkul("");
    setEditResetItems(false);
  };

  const closeEdit = () => {
    resetEditState();
  };

  const saveEdit = async (closeHeroModal: () => void) => {
    if (!editCourseId || editSaveLock.current) return;

    // Simpan nilai terlebih dahulu karena state form akan segera dibersihkan.
    const courseId = editCourseId;
    const originalMatkul = editMatkul;
    const originalResetItems = editResetItems;
    const payload = {
      matkul: editMatkul.trim() || undefined,
      resetItems: editResetItems || undefined,
    };

    editSaveLock.current = true;

    // Lepaskan focus trap dan overlay HeroUI sebelum membuka SweetAlert.
    flushSync(() => {
      resetEditState();
    });
    closeHeroModal();

    // Tunggu animasi keluar modal agar klik pertama tidak ditangkap overlay lama.
    await new Promise<void>((resolve) => window.setTimeout(resolve, 180));

    const confirmation = await Swal.fire({
      icon: "question",
      title: "Simpan perubahan matakuliah?",
      text: editResetItems
        ? "Item akan dibuat ulang menjadi 16 item default. Lanjutkan?"
        : "Perubahan nama matakuliah akan disimpan.",
      showCancelButton: true,
      confirmButtonText: "Simpan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#174c6d",
      cancelButtonColor: "#64748b",
      focusConfirm: true,
      returnFocus: false,
      allowEnterKey: true,
      keydownListenerCapture: true,
      customClass: {
        container: "taskpilot-swal-layer",
      },
    });

    if (!confirmation.isConfirmed) {
      editSaveLock.current = false;
      flushSync(() => {
        setEditCourseId(courseId);
        setEditMatkul(originalMatkul);
        setEditResetItems(originalResetItems);
        setEditOpen(true);
      });
      return;
    }

    try {
      await updateCourse(courseId, payload);

      markDirty();

      editSaveLock.current = false;
      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Matakuliah diperbarui",
        timer: 900,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      window.location.reload();
    } catch (e: any) {
      editSaveLock.current = false;
      await Swal.fire({
        icon: "error",
        title: "Gagal menyimpan",
        text: e?.response?.data?.message || e?.message || "Terjadi kesalahan",
      });

      // Kembalikan form agar pengguna dapat memperbaiki lalu mencoba lagi.
      flushSync(() => {
        setEditCourseId(courseId);
        setEditMatkul(originalMatkul);
        setEditResetItems(originalResetItems);
        setEditOpen(true);
      });
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
  // pairsVersion memicu kalkulasi ulang ketika Set konflik dimutasi oleh parent.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conflicts, pairsVersion]);

  // ====== Columns ======
  const W_MATKUL = "w-[190px] sm:w-[260px] lg:w-[360px]";
  // Seluruh sesi memakai lebar identik agar kolom Diskusi dan Tugas sejajar.
  const W_SESSION = "w-[76px] md:w-[84px]";

  const columns: Column[] = [
    { key: "MATKUL", label: "MATKUL" },
    ...SESSIONS.map((s) => {
      const isDone = (absenHeaderMode[s.sesi] ?? "BELUM") === "SELESAI";
      return {
        key: `S${s.sesi}`,
        sesi: s.sesi,
        label: (
          <div className="flex flex-col items-center gap-1">
            <div className="text-xs font-black tracking-wide">{s.label}</div>
            <Button
              size="sm"
              radius="full"
              aria-label={`Toggle absen sesi ${s.sesi}`}
              className={[
                "min-h-8 rounded-full px-2.5 text-[10px] font-bold md:h-6 md:min-h-0",
                isDone
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-white/12 text-white/80 ring-1 ring-inset ring-white/20 hover:bg-white/20",
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
  // Cell MATKUL tidak memakai `tuton-conflict-cell` karena class tersebut
  // menetapkan position:relative dan dapat membatalkan perilaku sticky.
  const stickyConflictClasses = "tuton-conflict-bg tuton-conflict-ring tuton-conflict-hover tuton-conflict-accent !sticky";

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-200/70 bg-sky-50/60 px-3 py-2 text-[11px] font-medium text-[#1b5278] dark:border-slate-800 dark:bg-sky-400/5 dark:text-sky-300 md:hidden">
        <span>Geser horizontal untuk melihat seluruh sesi</span>
        <span aria-hidden="true" className="tracking-[.18em]">↔</span>
      </div>
      <div
        className="max-w-full overflow-x-auto overscroll-x-contain touch-pan-x"
        role="region"
        aria-label="Tabel Tuton yang dapat digeser ke samping"
        tabIndex={0}
      >
        <Table
          key={pairsVersion}
          aria-label="Tuton Matrix"
          removeWrapper
          classNames={{
            table:
              "min-w-[820px] table-fixed border-separate border-spacing-0 text-[13px] lg:min-w-[1100px]",
            thead: "sticky top-0 z-20 shadow-[0_7px_16px_-14px_rgba(15,23,42,.8)]",
            th: "border-b border-r border-white/10 bg-[#173f5f] px-2 py-2.5 text-center text-white first:border-l-0 last:border-r-0",
            tbody: "[&>tr:last-child>td]:border-b-0",
            tr: "group/row transition-colors hover:bg-sky-50/35 dark:hover:bg-sky-400/[.035]",
            td: "overflow-visible border-b border-r border-slate-200/70 px-2 py-2.5 text-center align-middle last:border-r-0 dark:border-slate-800/80",
          }}
          selectionMode="none"
        >
          <TableHeader columns={columns}>
            {(column) => {
              const widthCls = column.key === "MATKUL" ? W_MATKUL : W_SESSION;

              return (
                <TableColumn
                  key={column.key}
                  className={[
                    column.key === "MATKUL"
                      ? "sticky left-0 z-30 bg-[#12344d] text-left shadow-[6px_0_16px_-16px_rgba(15,23,42,.9)]"
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
                      const stickyBg = isConflictRow
                        ? ""
                        : "bg-white group-hover/row:bg-sky-50/80 dark:bg-slate-900 dark:group-hover/row:bg-slate-800";

                      return (
                        <TableCell
                          className={[
                            "text-left overflow-visible relative",
                            "sticky left-0 z-30 isolate",
                            stickyBg,
                            "shadow-[6px_0_16px_-16px_rgba(15,23,42,.9)] transition-colors",
                            "overscroll-x-contain",
                            W_MATKUL,
                            isConflictRow ? stickyConflictClasses : "",
                          ].join(" ")}
                        >

                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <Tooltip content={c.matkul} placement="top-start" offset={6} showArrow>
                                <div
                                  className="truncate text-[13px] font-black leading-tight tracking-[0.01em] text-slate-800 dark:text-slate-100 md:text-sm"
                                  title={c.matkul}
                                >
                                  {c.matkul}
                                </div>
                              </Tooltip>
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                                <>
                                  <Tooltip content="Edit matkul" placement="top">
                                    <Button
                                      size="sm"
                                      isIconOnly
                                      variant="flat"
                                      className="min-h-9 min-w-9 rounded-xl bg-slate-100 text-slate-500 hover:bg-sky-50 hover:text-[#1b5278] dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-sky-400/10 md:min-h-8 md:min-w-8"
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
                                      className="min-h-9 min-w-9 rounded-xl bg-slate-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-rose-400/10 md:min-h-8 md:min-w-8"
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

                    return (
                      <TableCell
                        className={[
                          Number.isFinite(sesiNum) ? `${W_SESSION} px-1` : "",
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
      <Modal
        isOpen={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setEditCourseId(null);
            setEditMatkul("");
            setEditResetItems(false);
          }
        }}
        isDismissable
        size="full"
        placement="center"
        backdrop="blur"
        scrollBehavior="inside"
        classNames={editCourseModalClassNames}
      >
        <ModalContent className="min-h-0">
          {(closeHeroModal) => (
            <form
              className="contents"
              onSubmit={(event) => {
                event.preventDefault();
                void saveEdit(closeHeroModal);
              }}
            >
              <ModalHeader className="relative shrink-0 border-b border-slate-200/70 px-5 py-5 pr-16 dark:border-slate-800 sm:px-6 sm:py-6 sm:pr-16">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#123b5a] text-sky-100 shadow-[0_8px_20px_-12px_rgba(18,59,90,.8)] dark:bg-sky-400/15 dark:text-sky-200 dark:shadow-none">
                    <Pencil className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[.18em] text-teal-600 dark:text-teal-300">Pengaturan matakuliah</p>
                    <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950 dark:text-white">Edit nama matakuliah</h2>
                    <p className="mt-1 text-xs font-normal leading-5 text-slate-500 dark:text-slate-400">Perbarui nama atau susun ulang item bawaan matakuliah ini.</p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody className="min-h-0 gap-5 overflow-y-auto bg-slate-50/65 px-5 py-5 dark:bg-slate-950 sm:px-6 sm:py-6">
                <Input
                  label="Nama matakuliah"
                  labelPlacement="outside"
                  placeholder="Masukkan nama matakuliah"
                  value={editMatkul}
                  onValueChange={setEditMatkul}
                  variant="bordered"
                  classNames={{
                    label: "font-bold text-slate-700 dark:text-slate-200",
                    inputWrapper: "min-h-12 rounded-xl border-slate-200 bg-white shadow-none group-data-[focus=true]:border-teal-500 dark:border-slate-700 dark:bg-slate-900",
                    input: "font-semibold text-slate-950 dark:text-white",
                  }}
                  autoFocus
                />
                <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="min-w-0 text-sm">
                    <div className="font-bold text-slate-800 dark:text-slate-100">Buat ulang item default</div>
                    <div className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                      Hapus semua item dan buat ulang 16 item default (5 Diskusi, 8 Absen, 3 Tugas).
                    </div>
                  </div>
                  <Switch
                    isSelected={editResetItems}
                    onValueChange={setEditResetItems}
                    color="success"
                    className="shrink-0"
                  />
                </div>
              </ModalBody>
              <ModalFooter className="shrink-0 border-t border-slate-200/70 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
                <Button type="button" variant="flat" className="min-h-10 rounded-xl px-5 font-semibold" onPress={closeEdit}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="min-h-10 rounded-xl bg-[#123b5a] px-5 font-bold text-white shadow-[0_8px_18px_-12px_rgba(18,59,90,.8)]"
                  isDisabled={!editMatkul.trim() && !editResetItems}
                >
                  Simpan perubahan
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
