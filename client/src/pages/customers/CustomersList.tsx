// client/src/pages/customers/CustomersList.tsx
import { useCallback, useEffect, useState } from "react";
import {
  Card, CardHeader, CardBody,
  Button,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter
} from "@heroui/react";
import { Plus } from "lucide-react";
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

export default function CustomersList() {
  const [params, setParams] = useState<ListParams>({ page: 1, limit: 10 });
  const [data, setData] = useState<CustomerListResponse>();
  const [loading, setLoading] = useState(false);

  const [creating, setCreating] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const parseIntParam = (v: string | null, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

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

  // init dari URL
  useEffect(() => {
    const fromUrl: ListParams & { jenis?: string } = {
      page: parseIntParam(searchParams.get("page"), 1),
      limit: parseIntParam(searchParams.get("limit"), 10),
    };
    const q = searchParams.get("q") || undefined;
    const jenis = searchParams.get("jenis") || undefined;
    if (q) (fromUrl as any).q = q;
    if (jenis) (fromUrl as any).jenis = jenis;

    setParams(fromUrl);
    load(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync params -> URL
  useEffect(() => {
    const sp: Record<string, string> = {
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
    };
    if ((params as any).q) sp.q = String((params as any).q);
    if ((params as any).jenis) sp.jenis = String((params as any).jenis);
    setSearchParams(sp, { replace: true });
  }, [params, setSearchParams]);

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

  const applyFilters = async (next: ListParams & { jenis?: any }) => {
    const merged: any = { ...params, ...next, page: 1 };
    if (!merged.q || !String(merged.q).trim()) delete merged.q;

    const resolveJenisCSV = (v?: string) => {
      const val = String(v ?? "").trim().toUpperCase();
      if (!val || val === "ALL") return undefined;
      if (val === "TK") return "TK";
      if (val === "TUTON") return "TUTON,TK";
      if (val === "KARIL") return "KARIL,TK";
      return val;
    };
    if ("jenis" in next) {
      const csv = resolveJenisCSV(next.jenis as any);
      if (csv) merged.jenis = csv as any; else delete merged.jenis;
    }

    setParams(merged);
    await load(merged);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="font-semibold text-lg">Daftar Customer</div>
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
          />
        </CardBody>
      </Card>

      {/* Modal Tambah Customer (tetap) */}
      <Modal
        isOpen={openAdd}
        onOpenChange={setOpenAdd}
        size="2xl"
        placement="center"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Tambah Customer</ModalHeader>
              <ModalBody>
                <CustomerForm onSubmit={onCreate} busy={creating} />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={() => onClose()}>
                  Batal
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
