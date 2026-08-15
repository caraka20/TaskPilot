type Props = {
  active?: boolean;
  title?: string;
  onClick?: () => void;
};

export default function CopasDot({ active = false, title, onClick }: Props) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title ?? "Tandai sebagai copas"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.();
      }}
      className={[
        "absolute -right-1.5 -top-1.5 z-10",
        "inline-flex h-5 w-5 items-center justify-center rounded-full",
        "transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "h-2.5 w-2.5 rounded-full ring-2 ring-white shadow dark:ring-slate-900",
          active ? "bg-rose-500" : "bg-slate-300 dark:bg-slate-600",
        ].join(" ")}
      />
    </button>
  );
}
