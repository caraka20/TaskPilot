import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, BellRing, CheckCircle2, Circle, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../../hooks/useApi";

type OwnerNote = {
  id: string;
  title?: string | null;
  message: string;
  updatedAt?: string;
};

type UserTask = {
  id: string;
  status: "OPEN" | "COMPLETED";
  taskDate: string;
  schedule: {
    template: { title: string; description?: string | null };
  };
};

function todayInput() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function OwnerNotesPopover({ collapsed }: { collapsed: boolean }) {
  const api = useApi();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<OwnerNote[]>([]);
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      api.get("/api/attendance/notes/me"),
      api.get(`/api/attendance/tasks/me?date=${todayInput()}`),
    ])
      .then(([notesResponse, tasksResponse]) => {
        if (!active) return;
        setNotes(Array.isArray(notesResponse.data?.notes) ? notesResponse.data.notes : []);
        setTasks(Array.isArray(tasksResponse.data?.tasks) ? tasksResponse.data.tasks : []);
      })
      .catch(() => {
        // Catatan bersifat pelengkap. Kegagalan memuat tidak boleh memblokir navigasi.
      });

    return () => { active = false; };
  }, [api]);

  async function toggleTask(task: UserTask) {
    try {
      const { data } = await api.patch(`/api/attendance/tasks/${task.id}/complete`, {
        completed: task.status !== "COMPLETED",
      });
      const updated = data?.task as UserTask | undefined;
      if (updated) {
        setTasks((current) => current.map((item) => item.id === updated.id ? updated : item));
      }
    } catch {
      // Panel ringkas tidak menutup atau menghilangkan data jika update gagal.
    }
  }

  const cancelClose = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const panelWidth = Math.min(390, Math.max(280, window.innerWidth - 32));
    const estimatedHeight = Math.min(440, window.innerHeight - 24);
    const preferredLeft = rect.right + 12;
    const left = preferredLeft + panelWidth <= window.innerWidth - 12
      ? preferredLeft
      : Math.max(12, rect.left - panelWidth - 12);
    const top = Math.max(12, Math.min(rect.top, window.innerHeight - estimatedHeight - 12));
    setPosition({ left, top });
  };

  const showPanel = () => {
    cancelClose();
    updatePosition();
    setOpen(true);
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 180);
  };

  useEffect(() => {
    if (!open) return;
    const reposition = () => updatePosition();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false);
    };

    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, [open]);

  useEffect(() => () => cancelClose(), []);

  if (!notes.length && !tasks.length) return null;

  const pendingTasks = tasks.filter((task) => task.status !== "COMPLETED").length;
  const notificationCount = notes.length + pendingTasks;

  return (
    <div
      ref={triggerRef}
      className="relative mb-3"
      onMouseEnter={showPanel}
      onMouseLeave={scheduleClose}
      onFocus={showPanel}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) scheduleClose();
      }}
    >
      <button
        type="button"
        aria-label={`${notes.length} catatan owner dan ${pendingTasks} tugas belum selesai`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (open) setOpen(false);
          else showPanel();
        }}
        className={[
          "relative flex w-full items-center rounded-2xl border border-amber-300/80 bg-amber-50 text-left text-amber-950",
          "shadow-[0_10px_28px_rgba(180,83,9,.10)] transition hover:border-amber-400 hover:bg-amber-100/80",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100 dark:hover:bg-amber-400/15",
          collapsed ? "h-12 justify-center" : "gap-3 px-3 py-2.5",
        ].join(" ")}
      >
        <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-400 text-amber-950 shadow-sm dark:bg-amber-300">
          <BellRing className="h-[18px] w-[18px]" />
          <span className="absolute -right-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[9px] font-black text-white ring-2 ring-amber-50 dark:ring-[#0b1b2b]">
            {notificationCount > 9 ? "9+" : notificationCount}
          </span>
        </span>

        {!collapsed ? (
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-black uppercase tracking-[.13em] text-amber-700 dark:text-amber-300">Catatan & tugas</span>
            <span className="mt-0.5 block truncate text-xs font-extrabold">
              {pendingTasks ? `${pendingTasks} tugas perlu diselesaikan` : notes[0]?.title || "Informasi pekerjaan"}
            </span>
          </span>
        ) : null}
      </button>

      {open && typeof document !== "undefined" ? createPortal(
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Catatan owner dan tugas hari ini"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          style={{ left: position.left, top: position.top }}
          className="fixed z-[9999] w-[min(390px,calc(100vw-2rem))] rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_28px_90px_rgba(15,23,42,.28)] ring-1 ring-slate-950/5 dark:border-slate-700 dark:bg-[#102438] dark:ring-white/5"
        >
        <div className="max-h-[min(430px,60vh)] space-y-3 overflow-y-auto pr-1">
          {notes.length ? (
            <section aria-label="Pesan owner">
              <p className="mb-2 flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-[.15em] text-slate-400">
                <BellRing className="h-3.5 w-3.5" /> Pesan owner
              </p>
              <div className="space-y-2">
                {notes.map((note) => (
                  <article className="rounded-2xl bg-slate-50 p-3.5 dark:bg-white/[.055]" key={note.id}>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">{note.title || "Informasi pekerjaan"}</h3>
                    <p className="mt-1.5 whitespace-pre-wrap text-xs leading-5 text-slate-600 dark:text-slate-300">{note.message}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {tasks.length ? (
            <section aria-label="Tugas hari ini">
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.15em] text-slate-400">
                  <ClipboardList className="h-3.5 w-3.5" /> Tugas hari ini
                </p>
                <span className="text-[10px] font-bold text-slate-400">{tasks.length - pendingTasks}/{tasks.length} selesai</span>
              </div>
              <div className="space-y-2">
                {tasks.map((task) => {
                  const completed = task.status === "COMPLETED";
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => void toggleTask(task)}
                      className="flex w-full items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 text-left transition hover:border-sky-300 hover:bg-sky-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-white/[.035] dark:hover:border-sky-500/40 dark:hover:bg-sky-400/5"
                    >
                      {completed
                        ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                        : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-sky-600 dark:text-sky-300" />}
                      <span className="min-w-0">
                        <span className={`block text-xs font-black ${completed ? "text-slate-400 line-through" : "text-slate-800 dark:text-white"}`}>
                          {task.schedule.template.title}
                        </span>
                        {task.schedule.template.description ? (
                          <span className="mt-1 block line-clamp-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                            {task.schedule.template.description}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => navigate("/attendance?view=tasks")}
          className="mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#163d63] px-3 text-xs font-extrabold text-white transition hover:bg-[#1d4f7d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          Buka detail tugas <ArrowRight className="h-4 w-4" />
        </button>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
