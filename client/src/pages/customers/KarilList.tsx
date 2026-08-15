// client/src/pages/customers/KarilList.tsx
import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { showApiError } from "../../utils/alert";
import {
  listKaril,
  type KarilListParams,
  type KarilListResponse,
} from "../../services/karil.service";
import KarilFilters from "./components/KarilFilters";
import KarilTable, { KarilTableSkeleton } from "./components/KarilTable";
import { CircleCheckBig, Clock3, FileText, UsersRound } from "lucide-react";
import WorkspacePageHeader from "../../components/common/WorkspacePageHeader";

const contentGroupVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.14,
      staggerChildren: 0.1,
    },
  },
};

const contentItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
    filter: "blur(2px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.44,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function KarilList() {
  const reduceMotion = useReducedMotion();
  const [params, setParams] = useState<KarilListParams>({
    page: 1,
    limit: 10,
    sortBy: "updatedAt",
    sortDir: "desc",
    progress: "all",
    tugasBelum: "all",
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
      tugasBelum: "all",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalItems =
    data?.pagination?.total ??
    (data as any)?.items?.length ??
    0;
  const visibleItems = data?.items ?? [];
  const completedOnPage = visibleItems.filter((item) => item.totalTasks > 0 && item.doneTasks >= item.totalTasks).length;
  const pendingOnPage = Math.max(0, visibleItems.length - completedOnPage);

  return (
    <div data-workspace-page className="space-y-5 pb-8">
      <WorkspacePageHeader
        eyebrow="ARTECH • Layanan akademik"
        title="Karya Ilmiah"
        description="Pantau judul, identitas mahasiswa, dan penyelesaian empat tugas Karya Ilmiah secara terstruktur."
        icon={FileText}
        metrics={[
          { label: "Total data", value: `${totalItems} customer`, icon: UsersRound, tone: "violet" },
          { label: "Selesai di halaman", value: `${completedOnPage} customer`, icon: CircleCheckBig, tone: "emerald" },
          { label: "Dalam proses", value: `${pendingOnPage} customer`, icon: Clock3, tone: "amber" },
        ]}
      />

      <section className="overflow-hidden rounded-[24px] border border-default-200/80 bg-content1 shadow-[0_12px_35px_rgba(15,23,42,.06)]">
        <motion.div
          variants={contentGroupVariants}
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
        >
        <motion.div variants={contentItemVariants} className="border-b border-default-200/70 px-4 py-4 sm:px-6 sm:py-5">
          <KarilFilters
            label="KARIL"
            initial={params}
            onChange={(next) => {
              const merged = { ...params, ...next, page: next.page ?? 1 };
              setParams(merged);
              load(merged);
            }}
          />
        </motion.div>
        <motion.div variants={contentItemVariants} className="px-4 py-5 sm:px-6">
          {loading ? (
            <KarilTableSkeleton />
          ) : (
            <KarilTable
              label="KARIL"
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
        </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
