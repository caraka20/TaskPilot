"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Layers3, X } from "lucide-react";

const modalSizeClass = {
  sm: "sm:h-auto sm:max-h-[78dvh] sm:w-[32rem] sm:max-w-[calc(100vw-2rem)]",
  md: "sm:h-auto sm:max-h-[90dvh] sm:w-[48rem] sm:max-w-[calc(100vw-2rem)]",
  lg: "sm:h-[90dvh] sm:max-h-[90dvh] sm:w-[72rem] sm:max-w-[calc(100vw-2rem)]",
  xl: "sm:h-[94dvh] sm:max-h-[94dvh] sm:w-[96vw] sm:max-w-[90rem]",
} as const;

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  size = "md",
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((element) => !element.hasAttribute("hidden") && element.offsetParent !== null);
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    const focusFrame = window.requestAnimationFrame(() => {
      const initialTarget = dialogRef.current?.querySelector<HTMLElement>(
        '[autofocus], .attendance-operational-modal-body input:not([disabled]), .attendance-operational-modal-body select:not([disabled]), .attendance-operational-modal-body textarea:not([disabled]), .attendance-operational-modal-body button:not([disabled])'
      );
      (initialTarget ?? dialogRef.current)?.focus();
    });
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;

  const modal = (
    <div
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-slate-950/60 p-0 backdrop-blur-[7px] sm:p-4"
      role="dialog"
      onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        data-size={size}
        className={`attendance-operational-modal relative isolate mx-auto flex h-dvh max-h-dvh w-screen max-w-none flex-col overflow-hidden bg-white text-slate-900 shadow-[0_36px_110px_-30px_rgba(2,12,27,.72)] outline-none before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:z-30 before:w-1 before:bg-gradient-to-b before:from-indigo-500 before:via-sky-500 before:to-emerald-400 dark:bg-slate-950 dark:text-slate-100 sm:rounded-[1.5rem] sm:border sm:border-white/80 dark:sm:border-slate-700/80 ${modalSizeClass[size]}`}
      >
        <div className="relative flex shrink-0 items-start justify-between gap-4 overflow-hidden border-b border-slate-200/70 bg-white/94 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-950/94 sm:px-7 sm:py-5">
          <div className="pointer-events-none absolute -right-20 -top-28 h-56 w-56 rounded-full bg-indigo-100/75 blur-3xl dark:bg-indigo-500/10" />
          <div className="relative flex min-w-0 gap-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#102a4c] text-sky-200 shadow-[0_10px_28px_-14px_rgba(15,42,76,.9)] ring-1 ring-white/10 dark:bg-indigo-500/15 dark:text-indigo-200"><Layers3 size={18} /></span>
            <div className="min-w-0">
              <p className="mb-1 text-[9px] font-black uppercase tracking-[.2em] text-indigo-500 dark:text-indigo-300">ARTECH workspace</p>
              <h2 id={titleId} className="text-lg font-black tracking-tight text-slate-950 dark:text-white sm:text-xl">{title}</h2>
              {description ? <p id={descriptionId} className="mt-1 max-w-4xl text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p> : null}
            </div>
          </div>
          <button
            aria-label="Tutup"
            className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100/90 text-slate-500 shadow-sm ring-1 ring-slate-200/80 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-50 hover:text-indigo-700 hover:ring-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-200"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <div className="attendance-operational-modal-body min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_100%_0%,rgba(99,102,241,.07),transparent_25rem)] bg-slate-50/80 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:bg-[radial-gradient(circle_at_100%_0%,rgba(99,102,241,.11),transparent_28rem)] dark:bg-slate-950 sm:p-7">{children}</div>
      </div>
    </div>
  );

  // Wajib dipasang langsung ke body. App shell memakai overflow/animation;
  // tanpa portal, fixed overlay menjadi terpotong oleh area konten dan sidebar.
  return createPortal(modal, document.body);
}
