// client/src/pages/customers/CustomerDetail.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tooltip,
} from "@heroui/react";

import {
  addCustomerPayment,
  getCustomerById,
  getTutonSummary,
  updateInvoiceTotal,
} from "../../services/customer.service";
import {
  getKarilDetail,
  upsertKarilDetail,
  type KarilDetail as KarilDetailType,
  type UpsertKarilPayload,
} from "../../services/karil.service";

import type { CustomerDetail as DetailType } from "../../utils/customer";

import CustomerDetailCard from "./components/CustomerDetailCard";
import PaymentsForm from "./components/PaymentsForm";
import UpdateInvoiceForm from "./components/UpdateInvoiceForm";
import PaymentsTable from "./components/PaymentsTable";
// ❌ Hapus TutonSummaryCard (tidak dipakai lagi)
// import TutonSummaryCard from "./components/TutonSummaryCard";
import KarilForm from "./components/KarilForm";

import { showApiError, showLoading, closeAlert, showSuccess } from "../../utils/alert";
import { useAuthStore } from "../../store/auth.store";
import BackButton from "../../components/common/BackButton";
import { IdCard, GraduationCap, Tag, BookOpen } from "lucide-react";
import KarilDetailSection from "./components/KarilDetailSection";
import TutonCoursesSection from "../tuton/components/TutonCoursesSection";
import TutonMatrixTable from "../tuton/components/TutonMatrixTable";

export default function CustomerDetail() {
  const { id } = useParams();
  const idNum = useMemo(() => Number(id), [id]);
  const isOwner = useAuthStore((s) => s.role === "OWNER");

  const [data, setData] = useState<DetailType | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // KARIL state
  const [karil, setKaril] = useState<KarilDetailType | null>(null);

  // Modal KARIL
  const [openKarilModal, setOpenKarilModal] = useState(false);
  const [savingKaril, setSavingKaril] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(idNum)) return;
    setLoading(true);
    try {
      // 1) Customer detail
      const d = await getCustomerById(idNum);
      setData(d);

      // 2) KARIL detail
      try {
        const kd = await getKarilDetail(idNum);
        setKaril(kd ?? null);
      } catch {
        setKaril(null);
      }

      // 3) Tuton summary → tetap dipakai untuk ambil daftar courses
      const s = await getTutonSummary(idNum);
      setSummary(s);
    } catch (e) {
      await showApiError(e);
    } finally {
      setLoading(false);
    }
  }, [idNum]);

  useEffect(() => {
    load();
  }, [load]);

  if (!Number.isFinite(idNum)) {
    return (
      <div className="mx-auto max-w-6xl px-3 md:px-6">
        <Card className="border rounded-2xl shadow-sm">
          <CardBody>Parameter ID tidak valid.</CardBody>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto flex h-[60vh] max-w-6xl items-center justify-center px-3 md:px-6">
        <Spinner label="Memuat detail customer..." />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl px-3 md:px-6">
        <Card className="bg-white shadow-md border rounded-2xl">
          <CardBody>
            <div className="text-red-500">Data tidak ditemukan.</div>
            <Button as={Link} to="/customers" variant="flat" className="mt-2">
              Kembali
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // ===== Jenis & label KARIL/TK =====
  const jenisNormalized = String(data.jenis ?? "").trim().toUpperCase();
  const isKarilLike = jenisNormalized === "KARIL" || jenisNormalized === "TK";
  const karilLabel = jenisNormalized === "TK" ? "TK" : "KARIL";

  // hanya TUTON atau TK yang boleh lihat Tuton sections
  const showTutonMatrix = jenisNormalized === "TUTON" || jenisNormalized === "TK";

  // ===== Actions =====
  const onAddPayment = async (payload: { amount: number; catatan?: string; tanggalBayar?: string }) => {
    showLoading("Mencatat pembayaran...");
    try {
      await addCustomerPayment(idNum, payload);
      closeAlert();
      await showSuccess("Pembayaran tercatat");
      await load();
    } catch (e) {
      closeAlert();
      await showApiError(e);
    }
  };

  const onUpdateInvoice = async (totalBayar: number) => {
    showLoading("Memperbarui tagihan...");
    try {
      await updateInvoiceTotal(idNum, { totalBayar });
      closeAlert();
      await showSuccess("Tagihan diperbarui");
      await load();
    } catch (e) {
      closeAlert();
      await showApiError(e);
    }
  };

  // helper: derive fields turunan KARIL (untuk optimistic)
  const withDerived = (k: any) => {
    const done = [k.tugas1, k.tugas2, k.tugas3, k.tugas4].filter(Boolean).length;
    return {
      ...k,
      totalTasks: 4,
      doneTasks: done,
      progress: done / 4,
    };
  };

  const handleSaveKaril = async (payload: UpsertKarilPayload) => {
    setSavingKaril(true);
    showLoading(`Menyimpan ${karilLabel}…`);
    try {
      const optimisticBase = karil ?? {
        customerId: idNum,
        judul: payload.judul ?? "",
        tugas1: !!payload.tugas1,
        tugas2: !!payload.tugas2,
        tugas3: !!payload.tugas3,
        tugas4: !!payload.tugas4,
        keterangan: payload.keterangan ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const optimistic = withDerived({ ...optimisticBase, ...payload });
      setKaril(optimistic);

      await upsertKarilDetail(idNum, payload);
      closeAlert();
      await showSuccess(`${karilLabel} tersimpan`);

      getKarilDetail(idNum)
        .then((fresh) => setKaril(fresh ? withDerived(fresh) : optimistic))
        .catch(() => {});
      setOpenKarilModal(false);
    } catch (e) {
      closeAlert();
      await showApiError(e);
    } finally {
      setSavingKaril(false);
    }
  };

  // ===== Ambil daftar course dari summary (defensif) =====
  const courses: Array<any> = Array.isArray(summary?.courses)
    ? summary.courses
    : Array.isArray(summary)
    ? summary
    : [];

  const singleCourse = courses.length === 1 ? (courses[0] ?? null) : null;
  const singleCourseId = singleCourse ? (singleCourse.courseId ?? singleCourse.id) : null;

  return (
    <div className="mx-auto max-w-6xl px-3 md:px-6 py-2 md:py-4">
      {/* Header premium */}
      <Card className="rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-indigo-500 to-fuchsia-500" />
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-4">
            <BackButton variant="flat" tone="sky" tooltip="Kembali" />
            <div className="flex items-center gap-3">
              <span className="h-9 w-[3px] rounded-full bg-gradient-to-b from-sky-400 to-indigo-500 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]" />
              <div className="flex flex-col">
                <div className="text-[17px] sm:text-lg font-semibold tracking-tight text-slate-900">
                  Customer Detail
                </div>
                <div className="text-[13px] sm:text-sm text-slate-500">
                  Profil customer, tagihan, dan progres layanan.
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Chip
              size="sm"
              variant="flat"
              className="border border-slate-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]"
              startContent={<Tag className="h-3.5 w-3.5" />}
            >
              {jenisNormalized || "—"}
            </Chip>
            {data.nim && (
              <Chip
                size="sm"
                variant="flat"
                className="border border-slate-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]"
                startContent={<IdCard className="h-3.5 w-3.5" />}
              >
                NIM: <span className="ml-1 font-medium">{data.nim}</span>
              </Chip>
            )}
            {data.jurusan && (
              <Chip
                size="sm"
                variant="flat"
                className="border border-slate-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]"
                startContent={<GraduationCap className="h-3.5 w-3.5" />}
              >
                {data.jurusan}
              </Chip>
            )}

            {/* Daftar KARIL/TK */}
            {isKarilLike && (
              <Tooltip placement="bottom" offset={6} content={`Lihat daftar ${karilLabel}`}>
                <Button
                  as={Link}
                  to="/karil"
                  variant="flat"
                  className="bg-gradient-to-r from-violet-500 to-sky-500 text-white shadow-sm"
                >
                  Daftar {karilLabel}
                </Button>
              </Tooltip>
            )}

            {/* Shortcut Tuton (kalau 1 course) — hanya TUTON/TK */}
            {showTutonMatrix && singleCourseId && (
              <Tooltip placement="bottom" offset={6} content="Kelola Tuton matkul ini">
                <Button
                  as={Link}
                  to={`/tuton-courses/${singleCourseId}`}
                  variant="flat"
                  className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-sm"
                  startContent={<BookOpen className="h-3.5 w-3.5" />}
                >
                  Kelola Tuton
                </Button>
              </Tooltip>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Detail utama */}
      <div className="mt-4">
        <CustomerDetailCard data={data} password={(data as any).password} showBilling={isOwner} />

        {/* ======== Tuton (dipindah ke SINI, di bawah detail akun) ======== */}
        {showTutonMatrix && summary && (
          <div className="mt-6 flex flex-col gap-4">
            {/* ❌ Hilangkan ringkasan total (TutonSummaryCard) */}

            {/* Kelola daftar matkul (add/delete) */}
            <TutonCoursesSection customerId={idNum} courses={summary?.courses} onChanged={load} />

            {/* Matrix detail per matkul */}
            {Array.isArray(summary?.courses) && summary.courses.length > 0 && (
              <div className="mt-2">
                <TutonMatrixTable courses={summary.courses} onSaved={load} />
              </div>
            )}
          </div>
        )}

        {/* ======== KARIL/TK detail diletakkan SETELAH Tuton Matrix ======== */}
        <KarilDetailSection
          karil={karil}
          isKaril={isKarilLike}
          isOwner={true}
          onManage={() => setOpenKarilModal(true)}
          label={karilLabel}
        />
      </div>

      {/* OWNER-only panels */}
      {isOwner && (
        <>
          <Card className="mt-6 shadow-md border bg-white rounded-2xl">
            <CardHeader className="font-semibold text-indigo-600">Tambah Pembayaran</CardHeader>
            <CardBody>
              <PaymentsForm onSubmit={onAddPayment} />
            </CardBody>
          </Card>

          <Card className="mt-4 shadow-md border bg-white rounded-2xl">
            <CardHeader className="font-semibold text-indigo-600">Update Total Tagihan</CardHeader>
            <CardBody>
              <UpdateInvoiceForm initialTotal={data.totalBayar} onSubmit={onUpdateInvoice} />
            </CardBody>
          </Card>

          <Card className="mt-4 shadow-md border bg-white rounded-2xl">
            <CardHeader className="font-semibold text-indigo-600">Riwayat Pembayaran</CardHeader>
            <CardBody>
              <PaymentsTable customerId={idNum} />
            </CardBody>
          </Card>
        </>
      )}

      {/* ========= MODAL: Kelola / Upsert KARIL/TK ========= */}
      {(karil || isKarilLike) && (
        <Modal isOpen={openKarilModal} onOpenChange={setOpenKarilModal} size="2xl" placement="center">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <span className="text-indigo-600 font-semibold">Kelola / Upsert {karilLabel}</span>
                  <span className="text-xs text-foreground-500">
                    Perbarui judul, checklist tugas, dan keterangan {karilLabel} untuk customer ini.
                  </span>
                </ModalHeader>
                <ModalBody>
                  <KarilForm initial={karil} onSubmit={handleSaveKaril} busy={savingKaril} />
                </ModalBody>
                <ModalFooter>
                  <Button variant="flat" onPress={onClose} isDisabled={savingKaril}>
                    Tutup
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
