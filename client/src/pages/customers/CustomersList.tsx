// client/src/pages/customers/CustomersList.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card, CardHeader, CardBody,
  Button, Chip,
  Modal, ModalBody, ModalContent, ModalFooter, ModalHeader,
  Popover, PopoverTrigger, PopoverContent, Kbd
} from "@heroui/react";
import { Plus, Wallet, CheckCircle2, PiggyBank } from "lucide-react";
import Swal from "sweetalert2";
import { useSearchParams } from "react-router-dom";

import CustomerFilters from "./components/CustomerFilters";
import CustomerTable from "./components/CustomerTable";
import CustomerForm from "./components/CustomerForm";

import { showApiError } from "../../utils/alert";
import { getCustomers, createCustomer, deleteCustomer } from "../../services/customer.service";

import type {
  CustomerListResponse,
  ListParams,
  CreateCustomerPayload,
  CustomerItem,
} from "../../utils/customer";

/* ================= Helpers ================= */
const isValidJenis = (v?: string | null): v is "TUTON" | "KARIL" | "TK" => {
  const up = String(v ?? "").toUpperCase();
  return up === "TUTON" || up === "KARIL" || up === "TK";
};

const fmtIDR = (n = 0) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

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

  // ringkasan global
  const [loadingTotals, setLoadingTotals] = useState(false);
  const [totalsAll, setTotalsAll] = useState<{ totalBayar: number; sudahBayar: number; sisaBayar: number; totalCount: number }>({
    totalBayar: 0, sudahBayar: 0, sisaBayar: 0, totalCount: 0
  });
  const [countNoMKAll, setCountNoMKAll] = useState(0);
  const [totalPagesAll, setTotalPagesAll] = useState(1);
  const [namesNoMKAll, setNamesNoMKAll] = useState<Array<{ id: number; namaCustomer: string; nim: string }>>([]);

  const [searchParams, setSearchParams] = useSearchParams();
  const parseIntParam = (v: string | null, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const owner = useMemo(() => isOwner(), []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params]
  );

  // init dari URL (fallback limit -> 50 untuk semua)
  useEffect(() => {
    const fromUrl: ListParams & { jenis?: "TUTON" | "KARIL" | "TK" } = {
      page: parseIntParam(searchParams.get("page"), 1),
      limit: parseIntParam(searchParams.get("limit"), 50),
      sortBy: (searchParams.get("sortBy") as any) || "createdAt",
      sortDir: (searchParams.get("sortDir") as any) || "desc",
    };
    const q = searchParams.get("q") || undefined;
    const jenis = searchParams.get("jenis");

    if (q) (fromUrl as any).q = q;
    if (isValidJenis(jenis)) fromUrl.jenis = jenis as any;

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
    if ((params as any).jenis && isValidJenis((params as any).jenis)) {
      sp.jenis = String((params as any).jenis);
    }
    setSearchParams(sp, { replace: true });
  }, [params, setSearchParams]);

  // CRUD handlers
  const onCreate = async (payload: CreateCustomerPayload) => {
    setCreating(true);
    try {
      await createCustomer(payload);
      await Swal.fire({ icon: "success", title: "Berhasil", text: "Customer berhasil ditambahkan", timer: 1400, showConfirmButton: false });
      const base = clampByRole({ ...params, page: 1 });
      setParams(base);
      await load(base);
      await loadTotals(base);
      setOpenAdd(false);
    } catch (e) {
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

  const applyFilters = async (next: ListParams & { jenis?: any }) => {
    const merged: any = { ...params, ...next, page: 1 };
    if (!merged.q || !String(merged.q).trim()) delete merged.q;

    if ("jenis" in next) {
      const j = String(next.jenis ?? "").toUpperCase();
      if (j === "ALL" || !isValidJenis(j)) delete merged.jenis;
      else merged.jenis = j;
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

  /* ============ Small UI helpers ============ */
  const MoneyCard = ({
    title,
    value,
    icon,
    accentFrom = "from-sky-500",
    accentTo = "to-indigo-500",
    valueClass = "",
  }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    accentFrom?: string;
    accentTo?: string;
    valueClass?: string;
  }) => (
    <div className="group relative rounded-2xl p-[1px] bg-gradient-to-br from-default-200/40 to-default-100/20">
      <div className="rounded-2xl h-full w-full bg-content2 p-4">
        <div className="flex items-start gap-3">
          <div className={`rounded-xl p-2 bg-gradient-to-br ${accentFrom} ${accentTo} text-white shadow-sm`}>
            {icon}
          </div>
          <div className="flex-1">
            <div className="text-[12px] uppercase tracking-wide text-foreground-500">{title}</div>
            <div className={`text-xl font-semibold mt-1 ${valueClass}`}>{value}</div>
          </div>
        </div>
        <div className={`absolute -z-10 inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-gradient-to-r ${accentFrom} ${accentTo}`} />
      </div>
    </div>
  );

  /* ================= Render ================= */
  return (
    <div className="flex flex-col gap-4">
      {/* ======= OWNER-ONLY: Ringkasan lengkap ======= */}
      {owner ? (
        <Card className="border border-default-200 shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500" />
          <CardHeader className="flex flex-col gap-2 bg-content1 rounded-t-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-semibold text-lg">Ringkasan semua customer (sesuai filter)</div>
              <Chip size="sm" variant="flat" className="h-6 px-2">
                {loadingTotals ? "..." : `${totalsAll.totalCount} customer`}
              </Chip>
              <Popover placement="bottom-start">
                <PopoverTrigger>
                  <Chip as="button" size="sm" color="warning" variant="flat" className="h-6 px-2 cursor-pointer">
                    {loadingTotals ? "..." : `${countNoMKAll} tanpa matkul`}
                  </Chip>
                </PopoverTrigger>
                <PopoverContent className="max-w-[480px]">
                  <div className="p-2">
                    <div className="text-[12px] font-medium mb-1">Tanpa matkul (maks. 50 nama)</div>
                    {namesNoMKAll.length === 0 ? (
                      <div className="text-[12px] text-foreground-500">Tidak ada.</div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {namesNoMKAll.map((p) => (
                          <Chip
                            key={p.id}
                            as="button"
                            color="danger"
                            variant="flat"
                            className="h-6 px-2 text-[12px] hover:opacity-90 font-medium"
                            onClick={() => quickSearch(p.nim || p.namaCustomer)}
                          >
                            <span className="text-danger-600">{p.namaCustomer}</span>
                            <span className="text-danger-500 ml-1">({p.nim})</span>
                          </Chip>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 text-[11px] text-foreground-500">
                      Klik nama untuk <b>cari cepat</b>. Tip: <Kbd>Esc</Kbd> untuk menutup.
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Chip size="sm" variant="flat" className="h-6 px-2">
                {loadingTotals ? "..." : `Total halaman: ${totalPagesAll}`}
              </Chip>
            </div>
          </CardHeader>

          {/* === Money summary prettier === */}
          <CardBody className="bg-content1 rounded-b-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MoneyCard
                title="Total Tagihan (semua)"
                value={loadingTotals ? "…" : fmtIDR(totalsAll.totalBayar)}
                icon={<Wallet className="h-5 w-5" />}
                accentFrom="from-violet-500"
                accentTo="to-fuchsia-500"
              />
              <MoneyCard
                title="Sudah Dibayar (semua)"
                value={loadingTotals ? "…" : fmtIDR(totalsAll.sudahBayar)}
                icon={<CheckCircle2 className="h-5 w-5" />}
                accentFrom="from-emerald-500"
                accentTo="to-teal-500"
              />
              <MoneyCard
                title="Sisa (semua)"
                value={loadingTotals ? "…" : fmtIDR(totalsAll.sisaBayar)}
                icon={<PiggyBank className="h-5 w-5" />}
                accentFrom="from-sky-500"
                accentTo="to-indigo-500"
                valueClass={totalsAll.sisaBayar > 0 ? "" : "text-success-600"}
              />
            </div>
          </CardBody>
        </Card>
      ) : (
        // ======= NON-OWNER: Ringkasan ringan (tanpa metrik uang) =======
        <Card className="border border-default-200 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-wrap items-center gap-2 py-2">
            <Chip size="sm" variant="flat" className="h-6 px-2">
              {loadingTotals ? "..." : `${totalsAll.totalCount} customer`}
            </Chip>
            <Popover placement="bottom-start">
              <PopoverTrigger>
                <Chip as="button" size="sm" color="warning" variant="flat" className="h-6 px-2 cursor-pointer">
                  {loadingTotals ? "..." : `${countNoMKAll} tanpa matkul`}
                </Chip>
              </PopoverTrigger>
              <PopoverContent className="max-w-[480px]">
                <div className="p-2">
                  <div className="text-[12px] font-medium mb-1">Tanpa matkul (maks. 50 nama)</div>
                  {namesNoMKAll.length === 0 ? (
                    <div className="text-[12px] text-foreground-500">Tidak ada.</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {namesNoMKAll.map((p) => (
                        <Chip
                          key={p.id}
                          as="button"
                          color="danger"
                          variant="flat"
                          className="h-6 px-2 text-[12px] hover:opacity-90 font-medium"
                          onClick={() => quickSearch(p.nim || p.namaCustomer)}
                        >
                          <span className="text-danger-600">{p.namaCustomer}</span>
                          <span className="text-danger-500 ml-1">({p.nim})</span>
                        </Chip>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Chip size="sm" variant="flat" className="h-6 px-2">
              {loadingTotals ? "..." : `Total halaman: ${totalPagesAll}`}
            </Chip>
          </CardHeader>
        </Card>
      )}

      {/* ======= LIST + CONTROLS ======= */}
      <Card id="customers-list-card" className="border border-default-100 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500" />
        <CardHeader className="flex flex-col gap-3 bg-content1 rounded-t-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="font-semibold text-lg">Daftar Customer</div>

            <div className="flex items-center gap-2">
              <Chip size="sm" variant="flat" className="h-6 px-2">
                {data?.pagination?.total ?? 0} total
              </Chip>
              <Chip size="sm" variant="flat" className="h-6 px-2">
                Halaman {data?.pagination?.page ?? 1} / {data?.pagination?.totalPages ?? 1}
              </Chip>
            </div>

            <div className="flex-1" />

            <Button
              color="primary"
              className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white"
              startContent={<Plus className="h-4 w-4" />}
              onPress={() => setOpenAdd(true)}
            >
              Tambah Customer
            </Button>
          </div>

          <CustomerFilters
            initial={{
              ...params,
              jenis: isValidJenis((params as any).jenis) ? ((params as any).jenis as any) : "ALL",
            }}
            onChange={(next) => applyFilters(next as any)}
          />
        </CardHeader>

        <CardBody className="bg-content1 rounded-b-2xl">
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
        </CardBody>
      </Card>

      {/* Modal Tambah Customer */}
      <Modal isOpen={openAdd} onOpenChange={setOpenAdd} size="2xl" placement="center" backdrop="blur">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Tambah Customer</ModalHeader>
              <ModalBody>
                <CustomerForm onSubmit={onCreate} busy={creating} />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={() => onClose()}>Batal</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
