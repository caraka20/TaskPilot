import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import {
  listItems,
  bulkUpdateStatus,
  updateItem,           // untuk COPAS
  updateItemStatus,     // fallback jika bulk gagal
  type TutonItemResponse,
  type StatusTugas,
  type BulkStatusRequest,
} from "../../../../services/tuton.service";

import { isTugas } from "./constants";
import type { MinimalCourse, Pair, Dirty } from "./types";
import { showApiError, showLoading, closeAlert } from "../../../../utils/alert";
import { computeAbsenHeaderMode } from "./useAbsenAggregate";

/** Normalisasi ketat: TRIM + UPPER; derive status dari selesaiAt saat tidak konsisten */
function normalizeItem(raw: any): TutonItemResponse {
  const jenisRaw = String(raw?.jenis ?? "");
  const statusRaw = String(raw?.status ?? "BELUM");
  const selesaiAt = raw?.selesaiAt ?? null;

  const jenis = jenisRaw.trim().toUpperCase();
  let status = statusRaw.trim().toUpperCase() as StatusTugas;
  if (selesaiAt && status !== "SELESAI") status = "SELESAI";

  return {
    id: Number(raw?.id),
    courseId: Number(raw?.courseId),
    jenis,
    sesi: Number(raw?.sesi),
    status,
    nilai: raw?.nilai ?? null,
    deskripsi: raw?.deskripsi ?? null,
    selesaiAt,
    copas: !!raw?.copas,
  };
}

export function useMatrixState(courses: MinimalCourse[], onSaved?: () => void) {
  // ===== normalize courses =====
  const normalized = useMemo(
    () =>
      (courses ?? [])
        .map((c) => ({
          id: Number((c.courseId ?? c.id) as number),
          matkul: String(c.matkul ?? "-"),
          totalItems: Number(c.totalItems ?? 0),
          completedItems: Number(c.completedItems ?? 0),
        }))
        .filter((c) => Number.isFinite(c.id)),
    [courses]
  );

  // ===== state utama =====
  const [pairsByCourse, setPairsByCourse] = useState<Record<number, Pair[]>>({});
  const [pairsVersion, setPairsVersion] = useState(0);
  const [dirtyStatus, setDirtyStatus] = useState<Record<number, Dirty>>({});
  const [copasDirty, setCopasDirty] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [bulkSesi, setBulkSesi] = useState(1);
  const [conflicts] = useState<Set<string>>(new Set());
  const [nilaiModal, setNilaiModal] = useState<{ courseId: number; matkul: string } | null>(null);

  // header absen (dari data tampil)
  const absenHeaderMode = useMemo(
    () => computeAbsenHeaderMode(pairsByCourse),
    [pairsByCourse]
  );

  // helper: bangun pairs dari hasil fetch
  const buildPairs = (courseId: number, matkul: string, itemsRaw: any[]): Pair[] => {
    const items = itemsRaw.map(normalizeItem);

    const pick = (j: "ABSEN" | "DISKUSI" | "TUGAS", s: number) =>
      items.find((it) => String(it.jenis).trim().toUpperCase() === j && Number(it.sesi) === s);

    const arr: Pair[] = [];
    for (let s = 1; s <= 8; s++) {
      const absen = pick("ABSEN", s);
      const diskusi = pick("DISKUSI", s);
      const tugas = isTugas(s) ? pick("TUGAS", s) : undefined;
      arr.push({ courseId, matkul, sesi: s, absen, diskusi, tugas, pct: 0 });
    }
    return arr;
  };

  // ===== load items per course (parallel, single commit) =====
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const results = await Promise.all(
          normalized.map(async (c) => {
            const itemsRaw = await listItems(c.id);
            return [c.id, buildPairs(c.id, c.matkul, itemsRaw)] as const;
          })
        );
        if (!live) return;
        const next: Record<number, Pair[]> = {};
        for (const [cid, arr] of results) next[cid] = arr;
        setPairsByCourse(next);
        setPairsVersion((v) => v + 1);
      } catch (e) {
        await showApiError(e);
      }
    })();
    return () => { live = false; };
  }, [normalized]);

  // ====== toggle status item (optimistic; STAGED) ======
  const markDirty = (it?: TutonItemResponse) => {
    if (!it) return;
    const prevStatus = String(it.status).toUpperCase() as StatusTugas;
    const next: StatusTugas = prevStatus === "SELESAI" ? "BELUM" : "SELESAI";

    setDirtyStatus((prev) => ({ ...prev, [it.id]: { itemId: it.id, status: next } }));

    setPairsByCourse((prev) => {
      const copy = { ...prev };
      const arr = copy[it.courseId] ?? [];
      copy[it.courseId] = arr.map((p) => {
        const patch = (x?: TutonItemResponse) =>
          x && x.id === it.id
            ? { ...x, status: next, selesaiAt: next === "SELESAI" ? x.selesaiAt ?? new Date().toISOString() : null }
            : x;
        return { ...p, diskusi: patch(p.diskusi), tugas: patch(p.tugas), absen: patch(p.absen) };
      });
      return copy;
    });
    setPairsVersion((v) => v + 1);
  };

  // ====== COPAS per sel (optimistic; STAGED) ======
  const findItem = (cid: number, kind: "DISKUSI" | "TUGAS", sesi: number) => {
    const arr = pairsByCourse[cid] ?? [];
    const p = arr.find((x) => x.sesi === sesi);
    return kind === "DISKUSI" ? p?.diskusi : p?.tugas;
  };

  const isCopas = (cid: number, kind: "DISKUSI" | "TUGAS", sesi: number) => {
    const it = findItem(cid, kind, sesi);
    if (!it) return false;
    const staged = copasDirty[it.id];
    return typeof staged === "boolean" ? staged : !!it.copas;
  };

  const toggleCopas = (cid: number, kind: "DISKUSI" | "TUGAS", sesi: number) => {
    const it = findItem(cid, kind, sesi);
    if (!it) return;

    const next = !isCopas(cid, kind, sesi);

    setCopasDirty((prev) => ({ ...prev, [it.id]: next }));

    // optimistic agar dot langsung berubah
    setPairsByCourse((prevPairs) => {
      const copy = { ...prevPairs };
      copy[cid] = (copy[cid] ?? []).map((p) => {
        if (p.sesi !== sesi) return p;
        if (kind === "DISKUSI" && p.diskusi?.id === it.id) return { ...p, diskusi: { ...p.diskusi, copas: next } };
        if (kind === "TUGAS" && p.tugas?.id === it.id) return { ...p, tugas: { ...p.tugas, copas: next } };
        return p;
      });
      return copy;
    });
    setPairsVersion((v) => v + 1);
  };

  // ====== HEADER ABSEN (stage massal untuk ABSEN per sesi) ======
  const handleHeaderAbsenToggle = (sesi: number) => {
    const current = absenHeaderMode[sesi] ?? "BELUM";
    const target: StatusTugas = current === "SELESAI" ? "BELUM" : "SELESAI";

    const toChange: Array<{ itemId: number; courseId: number }> = [];
    for (const [cidStr, arr] of Object.entries(pairsByCourse)) {
      const p = (arr as Pair[]).find((x) => x.sesi === sesi);
      const absen = p?.absen;
      if (!absen) continue;
      if (String(absen.status).toUpperCase() !== target) {
        toChange.push({ itemId: absen.id, courseId: Number(cidStr) });
      }
    }
    if (!toChange.length) return;

    setDirtyStatus((prev) => {
      const next = { ...prev };
      for (const { itemId } of toChange) next[itemId] = { itemId, status: target };
      return next;
    });

    setPairsByCourse((prev) => {
      const copy = { ...prev };
      for (const { courseId, itemId } of toChange) {
        copy[courseId] = (copy[courseId] ?? []).map((p) =>
          p.sesi === sesi && p.absen?.id === itemId
            ? {
                ...p,
                absen: {
                  ...p.absen!,
                  status: target,
                  selesaiAt: target === "SELESAI" ? p.absen!.selesaiAt ?? new Date().toISOString() : null,
                },
              }
            : p
        );
      }
      return copy;
    });
    setPairsVersion((v) => v + 1);
  };

  // ===== helper: dialog konfirmasi =====
  async function confirmAction(title: string, html: string) {
    const res = await Swal.fire({
      icon: "question",
      title,
      html,
      showCancelButton: true,
      confirmButtonText: "Lanjutkan",
      cancelButtonText: "Batal",
      focusCancel: true,
    });
    return res.isConfirmed;
  }

  // ====== BULK STATUS (SET SELESAI) — KONFIRMASI + AUTO-SAVE ======
  const handleBulkStatus = async (jenis: "DISKUSI" | "TUGAS" | "ABSEN", sesi: number) => {
    // kumpulkan item pada sesi
    const targets: TutonItemResponse[] = [];
    for (const [, arr] of Object.entries(pairsByCourse)) {
      const p = (arr as Pair[]).find((x) => x.sesi === sesi);
      const it = jenis === "DISKUSI" ? p?.diskusi : jenis === "TUGAS" ? p?.tugas : p?.absen;
      if (it) targets.push(it);
    }
    if (!targets.length) return;

    const toDone = targets.filter((it) => String(it.status).toUpperCase() !== "SELESAI");
    if (toDone.length === 0) {
      await Swal.fire({ icon: "info", title: "Sudah selesai semua", timer: 1200, showConfirmButton: false });
      return;
    }

    const ok = await confirmAction(
      "Set Selesai",
      `Set <b>${jenis}</b> sesi <b>${sesi}</b> menjadi <b>SELESAI</b> untuk <b>${toDone.length}</b> item?`
    );
    if (!ok) return;

    // OPTIMISTIC UI
    setPairsByCourse((prev) => {
      const copy = { ...prev };
      for (const it of toDone) {
        const cid = it.courseId;
        copy[cid] = (copy[cid] ?? []).map((p) => {
          if (p.sesi !== sesi) return p;
          if (jenis === "DISKUSI" && p.diskusi?.id === it.id)
            return { ...p, diskusi: { ...p.diskusi, status: "SELESAI", selesaiAt: p.diskusi!.selesaiAt ?? new Date().toISOString() } };
          if (jenis === "TUGAS" && p.tugas?.id === it.id)
            return { ...p, tugas: { ...p.tugas, status: "SELESAI", selesaiAt: p.tugas!.selesaiAt ?? new Date().toISOString() } };
          if (jenis === "ABSEN" && p.absen?.id === it.id)
            return { ...p, absen: { ...p.absen, status: "SELESAI", selesaiAt: p.absen!.selesaiAt ?? new Date().toISOString() } };
          return p;
        });
      }
      return copy;
    });
    setPairsVersion((v) => v + 1);

    // SAVE BE
    showLoading("Menyimpan…");
    try {
      const byCourse = new Map<number, { itemId: number; status: StatusTugas }[]>();
      for (const it of toDone) {
        const list = byCourse.get(it.courseId) ?? [];
        list.push({ itemId: it.id, status: "SELESAI" });
        byCourse.set(it.courseId, list);
      }
      for (const [cid, items] of byCourse.entries()) {
        try {
          await bulkUpdateStatus(cid, { items } as BulkStatusRequest);
        } catch {
          await Promise.all(items.map(({ itemId, status }) => updateItemStatus(itemId, status)));
        }
      }
      closeAlert();
      await Swal.fire({ icon: "success", title: "Berhasil diset selesai", timer: 900, showConfirmButton: false });
    } catch (e) {
      closeAlert();
      await showApiError(e);
    }
  };

  // ====== BULK COPAS (SET TRUE) — KONFIRMASI + AUTO-SAVE ======
  const handleBulkCopas = async (jenis: "DISKUSI" | "TUGAS", sesi: number) => {
    const targets: TutonItemResponse[] = [];
    for (const [, arr] of Object.entries(pairsByCourse)) {
      const p = (arr as Pair[]).find((x) => x.sesi === sesi);
      const it = jenis === "DISKUSI" ? p?.diskusi : p?.tugas;
      if (it) targets.push(it);
    }
    if (!targets.length) return;

    const toTrue = targets.filter((it) => !it.copas);
    if (toTrue.length === 0) {
      await Swal.fire({ icon: "info", title: "Semua sudah di-COPAS", timer: 1200, showConfirmButton: false });
      return;
    }

    const ok = await confirmAction(
      "Set COPAS",
      `Set <b>Copas ${jenis}</b> sesi <b>${sesi}</b> menjadi <b>Aktif</b> untuk <b>${toTrue.length}</b> item?`
    );
    if (!ok) return;

    // OPTIMISTIC UI
    setPairsByCourse((prevPairs) => {
      const copy = { ...prevPairs };
      for (const it of toTrue) {
        const cid = it.courseId;
        copy[cid] = (copy[cid] ?? []).map((p) => {
          if (p.sesi !== sesi) return p;
          if (jenis === "DISKUSI" && p.diskusi?.id === it.id) return { ...p, diskusi: { ...p.diskusi, copas: true } };
          if (jenis === "TUGAS"   && p.tugas?.id   === it.id) return { ...p, tugas:   { ...p.tugas,   copas: true } };
          return p;
        });
      }
      return copy;
    });
    setPairsVersion((v) => v + 1);

    // SAVE BE
    showLoading("Menyimpan…");
    try {
      await Promise.all(toTrue.map((it) => updateItem(it.id, { copas: true })));
      closeAlert();
      await Swal.fire({ icon: "success", title: "Berhasil set COPAS", timer: 900, showConfirmButton: false });
    } catch (e) {
      closeAlert();
      await showApiError(e);
    }
  };

  // ===== SAVE / CANCEL (untuk perubahan per-cell/manual) =====
  const changedCount = Object.keys(dirtyStatus).length + Object.keys(copasDirty).length;

  const handleSaveAll = async () => {
    const statusList = Object.values(dirtyStatus);
    const copasList = Object.entries(copasDirty).map(([id, v]) => ({ itemId: Number(id), copas: v }));

    if (!statusList.length && !copasList.length) return;

    showLoading("Menyimpan…");
    try {
      // 1) Kirim STATUS
      if (statusList.length) {
        const byCourse = new Map<number, { itemId: number; status: StatusTugas }[]>();
        for (const d of statusList) {
          let courseId = 0;
          for (const [cid, arr] of Object.entries(pairsByCourse)) {
            if ((arr as Pair[]).some((p) => p.absen?.id === d.itemId || p.diskusi?.id === d.itemId || p.tugas?.id === d.itemId)) {
              courseId = Number(cid);
              break;
            }
          }
          if (!courseId) continue;
          const list = byCourse.get(courseId) ?? [];
          list.push(d);
          byCourse.set(courseId, list);
        }

        for (const [cid, items] of byCourse.entries()) {
          try {
            await bulkUpdateStatus(cid, { items } as BulkStatusRequest);
          } catch {
            await Promise.all(items.map(({ itemId, status }) => updateItemStatus(itemId, status)));
          }
        }
      }

      // 2) Kirim COPAS
      if (copasList.length) {
        await Promise.all(copasList.map(({ itemId, copas }) => updateItem(itemId, { copas })));
      }

      // 3) Flush staging
      setDirtyStatus({});
      setCopasDirty({});

      closeAlert();
      await Swal.fire({ icon: "success", title: "Perubahan tersimpan", timer: 900, showConfirmButton: false });
      onSaved?.();
    } catch (e) {
      closeAlert();
      await showApiError(e);
    }
  };

  const handleCancelAll = () => {
    setDirtyStatus({});
    setCopasDirty({});
    setPairsVersion((v) => v + 1);
  };

  // ===== util: salin matkul + badge =====
  const copyMatkul = async (rowId: number, text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        // @ts-ignore old API
        document.execCommand?.("copy");
        document.body.removeChild(ta);
      }
      setCopiedId(rowId);
      window.setTimeout(() => {
        setCopiedId((curr) => (curr === rowId ? null : curr));
      }, 1500);
    } catch {}
  };

  return {
    // untuk <TutonMatrixTable>
    normalized,
    pairsByCourse,
    pairsVersion,
    conflicts,
    absenHeaderMode,
    copiedId,
    nilaiModal,
    setNilaiModal,

    // for <BulkToolbar> & header
    bulkSesi,
    setBulkSesi,
    handleHeaderAbsenToggle,
    handleBulkStatus,    // konfirmasi + auto-save
    handleBulkCopas,     // konfirmasi + auto-save

    // for <MatrixTable>
    markDirty,           // staged
    isCopas,
    toggleCopas,         // staged + optimistic
    copyMatkul,

    // save/cancel (untuk perubahan per-cell/manual)
    handleSaveAll,
    handleCancelAll,

    // meta
    changedCount,
  };
}
