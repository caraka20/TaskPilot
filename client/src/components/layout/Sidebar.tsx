// client/src/components/layout/Sidebar.tsx
import React, { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar, Tooltip, Button } from "@heroui/react";
import {
  LayoutDashboard, Users, Users2, BookOpen, LogOut,
  Moon, Sun, ChevronsLeft, ChevronsRight, ClipboardCheck,
  FileText, FlaskConical, Settings2, ChevronDown,
} from "lucide-react";

import { useAuthStore } from "../../store/auth.store";
import { useWorkStore } from "../../store/work.store";
import { useThemeStore } from "../../store/theme.store";
import { useUIStore } from "../../store/ui.store";
import { toHMS } from "../../utils/format";
import { useApi } from "../../hooks/useApi";
import { logout as logoutSvc } from "../../services/auth.service";
import Brand from "./Brand";
import { resolveBackendAssetUrl } from "../../utils/media";
import OwnerNotesPopover from "./OwnerNotesPopover";

/* ===== Status meta ===== */
function useStatusMeta() {
  const { status, durasiDetik } = useWorkStore();
  const label = status === "AKTIF" ? `AKTIF · ${toHMS(durasiDetik)}` : status;
  if (status === "AKTIF") return { label, color: "success" as const, dot: "bg-emerald-500", pulse: "animate-[pulse_1.8s_ease-in-out_infinite]" };
  if (status === "JEDA")  return { label, color: "warning" as const, dot: "bg-amber-500",   pulse: "" };
  return { label, color: "danger" as const, dot: "bg-rose-500", pulse: "" };
}

export default function Sidebar() {
  const api = useApi();
  const navigate = useNavigate();

  const { token, role, username, avatarUrl, baseUrl, reset } = useAuthStore();
  const { dark, toggle } = useThemeStore();
  const {
    sidebarCollapsed: collapsed,
    toggleSidebar,
    pendingApprovals,
    setPendingApprovals,
  } = useUIStore();
  const status = useStatusMeta();
  const isOwner = (role ?? "").toUpperCase() === "OWNER";
  const initials = (username?.slice(0, 2) || "TP").toUpperCase();

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark"); else root.classList.remove("dark");
  }, [dark]);

  useEffect(() => {
    if (!isOwner) {
      setPendingApprovals(0);
      return;
    }

    let active = true;
    const loadPendingApprovals = async () => {
      try {
        const { data } = await api.get<{ pendingApprovals: number }>(
          "/api/attendance/admin/work-entries/pending-count",
        );
        if (active) setPendingApprovals(data.pendingApprovals);
      } catch {
        // Badge tidak mengganggu navigasi ketika koneksi sedang terputus.
      }
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void loadPendingApprovals();
    };

    void loadPendingApprovals();
    const timer = window.setInterval(() => void loadPendingApprovals(), 30_000);
    window.addEventListener("focus", loadPendingApprovals);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", loadPendingApprovals);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [api, isOwner, setPendingApprovals]);

  // ===== menu utama
  const menus = [
    { to: "/dashboard",      label: "Dashboard",  icon: LayoutDashboard, show: true },
    { to: "/attendance",     label: "Absensi",    icon: ClipboardCheck,  show: true },
    { to: "/customers",      label: "Customers",  icon: Users2,          show: true },
    { to: "/tuton-subjects", label: "Matakuliah", icon: BookOpen,        show: true },
    { to: "/karil",          label: "Karya Ilmiah", icon: FileText,     show: true },
    { to: "/metode-penelitian", label: "Metode Penelitian", icon: FlaskConical, show: true },
    { to: "/config/effective", label: "Konfigurasi", icon: Settings2, show: isOwner },
    { to: "/users",          label: "Users",      icon: Users,           show: isOwner },
  ];

  async function onLogout() {
    try { await logoutSvc(api); } catch { /* noop */ }
    reset();
    navigate("/login", { replace: true });
  }

  const Icon = ({ I }: { I: React.ComponentType<{ className?: string }> }) => (
    <I className="w-6 h-6 shrink-0" />
  );

  const shell = collapsed ? "w-20" : "w-64";
  const bgShell = dark
    ? "bg-[linear-gradient(180deg,#071827_0%,#0b2630_54%,#081a29_100%)] text-slate-100 border-[#173b48]"
    : "bg-[linear-gradient(180deg,#f8fbff_0%,#eef8f6_52%,#f7fafc_100%)] text-[#17334a] border-[#d6e6e8]";
  const itemBase = dark
    ? "text-slate-300 hover:bg-white/10 hover:text-white"
    : "text-[#526a7d] hover:bg-white/75 hover:text-[#123f5c] hover:shadow-sm";
  const itemActive = dark
    ? "text-white bg-[linear-gradient(135deg,#174766,#17645f)] ring-1 ring-teal-300/35 shadow-lg shadow-slate-950/25"
    : "text-white bg-[linear-gradient(135deg,#174c6d,#17736d)] ring-1 ring-[#266f77]/25 shadow-[0_10px_24px_rgba(18,74,94,.18)]";
  const dropBg = dark ? "bg-[#0b2130] border-[#214250] text-slate-200" : "bg-[#fbfefe] border-[#d8e7e8] text-[#17334a]";
  const collapseBtn = dark
    ? "border-[#23435c] bg-[#10273b] hover:bg-[#17334b]"
    : "border-[#d4e1ec] bg-white hover:bg-[#eef6fb]";

  const itemClass = ({ isActive }: { isActive: boolean }) =>
    [
      "group relative flex items-center gap-3",
      collapsed ? "justify-center" : "",
      "px-1 py-1 rounded-xl text-[14px] font-semibold transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
      isActive ? itemActive : itemBase,
    ].join(" ");

  return (
    <aside
      className={`${shell} relative hidden lg:flex lg:flex-col shrink-0 p-4
                  h-dvh sticky top-0 overflow-visible
                  border-r ${bgShell} transition-[width] duration-300`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className={`absolute -right-20 top-20 h-44 w-44 rounded-full blur-3xl ${dark ? "bg-teal-400/10" : "bg-teal-300/20"}`} />
        <span className={`absolute -left-16 bottom-20 h-40 w-40 rounded-full blur-3xl ${dark ? "bg-sky-400/10" : "bg-sky-300/15"}`} />
      </div>
      <div className={`mb-4 flex min-h-12 items-center ${collapsed ? "justify-center" : "px-2"}`}>
        {collapsed ? (
          <NavLink
            to="/dashboard"
            aria-label="ARTECH Dashboard"
            className="grid h-11 w-11 place-items-center rounded-2xl bg-primary font-black text-white shadow-lg shadow-indigo-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <img alt="" aria-hidden="true" className="h-11 w-11" src="/brand/taskpilot-mark.svg" />
          </NavLink>
        ) : (
          <Brand />
        )}
      </div>

      {/* === Floating toggle: pojok kanan, tengah sumbu Y === */}
      <Tooltip content={collapsed ? "Expand sidebar" : "Collapse sidebar"} placement="right">
        <button
          onClick={toggleSidebar}
          className={`absolute top-1/2 -translate-y-1/2 right-2 grid h-11 w-11 place-items-center rounded-xl shadow-sm transition-all border ${collapseBtn} z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
        </button>
      </Tooltip>

      {/* Profile + Dropdown */}
      {token ? (
        <Dropdown placement="bottom-start">
          <DropdownTrigger>
            <button
              type="button"
              aria-label="Buka menu akun"
              className={`relative flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-2.5 py-2.5 transition-all ${dark ? "border-white/10 bg-white/5 hover:border-teal-300/25 hover:bg-white/10" : "border-white/80 bg-white/65 shadow-[0_7px_20px_rgba(23,51,74,.05)] hover:border-[#c8dedf] hover:bg-white"}`}
            >
              <div className="relative">
                <Avatar
                  className="bg-gradient-to-br from-indigo-500 to-sky-500 font-bold text-white"
                  name={initials}
                  src={resolveBackendAssetUrl(avatarUrl, baseUrl)}
                  size="sm"
                  color={status.color as any}
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-background ${status.dot} ${status.pulse}`}
                  title={status.label}
                />
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-sm font-semibold truncate max-w-[11.5rem]">{username || "unknown"}</div>
                  <div className={`text-[11px] uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-600"}`}>
                    {(role || "NO-ROLE").toString()}
                  </div>
                </div>
              )}
              {!collapsed ? <ChevronDown className="h-4 w-4 shrink-0 opacity-50" /> : null}
            </button>
          </DropdownTrigger>

          <DropdownMenu
            aria-label="Profile Actions"
            variant="flat"
            className={`min-w-[260px] z-[1000] rounded-2xl border p-1 shadow-xl ${dropBg}`}
            selectionMode="none"
            onAction={(key) => {
              if (key === "account_settings") navigate("/account");
              if (key === "open_dashboard") navigate("/dashboard");
              if (key === "logout") onLogout();
            }}
          >
            <DropdownItem key="profile" className="h-auto rounded-xl px-3 py-3" textValue={`Akun ${username || "unknown"}`} isReadOnly>
              <div className="flex items-center gap-3">
                <Avatar
                  className="shrink-0 bg-gradient-to-br from-[#174c6d] to-[#18a39a] font-bold text-white"
                  name={initials}
                  src={resolveBackendAssetUrl(avatarUrl, baseUrl)}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{username || "unknown"}</p>
                  <div className={`mt-1 flex items-center gap-2 text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
                    <span>{(role || "NO-ROLE").toString().toUpperCase()}</span>
                    <span aria-hidden="true">•</span>
                    <span className={`h-2 w-2 rounded-full ${status.dot} ${status.pulse}`} />
                    <span className="truncate">{status.label}</span>
                  </div>
                </div>
              </div>
            </DropdownItem>

            <DropdownItem
              key="account_settings"
              textValue="Pengaturan akun"
              className="h-auto rounded-xl py-2.5"
              startContent={<Settings2 className="h-4 w-4 text-[#1b5278] dark:text-sky-300" />}
            >
              <div>
                <p className="text-sm font-semibold">Pengaturan akun</p>
                <p className={`mt-0.5 text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  Profil, foto, dan sandi
                </p>
              </div>
            </DropdownItem>

            <DropdownItem key="open_dashboard" textValue="Dashboard" className="rounded-xl" startContent={<LayoutDashboard className="h-4 w-4" />}>
              Dashboard
            </DropdownItem>

            <DropdownItem key="logout" color="danger" textValue="Keluar" className="rounded-xl" startContent={<LogOut className="h-4 w-4" />}>
              Keluar
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      ) : null}

      {/* ======= PEMISAH antara Profil dan Menu ======= */}
      <div className={`mt-3 mb-4 h-[1px] rounded-full ${dark ? "bg-[#1b2744]" : "bg-slate-200"}`} />

      {!isOwner ? <OwnerNotesPopover collapsed={collapsed} /> : null}

      {/* Menu utama */}
      <nav className="mt-0 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {menus.filter(m => m.show).map((m) => {
          const Ico = m.icon;
          const notificationCount = m.to === "/attendance" && isOwner
            ? pendingApprovals
            : 0;
          const Item = (
            <NavLink key={m.to} to={m.to} className={itemClass} title={m.label}>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl shrink-0 transition-colors group-hover:bg-sky-500/5">
                <Icon I={Ico} />
              </span>
              {!collapsed && <span className="min-w-0 flex-1 truncate leading-[44px]">{m.label}</span>}
              {notificationCount > 0 ? (
                <span
                  className={[
                    "inline-flex items-center justify-center rounded-full bg-rose-500 font-black text-white shadow-sm ring-2 ring-white/70 dark:ring-slate-900",
                    collapsed
                      ? "absolute right-0 top-0 h-5 min-w-5 px-1 text-[9px]"
                      : "mr-2 h-6 min-w-6 px-1.5 text-[10px]",
                  ].join(" ")}
                  aria-label={`${notificationCount} persetujuan menunggu`}
                >
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              ) : null}
            </NavLink>
          );
          return collapsed ? (
            <Tooltip key={m.to} content={m.label} placement="right">
              <div>{Item}</div>
            </Tooltip>
          ) : Item;
        })}

      </nav>

      {/* Footer actions */}
      <div className="mt-3 border-t border-slate-200/80 pt-3 dark:border-slate-800">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={toggle}
              className={`h-11 w-11 rounded-xl flex items-center justify-center border transition
                          ${dark ? "border-[#1b2744] bg-[#101827]/80 hover:bg-[#15223a]" : "border-slate-200 bg-white/80 hover:bg-white"}`}
              aria-label={dark ? "Light Mode" : "Dark Mode"}
            >
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {token && (
              <button
                onClick={onLogout}
                className="h-11 w-11 rounded-xl flex items-center justify-center border border-rose-200/60 bg-rose-100/70 hover:bg-rose-100 text-rose-700"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Button onPress={toggle} variant="flat" className="w-full justify-start">
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="ml-3">{dark ? "Light Mode" : "Dark Mode"}</span>
            </Button>

            {token && (
              <Button onPress={onLogout} color="danger" variant="flat" className="w-full justify-start">
                <LogOut className="w-5 h-5" />
                <span className="ml-3">Logout</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
