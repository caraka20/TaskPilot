// client/src/pages/customers/components/TutonCoursesSection.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Card, CardHeader, CardBody, Input, Button, Tooltip, Chip, Progress,
} from "@heroui/react";
import { BookOpen, Plus, Trash2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import {
  addCourse, deleteCourse, getCourseSummary,
  type TutonCourseResponse, type CourseSummaryResponse,
} from "../../../services/tuton.service";
import { showApiError, showLoading, closeAlert, showSuccess } from "../../../utils/alert";
import Swal from "sweetalert2";

type MinimalCourse = {
  id?: number;
  courseId?: number;
  matkul?: string;
  totalItems?: number;
  completedItems?: number;
};

type Props = {
  customerId: number;
  courses?: MinimalCourse[] | TutonCourseResponse[];
  onChanged?: () => void;
};

export default function TutonCoursesSection({ customerId, courses = [], onChanged }: Props) {
  const [matkul, setMatkul] = useState("");
  const [busyAdd, setBusyAdd] = useState(false);
  const [busyDelete, setBusyDelete] = useState<number | null>(null);
  const [summaries, setSummaries] = useState<Record<number, CourseSummaryResponse | undefined>>({});

  const normalized = useMemo(() => {
    return (Array.isArray(courses) ? courses : [])
      .map((c) => {
        const id = (c as any).courseId ?? (c as any).id;
        return {
          id,
          matkul: (c as any).matkul ?? "-",
          totalItems: Number((c as any).totalItems ?? 0),
          completedItems: Number((c as any).completedItems ?? 0),
        };
      })
      .filter((c) => !!c.id) as Array<{ id: number; matkul: string; totalItems: number; completedItems: number }>;
  }, [courses]);

  // fetch ringkas per matkul (opsional)
  useEffect(() => {
    let alive = true;
    (async () => {
      const next: Record<number, CourseSummaryResponse> = {};
      for (const c of normalized) {
        try {
          const sum = await getCourseSummary(c.id);
          if (!alive) return;
          next[c.id] = sum;
        } catch {
          /* ignore */
        }
      }
      if (alive) setSummaries(next);
    })();
    return () => { alive = false; };
  }, [normalized]);

  const onAdd = async () => {
    const name = matkul.trim();
    if (!name) return;
    setBusyAdd(true);
    showLoading("Menambahkan matkul…");
    try {
      await addCourse(customerId, { matkul: name, generateItems: true });
      closeAlert();
      await showSuccess("Matkul ditambahkan");
      setMatkul("");
      onChanged?.();
    } catch (e) {
      closeAlert();
      await showApiError(e);
    } finally {
      setBusyAdd(false);
    }
  };

  const onDeleteCourse = async (courseId: number) => {
    const ask = await Swal.fire({
      icon: "warning",
      title: "Hapus matkul?",
      text: "Semua item di matkul ini juga akan terhapus.",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
    });
    if (!ask.isConfirmed) return;

    setBusyDelete(courseId);
    showLoading("Menghapus matkul…");
    try {
      await deleteCourse(courseId);
      closeAlert();
      await showSuccess("Matkul dihapus");
      onChanged?.();
    } catch (e) {
      closeAlert();
      await showApiError(e);
    } finally {
      setBusyDelete(null);
    }
  };

  return (
    <Card className="mt-5 rounded-2xl border border-default-200 bg-content1 shadow-md overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-indigo-500 to-fuchsia-500" />

      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-foreground-500" />
          <div className="text-[16px] font-semibold tracking-tight text-foreground">
            TUTON — Courses
          </div>
          <Chip
            size="sm"
            variant="flat"
            className="ml-1 bg-content2 text-foreground ring-1 ring-default-200"
          >
            {normalized.length} matkul
          </Chip>
        </div>

        <div className="flex gap-2">
          <Input
            size="sm"
            label="Tambah Matkul"
            placeholder="mis. Ekonomi Mikro"
            value={matkul}
            onValueChange={setMatkul}
            onKeyDown={(e) => e.key === "Enter" && onAdd()}
            variant="bordered"
            className="w-[240px]"
          />
          <Button
            size="sm"
            startContent={<Plus className="h-4 w-4" />}
            className="text-white bg-gradient-to-r from-sky-500 to-indigo-500 shadow-sm"
            isLoading={busyAdd}
            onPress={onAdd}
          >
            Tambah
          </Button>
        </div>
      </CardHeader>

      <CardBody className="pb-6">
        {normalized.length === 0 ? (
          <div className="rounded-xl border border-dashed border-default-200 bg-content2 p-6 text-sm text-foreground-500">
            Belum ada matkul. Tambahkan di atas.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {normalized.map((c) => {
              const sum = summaries[c.id];
              const pct = sum?.progress ?? (c.totalItems ? Math.round((c.completedItems / c.totalItems) * 100) : 0);
              const isDone = pct >= 100;

              return (
                <div
                  key={c.id}
                  className={[
                    "group rounded-2xl border p-4 transition-all",
                    "border-default-200 bg-content1 hover:bg-content2 hover:shadow-lg",
                    isDone ? "ring-1 ring-emerald-400/40 dark:ring-emerald-500/30" : "",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[15px] font-medium text-foreground">{c.matkul}</div>
                      <div className="mt-1 text-xs text-foreground-500">
                        {(sum?.completedItems ?? c.completedItems)}/{(sum?.totalItems ?? c.totalItems)} selesai
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDone && (
                        <Chip
                          size="sm"
                          variant="flat"
                          className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-400/30"
                          startContent={<Sparkles className="h-3.5 w-3.5" />}
                        >
                          100%
                        </Chip>
                      )}
                      <Tooltip content="Kelola items">
                        <Button
                          as={Link}
                          to={`/tuton-courses/${c.id}`}
                          size="sm"
                          variant="flat"
                          className="bg-default-100 text-foreground-700 hover:opacity-90 dark:bg-content2 dark:text-foreground"
                        >
                          Kelola
                        </Button>
                      </Tooltip>
                      <Tooltip content="Hapus matkul">
                        <Button
                          size="sm"
                          isIconOnly
                          variant="flat"
                          className="bg-rose-50 text-rose-600 hover:opacity-90 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-1 dark:ring-rose-400/30"
                          onPress={() => onDeleteCourse(c.id)}
                          isLoading={busyDelete === c.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <Progress aria-label="progress" value={pct} className="w-full" />
                    <Chip size="sm" variant="flat" className="bg-content2 text-foreground ring-1 ring-default-200">
                      {pct}%
                    </Chip>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
