// src/components/layout/Topbar.tsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  NavbarContent,
  Button,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Avatar,
} from "@heroui/react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { useAuthStore } from "../../store/auth.store";
import { useApi } from "../../hooks/useApi";
import { logout as logoutSvc } from "../../services/auth.service";
import { useWorkStore } from "../../store/work.store";
import { toHMS } from "../../utils/format";

import { ShieldCheck, LayoutDashboard, LogOut } from "lucide-react";
import logo from "./logo-dark.png";

/* ========== Brand (desktop: logo + text, logo besar) ========== */
function BrandDesktop() {
  return (
    <NavLink to="/" aria-label="ARTECH – Home" className="flex items-center gap-2 select-none group">
      <img
        src={logo}
        alt="ARTECH"
        className="h-12 w-12 rounded-2xl ring-1 ring-black/5 dark:ring-white/10
                   object-contain p-2 transition-transform duration-300
                   group-hover:-rotate-6 group-hover:scale-105 dark:invert"
      />
      <span className="text-[24px] md:text-[26px] font-extrabold leading-none tracking-tight
                       bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500
                       bg-clip-text text-transparent drop-shadow-sm
                       transition-all duration-300 group-hover:tracking-widest">
        ARTECH
      </span>
    </NavLink>
  );
}

/* ========== Brand (mobile: logo only) ========== */
function BrandMobileIcon() {
  return (
    <NavLink to="/" aria-label="ARTECH – Home" className="select-none">
      <img
        src={logo}
        alt="ARTECH"
        className="h-10 w-10 rounded-xl ring-1 ring-black/5 dark:ring-white/10 object-contain p-1.5 dark:invert"
      />
    </NavLink>
  );
}

/* ========== Status meta (hanya dipakai untuk warna dot) ========== */
function useStatusMeta() {
  const { status, durasiDetik } = useWorkStore();
  const label = status === "AKTIF" ? `AKTIF · ${toHMS(durasiDetik)}` : status;
  if (status === "AKTIF")
    return {
      label,
      color: "success" as const,
      dot: "bg-emerald-500",
      pulse: "animate-[pulse_1.8s_ease-in-out_infinite]",
    };
  if (status === "JEDA")
    return {
      label,
      color: "warning" as const,
      dot: "bg-amber-500",
      pulse: "",
    };
  return {
    label,
    color: "danger" as const,
    dot: "bg-rose-500", // merah saat tidak aktif
    pulse: "",
  };
}

/* ========== Avatar default (monkey SVG inline) ========== */
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

/* ========== Topbar ========== */
export default function Topbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const api = useApi();
  const { token, role, username, reset } = useAuthStore();

  const isOwner = (role ?? "").toUpperCase() === "OWNER";
  const name = (username || "unknown").toString();
  const status = useStatusMeta();

  const menus = [
    { to: "/dashboard",       label: "Dashboard", show: true },
    { to: "/customers",       label: "Customers", show: true },
    { to: "/tuton-subjects",  label: "Matakuliah",  show: true }, // ⬅️ NEW
    { to: "/users",           label: "Users",     show: isOwner },
  ];

  async function onLogout() {
    try { await logoutSvc(api); } catch {}
    reset();
    navigate("/login", { replace: true });
  }

  /* ===== Animated underline (desktop) ===== */
  const navWrapRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const recalcIndicator = () => {
    const active = menus.find(m =>
      location.pathname === m.to || location.pathname.startsWith(m.to + "/")
    );
    if (!active || !navWrapRef.current) return;
    const el = itemRefs.current[active.to];
    if (!el) return;
    const wrapRect = navWrapRef.current.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const width = Math.max(28, rect.width * 0.55);
    const left = rect.left - wrapRect.left + (rect.width - width) / 2;
    setIndicator({ left, width });
  };

  useLayoutEffect(() => { recalcIndicator(); }, [location.pathname, menus.length]);
  useEffect(() => {
    const onResize = () => recalcIndicator();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const NavItem = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <NavLink to={to}>
      {({ isActive }) => (
        <span
          ref={(el) => { itemRefs.current[to] = el; }}
          className={`relative px-3 py-2 text-[15px] md:text-[16px] font-semibold tracking-wide
                      transition-colors ${isActive ? "text-foreground" : "text-foreground-600 hover:text-foreground"}`}
        >
          {children}
        </span>
      )}
    </NavLink>
  );

  return (
    <Navbar
      isBordered
      disableAnimation
      maxWidth="full"
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      className="sticky top-0 z-[120] backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-black/30"
    >

      {/* LEFT (mobile): hamburger + logo icon */}
      <NavbarContent className="sm:hidden gap-2" justify="start">
        <NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"} />
        <BrandMobileIcon />
      </NavbarContent>

      {/* LEFT (desktop): brand (min-width utk balance) */}
      <NavbarContent className="hidden sm:flex" justify="start">
        <NavbarBrand className="sm:min-w-[280px]"><BrandDesktop /></NavbarBrand>
      </NavbarContent>

      {/* NAV TENGAH — clean + animated underline (desktop) */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 hidden sm:flex justify-center">
        <nav ref={navWrapRef} className="relative flex gap-3">
          <span
            className="absolute bottom-0 h-[3px] rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500"
            style={{
              left: indicator.left,
              width: indicator.width,
              transition: "left 280ms cubic-bezier(.2,.8,.2,1), width 280ms cubic-bezier(.2,.8,.2,1)",
            }}
          />
          {menus.filter(m => m.show).map((m) => (
            <NavItem key={m.to} to={m.to}>{m.label}</NavItem>
          ))}
        </nav>
      </div>

      {/* RIGHT: avatar monyet + dot status; nama hanya desktop (tanpa chip tulisan) */}
      <NavbarContent as="div" justify="end" className="sm:min-w-[280px]">
        {token ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="relative">
                  <Avatar
                    className="bg-background"
                    src={AVATAR_MONKEY_SVG}
                    size="sm"
                    color={status.color}
                  />
                  {/* dot status (merah saat tidak aktif) */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-background ${status.dot} ${status.pulse}`}
                    title={status.label}
                  />
                </div>
                {/* nama hanya muncul di desktop; tidak ada chip status */}
                <span className="hidden sm:block max-w-[150px] truncate text-sm font-semibold tracking-wide">
                  {name}
                </span>
              </div>
            </DropdownTrigger>

            <DropdownMenu
              aria-label="Profile Actions"
              variant="flat"
              className="min-w-[260px] z-[1000] rounded-2xl border border-default-200 shadow-xl bg-background/85 backdrop-blur-md p-1"
              selectionMode="none"
              onAction={(key) => { if (key === "logout") onLogout(); }}
            >
              <DropdownItem
                key="profile"
                className="h-auto gap-1 px-3 py-3 rounded-xl"
                textValue={`Signed in as ${name}`}
                isReadOnly
              >
                <p className="text-sm font-semibold text-foreground-500">Signed in as</p>
                <p className="font-semibold truncate text-lg">{name}</p>
              </DropdownItem>

              {/* Status row: hanya dot, tanpa tulisan status */}
              <DropdownItem key="status" textValue="Status" className="rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-sm">Status</span>
                  <span
                    className={`ml-auto h-3 w-3 rounded-full ${status.dot} ${status.pulse}`}
                    title={status.label}
                  />
                </div>
              </DropdownItem>

              <DropdownItem
                key="role"
                textValue="Role"
                className="rounded-xl"
                startContent={<ShieldCheck className="h-4 w-4" />}
              >
                <div className="flex items-center w-full">
                  <span className="text-sm">Role</span>
                  <span className="ml-auto text-sm font-medium">
                    {(role || "NO-ROLE").toString().toUpperCase()}
                  </span>
                </div>
              </DropdownItem>

              <DropdownItem
                key="open_dashboard"
                as={NavLink}
                to="/dashboard"
                textValue="Open Dashboard"
                className="rounded-xl"
                startContent={<LayoutDashboard className="h-4 w-4" />}
              >
                Dashboard
              </DropdownItem>

              <DropdownItem
                key="logout"
                color="danger"
                textValue="Log Out"
                className="rounded-xl"
                startContent={<LogOut className="h-4 w-4" />}
              >
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <Button as={NavLink} to="/login" size="sm" color="primary">Login</Button>
        )}
      </NavbarContent>

      {/* DRAWER MENU (mobile) – auto close setelah klik */}
      <NavbarMenu>
        {menus.filter(m => m.show).map((m) => (
          <NavbarMenuItem key={m.to}>
            <NavLink to={m.to} onClick={() => setIsMenuOpen(false)}>
              {({ isActive }) => (
                <span
                  className={`block w-full rounded-xl px-3 py-2 text-base font-semibold transition-all
                              ${isActive
                                ? "bg-gradient-to-r from-indigo-500/10 via-sky-500/10 to-emerald-500/10 text-foreground ring-1 ring-default-200 shadow-sm"
                                : "text-foreground-600 hover:text-foreground"}`}
                >
                  <span className={`mr-2 h-4 w-1.5 rounded-full inline-block align-middle
                                  ${isActive ? "bg-gradient-to-b from-indigo-500 via-sky-500 to-emerald-500" : "bg-transparent"}`} />
                  {m.label}
                </span>
              )}
            </NavLink>
          </NavbarMenuItem>
        ))}
        {token && (
          <NavbarMenuItem>
            <Button
              size="sm"
              variant="flat"
              color="danger"
              className="w-full"
              onPress={() => { setIsMenuOpen(false); onLogout(); }}
            >
              Logout
            </Button>
          </NavbarMenuItem>
        )}
      </NavbarMenu>
    </Navbar>
  );
}
