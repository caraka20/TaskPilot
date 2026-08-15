// client/src/pages/customers/CustomersList.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Chip } from "@heroui/react";
import Swal from "sweetalert2";
import { useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";

import CustomerFilters from "./components/CustomerFilters";
import CustomerTable from "./components/CustomerTable";
import CustomerForm from "./components/CustomerForm";
import CustomerBillingSummary, {
  type CustomerBillingTotals,
} from "./components/CustomerBillingSummary";
import CustomerListHeader from "./components/CustomerListHeader";
import type { CustomerWithoutCourse } from "./components/CustomerMissingCoursePopover";
import OperationalModal from "../../components/common/OperationalModal";

import { closeAlert, showApiError, showLoading, showSuccess } from "../../utils/alert";
import {
  getCustomers,
  createCustomer,
  deleteCustomer,
  exportCustomersExcel,
} from "../../services/customer.service";

import type {
  CustomerListResponse,
  ListParams,
  CreateCustomerPayload,
  CustomerItem,
} from "../../utils/customer";

/* ================= Helpers ================= */
const isValidLayanan = (v?: string | null): v is "TUTON" | "KARIL" | "METODE_PENELITIAN" => {
  const up = String(v ?? "").toUpperCase();
  return up === "TUTON" || up === "KARIL" || up === "METODE_PENELITIAN";
};

/** Ambil role dari localStorage (kompatibel Zustand/Redux Persist/flat) */
const getRoleFromStorage = (): string => {
  const direct = localStorage.getItem("role");
  if (direct) return String(direct).toUpperCase();
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const obj = JSON.parse(raw);
      const candidate = obj?.role ?? obj?.state?.role ?? obj?.user?.role ?? obj?.auth?.role;
      if (candidate) return String(candidate).toUpperCase();
    } catch {/* ignore */}
  }
  return "";
};
const isOwner = () => getRoleFromStorage() === "OWNER";

/** Fetch seluruh halaman untuk ringkasan global (sesuai filter aktif) */
async function fetchAllCustomersForTotals(baseParams: ListParams) {
  const params = { ...baseParams, page: 1, limit: Math.max(1, baseParams.limit ?? 50) };
  let page = 1;
  let pages = 1;

  let totalBayar = 0;
  let sudahBayar = 0;
  let sisaBayar = 0;
  let countNoMK = 0;
  let totalCount = 0;
  const namesNoMK: Array<{ id: number; namaCustomer: string; nim: string }> = [];

  const first = await getCustomers({ ...params, page });
  totalCount = first.pagination.total;
  pages = first.pagination.totalPages;

  const collect = (b: CustomerItem) => {
    totalBayar += (b.totalBayar ?? 0);
    sudahBayar += (b.sudahBayar ?? 0);
    sisaBayar += (b.sisaBayar ?? 0);
    if ((b.tutonCourseCount ?? 0) === 0) {
      countNoMK += 1;
      if (namesNoMK.length < 50) namesNoMK.push({ id: b.id, namaCustomer: b.namaCustomer, nim: b.nim });
    }
  };
  first.items.forEach(collect);

  for (page = 2; page <= pages; page++) {
    const res = await getCustomers({ ...params, page });
    res.items.forEach(collect);
  }

  return {
    totalsAll: { totalBayar, sudahBayar, sisaBayar, totalCount },
    countNoMK,
    namesNoMK,
    totalPages: pages,
  };
}

/* ================= Component ================= */
export default function CustomersList() {
  // default 50/halaman untuk SEMUA peran
  const [params, setParams] = useState<ListParams>({ page: 1, limit: 50, sortBy: "createdAt", sortDir: "desc" });
  const [data, setData] = useState<CustomerListResponse>();
  const [loading, setLoading] = useState(false);

  const [openAdd, setOpenAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ringkasan global
  const [loadingTotals, setLoadingTotals] = useState(false);
  const [totalsAll, setTotalsAll] = useState<CustomerBillingTotals>({
    totalBayar: 0, sudahBayar: 0, sisaBayar: 0, totalCount: 0
  });
  const [countNoMKAll, setCountNoMKAll] = useState(0);
  const [totalPagesAll, setTotalPagesAll] = useState(1);
  const [namesNoMKAll, setNamesNoMKAll] = useState<CustomerWithoutCourse[]>([]);

  const [searchParams, setSearchParams] = useSearchParams();
  const parseIntParam = (v: string | null, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const owner = useMemo(() => isOwner(), []);
  const billingAccess = useAuthStore((state) => state.canViewCustomerBilling)
  const canSeeBilling =
    owner || billingAccess || Boolean(data?.items?.some((item) => item.billingVisible === true))

  // tidak ada clamp per role; hanya pastikan minimum 1 & default 50
  const clampByRole = (p: ListParams): ListParams => ({
    ...p,
    limit: Math.max(1, p.limit ?? 50),
  });

  const load = useCallback(
    async (p: ListParams = params) => {
      const eff = clampByRole(p);
      setLoading(true);
      try {
        const res = await getCustomers(eff);
        setData(res);
      } catch (e) {
        await showApiError(e);
      } finally {
        setLoading(false);
      }
    },
    [params]
  );

  const loadTotals = useCallback(
    async (p: ListParams = params) => {
      const eff = clampByRole(p);
      setLoadingTotals(true);
      try {
        const r = await fetchAllCustomersForTotals(eff);
        setTotalsAll(r.totalsAll);
        setCountNoMKAll(r.countNoMK);
        setTotalPagesAll(r.totalPages);
        setNamesNoMKAll(r.namesNoMK);
      } catch (e) {
        await showApiError(e);
      } finally {
        setLoadingTotals(false);
      }
    },
    [params]
  );

  // init dari URL (fallback limit -> 50 untuk semua)
  useEffect(() => {
    const fromUrl: ListParams = {
      page: parseIntParam(searchParams.get("page"), 1),
      limit: parseIntParam(searchParams.get("limit"), 50),
      sortBy: (searchParams.get("sortBy") as any) || "createdAt",
      sortDir: (searchParams.get("sortDir") as any) || "desc",
    };
    const q = searchParams.get("q") || undefined;
    const layanan = searchParams.get("layanan");

    if (q) (fromUrl as any).q = q;
    if (isValidLayanan(layanan)) fromUrl.layanan = layanan as any;

    const eff = clampByRole(fromUrl);
    setParams(eff);
    load(eff);
    loadTotals(eff);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync params -> URL (fallback limit -> 50)
  useEffect(() => {
    const sp: Record<string, string> = {
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 50),
      sortBy: String(params.sortBy ?? "createdAt"),
      sortDir: String(params.sortDir ?? "desc"),
    };
    if ((params as any).q) sp.q = String((params as any).q);
    if ((params as any).layanan && isValidLayanan((params as any).layanan)) {
      sp.layanan = String((params as any).layanan);
    }
    setSearchParams(sp, { replace: true });
  }, [params, setSearchParams]);

  // CRUD handlers
  const onCreate = async (payload: CreateCustomerPayload) => {
    setCreating(true);
    try {
      showLoading("Menyimpan customer...");
      await createCustomer(payload);
      closeAlert();
      await showSuccess(
        "Customer berhasil dibuat",
        `${payload.namaCustomer || "Customer baru"} sudah masuk ke daftar layanan.`,
      );
      const base = clampByRole({ ...params, page: 1 });
      setParams(base);
      await load(base);
      await loadTotals(base);
      setOpenAdd(false);
    } catch (e) {
      closeAlert();
      await showApiError(e);
    } finally {
      setCreating(false);
    }
  };

  const onDeleteRow = async (row: CustomerItem) => {
    const ok = await Swal.fire({
      icon: "warning",
      title: "Hapus customer?",
      text: `Hapus ${row.namaCustomer}?`,
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });
    if (!ok.isConfirmed) return;

    try {
      await deleteCustomer(row.id);
      await Swal.fire({ icon: "success", title: "Terhapus", timer: 1200, showConfirmButton: false });
      await load(params);
      await loadTotals(params);
    } catch (e) {
      await showApiError(e);
    }
  };

  const onExportExcel = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const filename = await exportCustomersExcel();
      await Swal.fire({
        icon: "success",
        title: "Excel berhasil dibuat",
        text: `${filename} sudah diunduh.`,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      await showApiError(error);
    } finally {
      setExporting(false);
    }
  };

  const applyFilters = async (next: ListParams & { jenis?: any }) => {
    const merged: any = { ...params, ...next, page: 1 };
    if (!merged.q || !String(merged.q).trim()) delete merged.q;

    if ("layanan" in next) {
      const service = String(next.layanan ?? "").toUpperCase();
      if (service === "ALL" || !isValidLayanan(service)) delete merged.layanan;
      else merged.layanan = service;
    }

    const eff = clampByRole(merged);
    setParams(eff);
    await load(eff);
    await loadTotals(eff);
  };

  // quick search helper (klik nama “tanpa matkul”)
  const quickSearch = async (term: string) => {
    const merged: any = { ...params, q: term, page: 1 };
    const eff = clampByRole(merged);
    setParams(eff);
    await load(eff);
    await loadTotals(eff);
    document.getElementById("customers-list-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ====== Derivatives: sort list yang tampil ====== */
  const sortedItems = useMemo(() => {
    const items = data?.items ?? [];
    return [...items].sort((a, b) => {
      const aNo = (a.tutonCourseCount ?? 0) === 0 ? 0 : 1;
      const bNo = (b.tutonCourseCount ?? 0) === 0 ? 0 : 1;
      if (aNo !== bNo) return aNo - bNo;
      return a.namaCustomer.localeCompare(b.namaCustomer, "id");
    });
  }, [data]);

  const dataForTable: CustomerListResponse | undefined = useMemo(() => {
    if (!data) return data;
    return { ...data, items: sortedItems };
  }, [data, sortedItems]);

  /* ================= Render ================= */
  return (
    <div data-workspace-page className="space-y-5 pb-8">
      <CustomerListHeader
        owner={owner}
        exporting={exporting}
        loadingTotals={loadingTotals}
        totalCustomers={totalsAll.totalCount}
        totalWithoutCourse={countNoMKAll}
        totalPages={totalPagesAll}
        customersWithoutCourse={namesNoMKAll}
        onExportExcel={onExportExcel}
        onAddCustomer={() => setOpenAdd(true)}
        onQuickSearch={quickSearch}
      />

      {canSeeBilling && (
        <CustomerBillingSummary loading={loadingTotals} totals={totalsAll} />
      )}

      <section id="customers-list-card" className="overflow-hidden rounded-[24px] border border-default-200/80 bg-content1 shadow-[0_12px_35px_rgba(15,23,42,.06)]">
        <div className="border-b border-default-200/70 px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Direktori customer</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">Daftar customer</h2>
                <Chip size="sm" variant="flat">{data?.pagination?.total ?? 0} data</Chip>
                <Chip size="sm" variant="flat">Halaman {data?.pagination?.page ?? 1} dari {data?.pagination?.totalPages ?? 1}</Chip>
              </div>
            </div>
            {!canSeeBilling && (
              <div className="rounded-xl bg-primary/5 px-3 py-2 text-xs text-foreground-500">
                Informasi tagihan mengikuti hak akses akun Anda.
              </div>
            )}
          </div>

          <div className="mt-5">
            <CustomerFilters
              initial={{
                ...params,
                layanan: isValidLayanan((params as any).layanan) ? ((params as any).layanan as any) : undefined,
              }}
              onChange={(next) => applyFilters(next as any)}
            />
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6">
          <CustomerTable
            data={dataForTable}
            loading={loading}
            page={params.page ?? 1}
            onPageChange={async (p) => {
              const np = clampByRole({ ...params, page: p });
              setParams(np);
              await load(np);
            }}
            onDelete={onDeleteRow}
          />
        </div>
      </section>

      {/* Modal Tambah Customer */}
      <OperationalModal
        isOpen={openAdd}
        onOpenChange={setOpenAdd}
        isDismissable={!creating}
        title="Tambah customer"
        description="Lengkapi identitas dan pilih satu atau beberapa layanan akademik."
        footer={
          <>
            <Button className="min-h-11 w-full font-semibold sm:w-auto" variant="flat" onPress={() => setOpenAdd(false)} isDisabled={creating}>
              Batal
            </Button>
            <Button
              className="min-h-11 w-full font-bold sm:w-auto"
              color="primary"
              form="create-customer-form"
              type="submit"
              isLoading={creating}
            >
              Simpan customer
            </Button>
          </>
        }
      >
        <CustomerForm formId="create-customer-form" hideActions onSubmit={onCreate} busy={creating} />
      </OperationalModal>
    </div>
  );
}
