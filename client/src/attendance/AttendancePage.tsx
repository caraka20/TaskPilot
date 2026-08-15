import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Boxes,
  CalendarDays,
  Clock3,
  ClipboardCheck,
  ClipboardList,
  FileClock,
  LayoutDashboard,
  NotebookText,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuthStore } from "../store/auth.store";
import { useUIStore } from "../store/ui.store";
import WorkspacePageHeader from "../components/common/WorkspacePageHeader";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ApprovalsPage } from "./features/admin/approvals-page";
import { AuditPage } from "./features/admin/audit-page";
import { NotesPage } from "./features/admin/notes-page";
import { AdminOverviewPage, type DashboardView } from "./features/admin/overview-page";
import { PayrollPage } from "./features/admin/payroll-page";
import { ProductsPage } from "./features/admin/products-page";
import { TasksPage } from "./features/admin/tasks-page";
import { CalendarPage } from "./features/calendar/calendar-page";
import { EarningsPage } from "./features/employee/earnings-page";
import { HistoryPage } from "./features/employee/history-page";
import { EmployeeTasksPage } from "./features/employee/tasks-page";
import { EmployeeTodayPage } from "./features/employee/today-page";
import { FeedbackProvider } from "./components/ui/feedback-provider";
import { api } from "./lib/api";

type EmployeeView = "today" | "calendar" | "tasks" | "earnings" | "history";
type AttendanceView = DashboardView | EmployeeView;

const ownerItems = [
  { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
  { id: "approvals", label: "Persetujuan", icon: ClipboardCheck },
  { id: "calendar", label: "Kalender", icon: CalendarDays },
  { id: "products", label: "Produk", icon: Boxes },
  { id: "tasks", label: "Tugas", icon: ClipboardList },
  { id: "notes", label: "Catatan", icon: NotebookText },
  { id: "payroll", label: "Payroll", icon: Banknote },
  { id: "audit", label: "Audit", icon: ShieldCheck },
] as const;

const employeeItems = [
  { id: "today", label: "Hari ini", icon: FileClock },
  { id: "calendar", label: "Kalender", icon: CalendarDays },
  { id: "tasks", label: "Tugas", icon: ClipboardList },
  { id: "earnings", label: "Pendapatan", icon: Banknote },
  { id: "history", label: "Riwayat", icon: FileClock },
] as const;

export default function AttendancePage() {
  const { role, username } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const owner = role === "OWNER";
  const items = owner ? ownerItems : employeeItems;
  const [view, setView] = useState<AttendanceView>(owner ? "overview" : "today");
  const { pendingApprovals, setPendingApprovals } = useUIStore();

  useEffect(() => {
    const requested = searchParams.get("view");
    if (!requested) return;

    // Tautan lama menuju tab Pekerja langsung dialihkan ke halaman Users terpadu.
    if (requested === "users") {
      navigate("/users", { replace: true });
      return;
    }

    // Tautan lama menuju tab Akun tetap berfungsi melalui halaman akun mandiri.
    if (requested === "account") {
      navigate("/account", { replace: true });
      return;
    }

    const allowed = items.some((item) => item.id === requested);
    if (allowed) setView(requested as AttendanceView);
  }, [items, navigate, searchParams]);

  const selectView = useCallback((next: AttendanceView) => {
    setView(next);
    const defaultView = owner ? "overview" : "today";
    setSearchParams(next === defaultView ? {} : { view: next }, { replace: true });
  }, [owner, setSearchParams]);

  const refreshPendingApprovals = useCallback(async () => {
    if (!owner) return;
    try {
      const data = await api<{ pendingApprovals: number }>(
        "/admin/work-entries/pending-count",
      );
      setPendingApprovals(data.pendingApprovals);
    } catch {
      // Halaman aktif tetap menampilkan error detailnya sendiri.
    }
  }, [owner, setPendingApprovals]);

  useEffect(() => {
    void refreshPendingApprovals();
    if (!owner) return;
    const timer = window.setInterval(() => void refreshPendingApprovals(), 30_000);
    return () => window.clearInterval(timer);
  }, [refreshPendingApprovals, owner]);

  const content = useMemo(() => {
    if (owner) {
      if (view === "overview") return <AdminOverviewPage navigate={(next) => selectView(next)} />;
      if (view === "approvals") return <ApprovalsPage onPendingChanged={setPendingApprovals} />;
      if (view === "calendar") return <CalendarPage role="ADMIN" />;
      if (view === "products") return <ProductsPage />;
      if (view === "tasks") return <TasksPage />;
      if (view === "notes") return <NotesPage />;
      if (view === "payroll") return <PayrollPage />;
      return <AuditPage />;
    }
    if (view === "today") return <EmployeeTodayPage />;
    if (view === "calendar") return <CalendarPage role="USER" />;
    if (view === "tasks") return <EmployeeTasksPage />;
    if (view === "earnings") return <EarningsPage />;
    return <HistoryPage />;
  }, [owner, selectView, setPendingApprovals, view]);

  const activeViewLabel = items.find((item) => item.id === view)?.label ?? "Ringkasan";

  return (
    <FeedbackProvider>
      <div data-workspace-page className="attendance-module space-y-5">
        <WorkspacePageHeader
          eyebrow="ARTECH • Workforce"
          title="Absensi & Operasional"
          description="Kelola pekerjaan harian, borongan, persetujuan, produksi, tugas, dan payroll dalam satu alur."
          icon={Settings2}
          actions={
            <div className="flex min-h-11 items-center gap-3 rounded-xl bg-white/[0.08] px-4 ring-1 ring-white/15 backdrop-blur">
              <Users className="h-4 w-4 text-cyan-200" />
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-300">Akun aktif</p>
                <p className="max-w-40 truncate text-sm font-semibold text-white">@{username}</p>
              </div>
            </div>
          }
          metrics={[
            { label: "Akses", value: owner ? "Owner" : "Pekerja", icon: ShieldCheck, tone: "cyan" },
            { label: "Zona waktu", value: "Asia/Jakarta", icon: Clock3, tone: "emerald" },
            { label: "Menu aktif", value: activeViewLabel, icon: LayoutDashboard, tone: "indigo" },
          ]}
        />

        <div className="-mx-1 overflow-x-auto px-1 pb-1" aria-label="Navigasi modul absensi">
          <div className="flex min-w-max gap-2">
            {items.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectView(item.id)}
                  className={[
                    "inline-flex min-h-11 items-center gap-2 rounded-xl border px-3.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                    active
                      ? "border-[#1c557d] bg-[#1b4f75] text-white shadow-lg shadow-sky-900/15"
                      : "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-[#174b70] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500/60 dark:hover:text-sky-200",
                  ].join(" ")}
                  aria-pressed={active}
                >
                  <Icon className="h-4 w-4" /> {item.label}
                  {item.id === "approvals" && pendingApprovals > 0 ? (
                    <span className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-black text-white shadow-sm ring-2 ring-white/60 dark:ring-slate-900">
                      {pendingApprovals > 99 ? "99+" : pendingApprovals}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="attendance-content">{content}</div>
      </div>
    </FeedbackProvider>
  );
}
