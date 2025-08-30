import { useEffect, useMemo, useState } from "react";
import {
  Card, CardHeader, CardBody, Input, Button, Tooltip, Chip, Progress
} from "@heroui/react";
import { BookOpen, Plus, Trash2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import {
  addCourse, deleteCourse, getCourseSummary,
  type TutonCourseResponse, type CourseSummaryResponse
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

  // fetch summary-by-course untuk progress akurat (optional, aman tanpa error)
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
          // abaikan
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
    <Card className="mt-5 rounded-2xl border border-slate-200 shadow-md overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-indigo-500 to-fuchsia-500" />
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-slate-500" />
          <div className="text-[16px] font-semibold tracking-tight text-slate-900">TUTON — Courses</div>
          <Chip size="sm" variant="flat" className="ml-1 bg-slate-50 border border-slate-200">
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
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
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
                    "group rounded-2xl border bg-white p-4 transition-all",
                    "border-slate-200 hover:shadow-lg hover:border-slate-300",
                    isDone ? "ring-1 ring-emerald-200" : "",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[15px] font-medium text-slate-900">{c.matkul}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {(sum?.completedItems ?? c.completedItems)}/{(sum?.totalItems ?? c.totalItems)} selesai
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDone && (
                        <Chip
                          size="sm"
                          variant="flat"
                          className="bg-emerald-50 text-emerald-700 border border-emerald-200"
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
                          className="bg-slate-50"
                        >
                          Kelola
                        </Button>
                      </Tooltip>
                      <Tooltip content="Hapus matkul">
                        <Button
                          size="sm"
                          isIconOnly
                          variant="flat"
                          className="bg-rose-50 text-rose-600"
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
                    <Chip size="sm" variant="flat" className="bg-slate-50">{pct}%</Chip>
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
