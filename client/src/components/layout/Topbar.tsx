import {
  Navbar, NavbarBrand, NavbarContent, NavbarItem,
  Button, Chip
} from "@heroui/react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { useApi } from "../../hooks/useApi";
import { logout as logoutSvc } from "../../services/auth.service";
import React from "react";

// ⬇️ Tambahan import untuk status kerja di topbar
import { useWorkStore } from "../../store/work.store";
import { toHMS } from "../../utils/format";

function LinkItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-2 py-1 rounded-medium transition-colors ${isActive ? "bg-foreground-100 text-foreground-900" : "text-foreground-600 hover:text-foreground"}`
      }
    >
      {children}
    </NavLink>
  );
}

// ⬇️ Komponen kecil untuk chip status (AKTIF · 00:12:34 / JEDA / TIDAK AKTIF)
function StatusChipTopbar() {
  const { status, durasiDetik } = useWorkStore();
  const color: "success" | "warning" | "danger" | "default" =
    status === "AKTIF" ? "success" : status === "JEDA" ? "warning" : "danger";
  const label = status === "AKTIF" ? `AKTIF · ${toHMS(durasiDetik)}` : status;
  return <Chip size="sm" color={color} variant="flat">{label}</Chip>;
}

export default function Topbar() {
  const navigate = useNavigate();
  const api = useApi();
  const { token, role, username, reset } = useAuthStore();

  const isOwner = (role ?? "").toUpperCase() === "OWNER";

  async function onLogout() {
    try { await logoutSvc(api); } catch (e) { console.log(e); }
    reset();
    navigate("/login", { replace: true });
  }

  return (
    <Navbar maxWidth="full" isBordered className="backdrop-blur bg-background/70">
      <NavbarBrand className="gap-2">
        <span className="font-semibold tracking-tight">UT Assist</span>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex" justify="start">
        <NavbarItem><LinkItem to="/dashboard">Dashboard</LinkItem></NavbarItem>
        <NavbarItem><LinkItem to="/customers">Customers</LinkItem></NavbarItem>
        <NavbarItem><LinkItem to="/courses/bulk-status">Bulk Status</LinkItem></NavbarItem>
        <NavbarItem><LinkItem to="/courses/bulk-nilai">Bulk Nilai</LinkItem></NavbarItem>
        <NavbarItem><LinkItem to="/courses/conflicts">Conflicts</LinkItem></NavbarItem>
        {isOwner && <NavbarItem><LinkItem to="/users">Users</LinkItem></NavbarItem>}
        <NavbarItem><LinkItem to="/settings">Settings</LinkItem></NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end" className="items-center gap-2">
        {token ? (
          <>
            {/* ⬇️ Tambahan: status kerja user tampil di topbar */}
            <StatusChipTopbar />

            <Chip size="sm" variant="flat">{(role || "NO-ROLE").toString()}</Chip>
            <Chip size="sm" variant="flat" className="max-w-[160px] truncate">{(username || "unknown").toString()}</Chip>
            <Button size="sm" variant="flat" onPress={onLogout}>Logout</Button>
          </>
        ) : (
          <Button size="sm" color="primary" as={NavLink} to="/login">Login</Button>
        )}
      </NavbarContent>
    </Navbar>
  );
}
