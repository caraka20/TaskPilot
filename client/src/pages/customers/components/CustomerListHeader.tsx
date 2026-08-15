import { Button } from "@heroui/react";
import {
  AlertTriangle,
  FileSpreadsheet,
  Layers3,
  Plus,
  UsersRound,
} from "lucide-react";

import WorkspacePageHeader from "../../../components/common/WorkspacePageHeader";
import CustomerMissingCoursePopover, {
  type CustomerWithoutCourse,
} from "./CustomerMissingCoursePopover";

type Props = {
  owner: boolean;
  exporting: boolean;
  loadingTotals: boolean;
  totalCustomers: number;
  totalWithoutCourse: number;
  totalPages: number;
  customersWithoutCourse: CustomerWithoutCourse[];
  onExportExcel: () => void | Promise<void>;
  onAddCustomer: () => void;
  onQuickSearch: (searchValue: string) => void | Promise<void>;
};

export default function CustomerListHeader({
  owner,
  exporting,
  loadingTotals,
  totalCustomers,
  totalWithoutCourse,
  totalPages,
  customersWithoutCourse,
  onExportExcel,
  onAddCustomer,
  onQuickSearch,
}: Props) {
  return (
    <WorkspacePageHeader
      eyebrow="ARTECH • Customer workspace"
      title="Customer"
      description="Kelola identitas, layanan akademik, pembayaran, dan progres customer dalam satu ruang kerja."
      icon={UsersRound}
      actions={
        <>
          <CustomerMissingCoursePopover
            loading={loadingTotals}
            customers={customersWithoutCourse}
            total={totalWithoutCourse}
            onSelect={onQuickSearch}
          />

          {owner && (
            <Button
              variant="bordered"
              className="min-h-11 shrink-0 border-white/20 bg-white/10 font-semibold text-white backdrop-blur transition hover:bg-white/15"
              startContent={
                !exporting ? <FileSpreadsheet className="h-4 w-4" /> : undefined
              }
              isLoading={exporting}
              isDisabled={exporting}
              onPress={() => void onExportExcel()}
            >
              {exporting ? "Membuat Excel…" : "Export Excel"}
            </Button>
          )}

          <Button
            className="min-h-11 shrink-0 bg-white font-bold text-slate-900 shadow-sm transition hover:bg-slate-50"
            startContent={<Plus className="h-4 w-4" />}
            onPress={onAddCustomer}
          >
            Tambah customer
          </Button>
        </>
      }
      metrics={[
        {
          label: "Total customer",
          value: loadingTotals ? "Memuat…" : `${totalCustomers} customer`,
          icon: UsersRound,
          tone: "cyan",
        },
        {
          label: "Perlu mata kuliah",
          value: loadingTotals ? "Memuat…" : `${totalWithoutCourse} customer`,
          icon: AlertTriangle,
          tone: "amber",
        },
        {
          label: "Halaman data",
          value: loadingTotals ? "Memuat…" : `${totalPages} halaman`,
          icon: Layers3,
          tone: "indigo",
        },
      ]}
    />
  );
}
