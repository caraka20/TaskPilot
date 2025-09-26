// client/src/components/layout/Sidebar.tsx
import React, { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar, Tooltip, Button } from "@heroui/react";
import {
  LayoutDashboard, Users, Users2, BookOpen, GraduationCap, LogOut,
  Moon, Sun, ShieldCheck, ChevronsLeft, ChevronsRight
} from "lucide-react";

import { useAuthStore } from "../../store/auth.store";
import { useWorkStore } from "../../store/work.store";
import { useThemeStore } from "../../store/theme.store";
import { useUIStore } from "../../store/ui.store";
import { toHMS } from "../../utils/format";
import { useApi } from "../../hooks/useApi";
import { logout as logoutSvc } from "../../services/auth.service";

/* ===== Status meta ===== */
function useStatusMeta() {
  const { status, durasiDetik } = useWorkStore();
  const label = status === "AKTIF" ? `AKTIF · ${toHMS(durasiDetik)}` : status;
  if (status === "AKTIF") return { label, color: "success" as const, dot: "bg-emerald-500", pulse: "animate-[pulse_1.8s_ease-in-out_infinite]" };
  if (status === "JEDA")  return { label, color: "warning" as const, dot: "bg-amber-500",   pulse: "" };
  return { label, color: "danger" as const, dot: "bg-rose-500", pulse: "" };
}

/* ===== Avatar default ===== */
const AVATAR_MONKEY_SVG =
  `data:image/svg+xml;utf8,` +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <rect width="160" height="160" rx="80" fill="#FFE8D6"/>
  <circle cx="80" cy="76" r="42" fill="#7C3E1D"/>
  <ellipse cx="57" cy="82" rx="18" ry="14" fill="#F9DCC4"/>
  <ellipse cx="103" cy="82" rx="18" ry="14" fill="#F9DCC4"/>
  <circle cx="68" cy="70" r="6" fill="#111"/>
  <circle cx="92" cy="70" r="6" fill="#111"/>
  <path d="M64 92c6 6 26 6 32 0" stroke="#111" stroke-width="4" stroke-linecap="round" fill="none"/>
</svg>`);

export default function Sidebar() {
  const api = useApi();
  const navigate = useNavigate();

  const { token, role, username, reset } = useAuthStore();
  const { dark, toggle } = useThemeStore();
  const { sidebarCollapsed: collapsed, toggleSidebar } = useUIStore();
  const status = useStatusMeta();
  const isOwner = (role ?? "").toUpperCase() === "OWNER";

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark"); else root.classList.remove("dark");
  }, [dark]);

  // ===== menu utama
  const menus = [
    { to: "/dashboard",      label: "Dashboard",  icon: LayoutDashboard, show: true },
    { to: "/customers",      label: "Customers",  icon: Users2,          show: true },
    { to: "/tuton-subjects", label: "Matakuliah", icon: BookOpen,        show: true },
    { to: "/users",          label: "Users",      icon: Users,           show: isOwner },
  ];

  // ===== quick links baru di bawah Users
  // - Daftar Tuton (umum): pakai /tuton (atau ganti ke route yang kamu pakai)
  // - Daftar Karil (umum): pakai /karil
  const quickLinks = [
    { to: "/tuton", label: "Daftar Tuton", icon: BookOpen },
    { to: "/karil", label: "Daftar Karil", icon: GraduationCap },
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
  const bgShell = dark ? "bg-[#0a0f1e] text-slate-100 border-[#121a2a]" : "bg-white text-slate-800 border-slate-200";
  const itemBase = dark ? "text-slate-200 hover:bg-[#121a2e] hover:text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900";
  const itemActive = dark
    ? "text-white bg-[#1b294a] ring-2 ring-sky-500/50 shadow-lg shadow-sky-900/20"
    : "text-indigo-800 bg-indigo-500/20 ring-2 ring-indigo-400/60 shadow-[0_1px_10px_rgba(99,102,241,.18)]";
  const dropBg = dark ? "bg-[#0a0f1e] border-[#111827] text-slate-200" : "bg-white border-slate-200 text-slate-800";
  const collapseBtn = dark
    ? "border-[#1b2744] bg-[#101827]/80 hover:bg-[#15223a]"
    : "border-slate-200 bg-white/80 hover:bg-white";

  const itemClass = ({ isActive }: { isActive: boolean }) =>
    [
      "group relative flex items-center gap-3",
      collapsed ? "justify-center" : "",
      "px-1 py-1 rounded-xl text-[14px] font-semibold transition-colors outline-none ring-0",
      isActive ? itemActive : itemBase,
    ].join(" ");

  return (
    <aside
      className={`${shell} relative hidden sm:flex sm:flex-col shrink-0 p-4
                  h-screen sticky top-0 overflow-hidden
                  border-r ${bgShell} transition-[width] duration-300`}
    >
      {/* === Floating toggle: pojok kanan, tengah sumbu Y === */}
      <Tooltip content={collapsed ? "Expand sidebar" : "Collapse sidebar"} placement="right">
        <button
          onClick={toggleSidebar}
          className={`absolute top-1/2 -translate-y-1/2 right-2 p-2 rounded-xl shadow-sm transition-all border ${collapseBtn} z-20`}
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
              className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl transition ${dark ? "hover:bg-[#121a2e]" : "hover:bg-slate-100"}`}
            >
              <div className="relative">
                <Avatar className="bg-background" src={AVATAR_MONKEY_SVG} size="sm" color={status.color as any} />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-background ${status.dot} ${status.pulse}`}
                  title={status.label}
                />
              </div>
              {!collapsed && (
                <div className="min-w-0 text-left">
                  <div className="text-sm font-semibold truncate max-w-[11.5rem]">{username || "unknown"}</div>
                  <div className={`text-[11px] uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-600"}`}>
                    {(role || "NO-ROLE").toString()}
                  </div>
                </div>
              )}
            </button>
          </DropdownTrigger>

          <DropdownMenu
            aria-label="Profile Actions"
            variant="flat"
            className={`min-w-[260px] z-[1000] rounded-2xl border p-1 shadow-xl ${dropBg}`}
            selectionMode="none"
            onAction={(key) => {
              if (key === "open_dashboard") navigate("/dashboard");
              if (key === "logout") onLogout();
            }}
          >
            <DropdownItem key="profile" className="h-auto gap-1 px-3 py-3 rounded-xl" textValue={`Signed in as ${username || "unknown"}`} isReadOnly>
              <p className={`${dark ? "text-slate-400" : "text-slate-600"} text-sm font-semibold`}>Signed in as</p>
              <p className="font-semibold truncate text-lg">{username || "unknown"}</p>
            </DropdownItem>

            <DropdownItem key="status" textValue="Status" className="rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-sm">Status</span>
                <span className={`ml-auto h-3 w-3 rounded-full ${status.dot} ${status.pulse}`} title={status.label} />
              </div>
            </DropdownItem>

            <DropdownItem key="role" textValue="Role" className="rounded-xl" startContent={<ShieldCheck className="h-4 w-4" />}>
              <div className="flex items-center w-full">
                <span className="text-sm">Role</span>
                <span className="ml-auto text-sm font-medium">{(role || "NO-ROLE").toString().toUpperCase()}</span>
              </div>
            </DropdownItem>

            <DropdownItem key="open_dashboard" textValue="Open Dashboard" className="rounded-xl" startContent={<LayoutDashboard className="h-4 w-4" />}>
              Dashboard
            </DropdownItem>

            <DropdownItem key="logout" color="danger" textValue="Log Out" className="rounded-xl" startContent={<LogOut className="h-4 w-4" />}>
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      ) : null}

      {/* ======= PEMISAH antara Profil dan Menu ======= */}
      <div className={`mt-3 mb-4 h-[1px] rounded-full ${dark ? "bg-[#1b2744]" : "bg-slate-200"}`} />

      {/* Menu utama */}
      <nav className="mt-0 flex-1 space-y-1">
        {menus.filter(m => m.show).map((m) => {
          const Ico = m.icon;
          const Item = (
            <NavLink key={m.to} to={m.to} className={itemClass} title={m.label}>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl shrink-0">
                <Icon I={Ico} />
              </span>
              {!collapsed && <span className="truncate leading-[44px]">{m.label}</span>}
            </NavLink>
          );
          return collapsed ? (
            <Tooltip key={m.to} content={m.label} placement="right">
              <div>{Item}</div>
            </Tooltip>
          ) : Item;
        })}

        {/* ===== Separator cantik + Quick Links ===== */}
        <div className="my-3">
          <div className="relative h-[1px] rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-500/40 to-transparent dark:via-sky-400/30" />
          </div>
          {!collapsed && (
            <div className={`mt-2 mb-1 text-[11px] uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-500"}`}>
              Akses Cepat
            </div>
          )}
        </div>

        {quickLinks.map((m) => {
          const Ico = m.icon;
          const Item = (
            <NavLink key={m.to} to={m.to} className={itemClass} title={m.label}>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl shrink-0">
                <Icon I={Ico} />
              </span>
              {!collapsed && <span className="truncate leading-[44px]">{m.label}</span>}
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
      <div className="mt-6">
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
