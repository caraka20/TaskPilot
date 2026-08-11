// client/src/pages/customers/KarilList.tsx
import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader, CardBody, Chip } from "@heroui/react";
import { showApiError } from "../../utils/alert";
import {
  listKaril,
  type KarilListParams,
  type KarilListResponse,
} from "../../services/karil.service";
import KarilFilters from "./components/KarilFilters";
import KarilTable, { KarilTableSkeleton } from "./components/KarilTable";
import BackButton from "../../components/common/BackButton";
import { ListChecks } from "lucide-react";

export default function KarilList() {
  const [params, setParams] = useState<KarilListParams>({
    page: 1,
    limit: 10,
    sortBy: "updatedAt",
    sortDir: "desc",
    progress: "all",
  });
  const [data, setData] = useState<KarilListResponse>();
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (p: KarilListParams = params) => {
      setLoading(true);
      try {
        const res = await listKaril(p);
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
    load({
      page: 1,
      limit: 10,
      sortBy: "updatedAt",
      sortDir: "desc",
      progress: "all",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalItems =
    data?.pagination?.total ??
    (data as any)?.items?.length ??
    0;

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-2xl border border-default-200 shadow-md overflow-hidden bg-content1">
        <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-indigo-500 to-fuchsia-500" />

        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-4 sm:px-6 bg-gradient-to-r from-content2 to-content1">
          {/* Kiri: Back + judul */}
          <div className="flex items-center gap-4">
            <BackButton variant="flat" tone="sky" tooltip="Kembali" />

            <div className="flex items-center gap-3">
              <span className="h-9 w-[3px] rounded-full bg-gradient-to-b from-sky-400 to-indigo-500 shadow-[0_0_0_1px_rgba(0,0,0,0.05)]" />
              <div className="flex flex-col">
                <div className="text-[17px] sm:text-lg font-semibold tracking-tight text-foreground">
                  Daftar KARIL / TK
                </div>
                <div className="text-[13px] sm:text-sm text-foreground-500">
                  Pantau progres & kelengkapan tugas untuk peserta KARIL dan TK.
                </div>
              </div>
            </div>
          </div>

          {/* Kanan: ringkas info */}
          <div className="flex items-center gap-2">
            <Chip
              size="sm"
              variant="flat"
              className="bg-content1 text-foreground border border-default-200 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
              startContent={<ListChecks className="h-3.5 w-3.5" />}
            >
              Total: <span className="ml-1 font-medium">{totalItems}</span>
            </Chip>
          </div>
        </CardHeader>

        <CardBody className="flex flex-col gap-4 p-4 sm:p-6">
          <KarilFilters
            initial={params}
            onChange={(next) => {
              const merged = { ...params, ...next, page: next.page ?? 1 };
              setParams(merged);
              load(merged);
            }}
          />

          {loading ? (
            <KarilTableSkeleton />
          ) : (
            <KarilTable
              data={data}
              loading={loading}
              page={params.page ?? 1}
              onPageChange={(p) => {
                const np = { ...params, page: p };
                setParams(np);
                load(np);
              }}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
