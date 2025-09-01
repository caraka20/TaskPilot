// src/components/layout/Brand.tsx
import { Link } from "@heroui/react";
import { NavLink } from "react-router-dom";

export default function Brand() {
  return (
    <Link
      as={NavLink}
      to="/"
      className="flex items-center gap-2 group select-none"
      aria-label="ARTECH – Home"
    >
      <span
        className="text-xl md:text-2xl font-extrabold tracking-tight leading-none
                   bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500
                   bg-clip-text text-transparent drop-shadow-sm
                   transition-all duration-300 group-hover:tracking-widest"
      >
        ARTECH
      </span>
    </Link>
  );
}
