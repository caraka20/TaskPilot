"use client";

import { useEffect, useState } from "react";
import { BookOpenCheck, Check } from "lucide-react";
import { api } from "@attendance/lib/api";
import { formatDate, todayInput } from "@attendance/lib/format";
import type { TaskOccurrence } from "@attendance/types/api";
import { Badge } from "@attendance/components/ui/badge";
import { Card, CardContent } from "@attendance/components/ui/card";
import { Alert, EmptyState, LoadingState } from "@attendance/components/ui/feedback";
import { DateField } from "@attendance/components/ui/form";
import { PageHeader } from "@attendance/components/ui/page";

export function EmployeeTasksPage() {
  const [date, setDate] = useState(todayInput());
  const [tasks, setTasks] = useState<TaskOccurrence[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api<{ tasks: TaskOccurrence[] }>(`/tasks/me?date=${date}`)
      .then((result) => {
        if (active) setTasks(result.tasks);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Tugas gagal dimuat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [date]);

  async function toggle(task: TaskOccurrence) {
    try {
      const result = await api<{ task: TaskOccurrence }>(`/tasks/${task.id}/complete`, {
        method: "PATCH",
        body: JSON.stringify({ completed: task.status !== "COMPLETED" }),
      });
      setTasks((current) => current.map((item) => item.id === task.id ? result.task : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Status gagal diubah.");
    }
  }

  return (
    <div className="attendance-stagger space-y-6 text-slate-800 dark:text-slate-100">
      <PageHeader
        title="Tugas saya"
        description="Setiap tanggal memiliki riwayat tugas sendiri dan tugas yang belum selesai tidak dibawa ke hari berikutnya."
        action={(
          <div className="min-w-64">
            <DateField
              label="Tanggal tugas"
              max={todayInput()}
              onChange={(event) => setDate(event.target.value)}
              value={date}
            />
          </div>
        )}
      />

      {error ? <Alert>{error}</Alert> : null}

      {loading ? (
        <LoadingState label="Menyiapkan tugas pada tanggal ini..." />
      ) : tasks.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {tasks.map((task) => (
            <button className="text-left" key={task.id} onClick={() => void toggle(task)} type="button">
              <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex gap-4">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${task.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
                    {task.status === "COMPLETED" ? <Check /> : <BookOpenCheck />}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-extrabold text-slate-900">{task.schedule.template.title}</p>
                      <Badge tone={task.status === "COMPLETED" ? "green" : "amber"}>
                        {task.status === "COMPLETED" ? "Selesai" : "Belum selesai"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs leading-6 text-slate-500">
                      {task.schedule.template.description || "Tidak ada instruksi tambahan."}
                    </p>
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {formatDate(task.taskDate)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState title="Tidak ada tugas" description="Belum ada tugas yang dipetakan untuk tanggal ini." />
        </Card>
      )}
    </div>
  );
}
