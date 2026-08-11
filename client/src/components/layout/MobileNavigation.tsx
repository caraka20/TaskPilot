import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings2,
  Sun,
  Users,
  Users2,
  X,
} from "lucide-react";

import { useApi } from "../../hooks/useApi";
import { logout as logoutService } from "../../services/auth.service";
import { useAuthStore } from "../../store/auth.store";
import { useThemeStore } from "../../store/theme.store";
import { useWorkStore } from "../../store/work.store";
import { toHMS } from "../../utils/format";

type NavigationItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  ownerOnly?: boolean;
};

const primaryItems: NavigationItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customer", icon: Users2 },
  { to: "/tuton-subjects", label: "Matakuliah", icon: BookOpen },
];

const secondaryItems: NavigationItem[] = [
  { to: "/users", label: "Users", icon: Users, ownerOnly: true },
  { to: "/tuton", label: "Daftar Tuton", icon: BookOpen },
  { to: "/karil", label: "Daftar Karil", icon: GraduationCap },
  { to: "/config/effective", label: "Konfigurasi", icon: Settings2 },
];

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/customers/")) return "Detail Customer";
  if (pathname === "/customers") return "Customer";
  if (pathname === "/users/register") return "Tambah User";
  if (pathname.startsWith("/users/")) return "Detail User";
  if (pathname === "/users") return "Users";
  if (pathname.startsWith("/tuton-subjects")) return "Matakuliah";
  if (pathname.startsWith("/tuton")) return "Daftar Tuton";
  if (pathname.startsWith("/karil")) return "Daftar Karil";
  if (pathname.startsWith("/config")) return "Konfigurasi";
  return "Dashboard";
}

export default function MobileNavigation() {
  const api = useApi();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const { username, role, reset } = useAuthStore();
  const { dark, toggle } = useThemeStore();
  const { status, durasiDetik } = useWorkStore();
  const isOwner = role === "OWNER";

  const menuItems = useMemo(
    () => secondaryItems.filter((item) => !item.ownerOnly || isOwner),
    [isOwner]
  );

  const initials = (username?.slice(0, 2) || "TP").toUpperCase();
  const statusLabel =
    status === "AKTIF"
      ? `Aktif · ${toHMS(durasiDetik)}`
      : status === "JEDA"
        ? "Sedang jeda"
        : "Tidak aktif";
  const statusDot =
    status === "AKTIF"
      ? "bg-emerald-500"
      : status === "JEDA"
        ? "bg-amber-500"
        : "bg-slate-400";

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function logout() {
    try {
      await logoutService(api);
    } catch {
      // Logout lokal tetap dilakukan jika server tidak dapat dihubungi.
    }
    reset();
    navigate("/login", { replace: true });
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    [
      "flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
      isActive
        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
    ].join(" ");

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200/80 bg-white/90 px-3 pt-[env(safe-area-inset-top)] shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 lg:hidden">
        <div className="mx-auto flex h-16 max-w-screen-md items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-sm font-black text-white shadow-lg shadow-indigo-500/20">
              TP
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-500">
                TaskPilot
              </p>
              <h1 className="truncate text-base font-bold text-slate-900 dark:text-white">
                {getPageTitle(pathname)}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            aria-label="Buka menu navigasi"
            aria-expanded={open}
            aria-controls="mobile-navigation-sheet"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <nav
        aria-label="Navigasi utama mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 lg:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-semibold transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                      : "text-slate-500 dark:text-slate-400",
                  ].join(" ")
                }
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate">{item.label}</span>
              </NavLink>
            );
          })}

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-semibold text-slate-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400"
            aria-label="Buka menu lainnya"
          >
            <Menu className="h-5 w-5" />
            <span>Lainnya</span>
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-50 lg:hidden ${open ? "visible pointer-events-auto" : "invisible pointer-events-none"}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-slate-950/45 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
          aria-label="Tutup menu navigasi"
          tabIndex={open ? 0 : -1}
        />

        <section
          id="mobile-navigation-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi"
          className={`absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[2rem] border-t border-slate-200 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl transition-transform duration-300 dark:border-slate-800 dark:bg-slate-950 ${open ? "translate-y-0" : "translate-y-full"}`}
        >
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />

          <div className="flex items-center gap-3 rounded-3xl bg-slate-50 p-3 dark:bg-slate-900">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-slate-900 dark:text-white">{username || "Pengguna"}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className={`h-2.5 w-2.5 rounded-full ${statusDot}`} />
                <span className="truncate">{statusLabel}</span>
                <span aria-hidden="true">•</span>
                <span>{role || "USER"}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-slate-500 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800"
              aria-label="Tutup menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 grid gap-1">
            {[...primaryItems, ...menuItems].map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} className={navClass}>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </NavLink>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={toggle}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-3 text-sm font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-slate-900 dark:text-slate-200"
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {dark ? "Mode terang" : "Mode gelap"}
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-rose-50 px-3 text-sm font-semibold text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:bg-rose-500/10 dark:text-rose-300"
            >
              <LogOut className="h-5 w-5" />
              Keluar
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
