// client/src/pages/customers/CustomersList.tsx
import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader, CardBody } from "@heroui/react";
import Swal from "sweetalert2";

import CustomerFilters from "./components/CustomerFilters";
import CustomerTable from "./components/CustomerTable";
import CustomerForm from "./components/CustomerForm";

import { showApiError } from "../../utils/alert";
import {
  getCustomers,
  createCustomer,
  deleteCustomer,
} from "../../services/customer.service";

import type {
  CustomerListResponse,
  ListParams,
  CreateCustomerPayload,
  CustomerItem,
} from "../../utils/customer";

export default function CustomersList() {
  const [params, setParams] = useState<ListParams>({ page: 1, limit: 10 });
  const [data, setData] = useState<CustomerListResponse>();
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(
    async (p: ListParams = params) => {
      setLoading(true);
      try {
        const res = await getCustomers(p);
        setData(res);
      } catch (e) {
        await showApiError(e);
      } finally {
        setLoading(false);
      }
    },
    [params]
  );

  useEffect(() => {
    load({ page: 1, limit: 10 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreate = async (payload: CreateCustomerPayload) => {
    setCreating(true);
    try {
      await createCustomer(payload);
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Customer berhasil ditambahkan",
        timer: 1400,
        showConfirmButton: false,
      });
      const base = { page: 1, limit: 10 };
      setParams(base);
      await load(base);
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
      await Swal.fire({
        icon: "success",
        title: "Terhapus",
        timer: 1200,
        showConfirmButton: false,
      });
      await load(params);
    } catch (e) {
      await showApiError(e);
    }
  };

// CustomersList.tsx
const applyFilters = async (next: ListParams & { jenis?: any }) => {
  const merged: any = { ...params, ...next, page: 1 };

  // normalisasi q (kosong => hapus)
  if (!merged.q || !String(merged.q).trim()) delete merged.q;

  // mapping jenis -> CSV
  const resolveJenisCSV = (v?: string) => {
    const val = String(v ?? "").trim().toUpperCase();
    if (!val || val === "ALL") return undefined;      // ALL -> hapus filter
    if (val === "TK") return "TK";                    // TK -> hanya TK
    if (val === "TUTON") return "TUTON,TK";           // TUTON -> TUTON + TK
    if (val === "KARIL") return "KARIL,TK";           // KARIL -> KARIL + TK
    return val; // fallback
  };

  if ("jenis" in next) {
    const csv = resolveJenisCSV(next.jenis as any);
    if (csv) merged.jenis = csv as any;   // kirim sebagai string CSV
    else delete merged.jenis;
  }

  setParams(merged);
  await load(merged);
};

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="font-semibold">Tambah Customer</CardHeader>
        <CardBody>
          <CustomerForm onSubmit={onCreate} busy={creating} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="font-semibold">Daftar Customer</div>
          <CustomerFilters
            initial={params as any}
            onChange={(next) => applyFilters(next as any)}
          />
        </CardHeader>
        <CardBody>
        <CustomerTable
            data={data}
            loading={loading}
            page={params.page ?? 1}
            onPageChange={(p) => {
            const np = { ...params, page: p };
            setParams(np);
            load(np);
            }}
            onDelete={onDeleteRow}
            manageAccess={true}   // <-- penting: USER dapat akses yang sama dengan OWNER
        />
        </CardBody>
      </Card>
    </div>
  );
}
