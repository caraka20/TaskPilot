export type OperationalModalSize = "form" | "wide" | "workspace";

const modalSizeClasses: Record<OperationalModalSize, string> = {
  form:
    "sm:h-auto sm:min-h-[30rem] sm:max-h-[84dvh] sm:w-[48rem] sm:max-w-[94vw]",
  wide:
    "sm:h-[88dvh] sm:max-h-[88dvh] sm:w-[70rem] sm:max-w-[94vw]",
  workspace:
    "sm:h-[94dvh] sm:max-h-[94dvh] sm:w-[96vw] sm:max-w-[96vw]",
};

/** Slot classes untuk modal HeroUI dengan ukuran yang sesuai konteks. */
export function getOperationalModalClassNames(size: OperationalModalSize = "workspace") {
  return {
  wrapper:
    "z-[2200] items-stretch justify-stretch p-0 sm:items-center sm:justify-center sm:p-5",
  backdrop: "bg-slate-950/58 backdrop-blur-[6px]",
  base:
    `relative isolate m-0 flex h-dvh max-h-dvh w-screen max-w-none flex-col overflow-hidden rounded-none border-0 bg-content1 text-foreground shadow-[0_32px_100px_-24px_rgba(2,12,27,.55)] before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:z-30 before:w-1 before:bg-gradient-to-b before:from-indigo-500 before:via-sky-500 before:to-emerald-400 sm:rounded-[1.75rem] sm:border sm:border-white/70 dark:sm:border-slate-700/80 ${modalSizeClasses[size]}`,
  header:
    "sticky top-0 z-20 shrink-0 border-b border-slate-200/70 bg-white/94 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] pr-16 backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-950/94 sm:px-7 sm:py-5 sm:pr-20",
  body:
    "min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_100%_0%,rgba(99,102,241,.07),transparent_25rem)] bg-slate-50/80 px-4 py-5 dark:bg-[radial-gradient(circle_at_100%_0%,rgba(99,102,241,.11),transparent_28rem)] dark:bg-slate-950 sm:px-7 sm:py-6",
  footer:
    "sticky bottom-0 z-20 shrink-0 border-t border-slate-200/70 bg-white/92 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-14px_40px_-32px_rgba(15,23,42,.5)] backdrop-blur-2xl dark:border-slate-800 dark:bg-slate-950/92 sm:px-7 sm:py-4",
  closeButton:
    "right-3 top-[max(.75rem,env(safe-area-inset-top))] z-40 grid h-11 w-11 place-items-center rounded-2xl bg-slate-100/90 text-slate-500 shadow-sm ring-1 ring-slate-200/80 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-50 hover:text-indigo-700 hover:ring-indigo-200 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-200 sm:right-5 sm:top-5",
  } as const;
}

/** Backward compatible untuk modal tabel/editor lama yang memang butuh ruang penuh. */
export const operationalModalClassNames = getOperationalModalClassNames("workspace");
