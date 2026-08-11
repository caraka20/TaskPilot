// src/components/layout/Brand.tsx
import { Link } from "@heroui/react";
import { NavLink } from "react-router-dom";

export default function Brand() {
  return (
    <Link
      as={NavLink}
      to="/"
      className="group flex min-h-11 items-center gap-3 rounded-xl px-1 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      aria-label="TaskPilot – Beranda"
    >
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-sm font-black text-white shadow-lg shadow-indigo-500/20">TP</span>
      <span className="text-xl font-extrabold leading-none tracking-tight text-slate-950 dark:text-white">TaskPilot</span>
    </Link>
  );
}
