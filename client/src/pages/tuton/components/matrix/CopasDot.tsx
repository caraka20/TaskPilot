import React from "react";

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
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.();
      }}
      className={[
        "absolute top-0 right-0 translate-x-1/4 -translate-y-1/4",
        "h-3 w-3 rounded-full ring-2 ring-white shadow",
        active ? "bg-rose-600" : "bg-default-300",
        "hover:scale-[1.05] transition-transform",
        "z-10",
      ].join(" ")}
    />
  );
}
