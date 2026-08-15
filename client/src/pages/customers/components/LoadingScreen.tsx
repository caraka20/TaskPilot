import { Skeleton } from "@heroui/react";

function SkeletonLine({ className }: { className: string }) {
  return <Skeleton className={`rounded-lg ${className}`} />;
}

export default function LoadingScreen({
  label = "Memuat detail customer...",
}: {
  label?: string;
}) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="w-full space-y-3 pb-6"
      role="status"
    >
      <span className="sr-only">{label}</span>

      <section className="overflow-hidden rounded-[26px] bg-[linear-gradient(120deg,#123653_0%,#174d68_58%,#14736f_125%)] px-4 py-4 shadow-[0_14px_34px_rgba(15,46,68,.16)] sm:px-5 sm:py-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(220px,.9fr)_minmax(460px,1.35fr)] lg:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="h-12 w-12 shrink-0 rounded-2xl bg-white/15" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonLine className="h-3 w-28 bg-white/15" />
              <SkeletonLine className="h-7 w-48 max-w-full bg-white/20" />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {[0, 1].map((item) => (
              <div
                className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-white/15 bg-white/[.08] px-4"
                key={item}
              >
                <Skeleton className="h-10 w-10 shrink-0 rounded-xl bg-white/15" />
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonLine className="h-2.5 w-16 bg-white/15" />
                  <SkeletonLine className="h-5 w-32 max-w-full bg-white/20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[22px] border border-default-200/70 bg-content1 shadow-[0_8px_24px_rgba(15,23,42,.05)]">
        <div className="flex items-center justify-between gap-4 border-b border-default-200/70 px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="space-y-2">
              <SkeletonLine className="h-4 w-36" />
              <SkeletonLine className="h-3 w-60 max-w-[58vw]" />
            </div>
          </div>
          <Skeleton className="hidden h-9 w-28 rounded-xl sm:block" />
        </div>

        <div className="p-3 sm:p-4">
          <div className="mb-3 flex gap-2 overflow-hidden">
            {["w-20", "w-16", "w-16", "w-16", "w-16"].map((width, index) => (
              <Skeleton className={`h-9 shrink-0 rounded-xl ${width}`} key={index} />
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-default-200/70">
            <div className="grid grid-cols-[minmax(150px,1.5fr)_repeat(4,minmax(76px,.7fr))] gap-px bg-default-200/70">
              {["w-24", "w-8", "w-8", "w-8", "w-8"].map((width, index) => (
                <div className="bg-primary/10 px-3 py-3" key={index}>
                  <SkeletonLine className={`h-4 ${width}`} />
                </div>
              ))}
              {[0, 1].flatMap((row) =>
                [0, 1, 2, 3, 4].map((column) => (
                  <div className="min-h-14 bg-content1 px-3 py-3" key={`${row}-${column}`}>
                    <SkeletonLine className={column === 0 ? "h-4 w-32" : "mx-auto h-8 w-12 rounded-xl"} />
                  </div>
                )),
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 xl:grid-cols-[1fr_1.25fr]">
        <section className="rounded-[22px] border border-default-200/70 bg-content1 p-4 shadow-[0_8px_24px_rgba(15,23,42,.05)] sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <SkeletonLine className="h-4 w-32" />
              <SkeletonLine className="h-3 w-48 max-w-[52vw]" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div className="rounded-xl bg-default-50 px-3 py-3" key={item}>
                <SkeletonLine className="h-3 w-20" />
                <SkeletonLine className="mt-2 h-5 w-32 max-w-full" />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[22px] border border-default-200/70 bg-content1 p-4 shadow-[0_8px_24px_rgba(15,23,42,.05)] sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-2">
                <SkeletonLine className="h-4 w-40" />
                <SkeletonLine className="h-3 w-52 max-w-[48vw]" />
              </div>
            </div>
            <Skeleton className="hidden h-9 w-28 rounded-xl sm:block" />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div className="rounded-xl bg-default-50 px-3 py-3" key={item}>
                <SkeletonLine className="h-3 w-20" />
                <SkeletonLine className="mt-2 h-6 w-28 max-w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-4 h-2 w-full rounded-full" />
        </section>
      </div>
    </div>
  );
}
