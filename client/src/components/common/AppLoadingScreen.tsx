type AppLoadingScreenProps = {
  label?: string;
  description?: string;
  fullScreen?: boolean;
  compact?: boolean;
};

export default function AppLoadingScreen({
  label = "Menyiapkan halaman",
  description = "Menghubungkan data dan menata workspace Anda.",
  fullScreen = false,
  compact = false,
}: AppLoadingScreenProps) {
  if (fullScreen) {
    return (
      <div
        className="app-loading-shell app-loading-shell-full fixed inset-0 z-[200] grid min-h-dvh w-screen place-items-center overflow-hidden px-5 py-10 sm:px-8 lg:px-12"
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        <div aria-hidden="true" className="app-loading-grid absolute inset-0" />
        <div aria-hidden="true" className="app-loading-glow app-loading-glow-one" />
        <div aria-hidden="true" className="app-loading-glow app-loading-glow-two" />

        <div className="relative mx-auto grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
          <div className="flex justify-center lg:justify-end">
            <div className="relative grid h-40 w-40 place-items-center sm:h-48 sm:w-48">
              <span aria-hidden="true" className="app-loading-orbit absolute inset-0 rounded-[44px]" />
              <span aria-hidden="true" className="app-loading-orbit app-loading-orbit-reverse absolute inset-4 rounded-[36px]" />
              <span className="app-loading-logo grid h-28 w-28 place-items-center rounded-[32px] border border-white/90 bg-white shadow-[0_26px_70px_rgba(15,23,42,.16)] dark:border-white/10 dark:bg-slate-900 sm:h-32 sm:w-32">
                <img
                  alt=""
                  aria-hidden="true"
                  className="h-20 w-20 object-contain dark:invert sm:h-24 sm:w-24"
                  src="/brand/logo-dark.png"
                />
              </span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#1b5278] shadow-sm backdrop-blur dark:border-sky-400/15 dark:bg-slate-900/60 dark:text-sky-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.12)]" />
              ARTECH Workspace
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-[-0.035em] text-slate-950 dark:text-white sm:text-4xl lg:text-[44px] lg:leading-[1.08]">
              {label}
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base sm:leading-7 lg:mx-0">
              {description}
            </p>

            <div className="mt-8 flex items-center gap-4">
              <div className="app-loading-progress h-2 flex-1 overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-700/70">
                <span className="block h-full w-2/5 rounded-full bg-[linear-gradient(90deg,#1b4f75,#0ea5a4,#1b4f75)]" />
              </div>
              <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Memuat
              </span>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 lg:justify-start" aria-hidden="true">
              <span className="app-loading-dot h-1.5 w-1.5 rounded-full bg-[#1b5278]" />
              <span className="app-loading-dot h-1.5 w-1.5 rounded-full bg-cyan-500" />
              <span className="app-loading-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>

        <p className="absolute bottom-6 left-0 right-0 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400/90">
          Sistem operasional terintegrasi
        </p>
      </div>
    );
  }

  const height = compact ? "min-h-64" : "min-h-[50dvh]";

  return (
    <div
      className={`app-loading-shell relative grid ${height} w-full place-items-center overflow-hidden px-5 py-10`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div aria-hidden="true" className="app-loading-glow app-loading-glow-one" />
      <div aria-hidden="true" className="app-loading-glow app-loading-glow-two" />

      <div className={`app-loading-card relative w-full text-center ${compact ? "max-w-sm px-6 py-7" : "max-w-md px-7 py-9 sm:px-10"}`}>
        <div className="relative mx-auto grid h-24 w-24 place-items-center">
          <span aria-hidden="true" className="app-loading-orbit absolute inset-0 rounded-[30px]" />
          <span aria-hidden="true" className="app-loading-orbit app-loading-orbit-reverse absolute inset-2 rounded-[24px]" />
          <span className="app-loading-logo grid h-16 w-16 place-items-center rounded-[22px] border border-white/80 bg-white shadow-[0_14px_35px_rgba(15,23,42,.14)] dark:border-white/10 dark:bg-slate-900">
            <img
              alt=""
              aria-hidden="true"
              className="h-11 w-11 object-contain dark:invert"
              src="/brand/logo-dark.png"
            />
          </span>
        </div>

        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.24em] text-[#1b5278] dark:text-sky-300">
          ARTECH Workspace
        </p>
        <h2 className="mt-2 text-base font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-lg">
          {label}
        </h2>
        {!compact ? (
          <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : null}

        <div className="app-loading-progress mx-auto mt-6 h-1.5 max-w-[220px] overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/70">
          <span className="block h-full w-2/5 rounded-full bg-[linear-gradient(90deg,#1b4f75,#0ea5a4,#1b4f75)]" />
        </div>
      </div>
    </div>
  );
}
