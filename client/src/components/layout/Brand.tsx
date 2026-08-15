// src/components/layout/Brand.tsx
import { Link } from "@heroui/react";
import { NavLink } from "react-router-dom";

export default function Brand() {
  return (
    <Link
      as={NavLink}
      to="/"
      className="group flex min-h-11 items-center gap-3 rounded-xl px-1 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      aria-label="ARTECH – Beranda"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/85 shadow-sm ring-1 ring-slate-200/70 dark:bg-white/10 dark:ring-white/10">
        <img alt="" aria-hidden="true" className="h-8 w-8 object-contain dark:invert" src="/brand/logo-dark.png" />
      </span>
      <span className="text-xl font-extrabold leading-none tracking-[0.04em] text-slate-950 dark:text-white">ARTECH</span>
    </Link>
  );
}
