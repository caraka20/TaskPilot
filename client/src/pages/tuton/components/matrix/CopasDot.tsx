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
        "absolute -right-2 -top-2 z-10",
        "inline-flex h-7 w-7 items-center justify-center rounded-full",
        "transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "h-3 w-3 rounded-full ring-2 ring-content1 shadow",
          active ? "bg-rose-600" : "bg-default-300",
        ].join(" ")}
      />
    </button>
  );
}
