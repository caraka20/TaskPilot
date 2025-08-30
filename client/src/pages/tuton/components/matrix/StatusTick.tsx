type Props = { active?: boolean; title?: string };

export default function StatusTick({ active, title }: Props) {
  if (!active) return null;
  return (
    <span
      title={title ?? "Selesai"}
      className="pointer-events-none absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 shadow ring-1 ring-emerald-600"
    >
      <svg viewBox="0 0 20 20" className="h-3 w-3 text-white">
        <path fill="currentColor" d="M7.5 13.5L3.8 9.8l1.4-1.4 2.3 2.3 6.3-6.3 1.4 1.4-7.7 7.7z" />
      </svg>
    </span>
  );
}
