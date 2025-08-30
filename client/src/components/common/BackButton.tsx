// client/src/components/common/BackButton.tsx
import { Button, type ButtonProps, Tooltip } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import type { To } from "react-router-dom";
import { useNavigate } from "react-router-dom";

type Tone = "sky" | "indigo" | "violet" | "emerald" | "amber" | "rose" | "slate";

type Props = {
  /** Arah kembali, default: -1 (history back) */
  to?: To | number;
  /** Teks tombol, default: "Kembali" */
  label?: string;
  /** Kelas tambahan untuk <Button> */
  className?: string;
  /** Variant heroui (light/flat/solid/faded/bordered/ghost) */
  variant?: ButtonProps["variant"];
  /** Ukuran tombol (sm/md/lg) */
  size?: ButtonProps["size"];
  /** Handler custom, override navigate */
  onPress?: () => void;
  /** Warna aksen untuk gelembung ikon (gradien) */
  tone?: Tone;
  /** Hanya ikon (tanpa label). Aksesibel via aria-label/tooltip. */
  iconOnly?: boolean;
  /** Tooltip saat hover */
  tooltip?: string;
};

export default function BackButton({
  to = -1,
  label = "Kembali",
  className,
  variant = "flat",
  size = "md",
  onPress,
  tone = "sky",
  iconOnly = false,
  tooltip,
}: Props) {
  const navigate = useNavigate();

  const goBack = () => {
    if (onPress) return onPress();
    if (typeof to === "number") navigate(to);
    else navigate(to);
  };

  const gradient = getToneGradient(tone);

  // ukuran konsisten untuk kapsul & ikon
  const sizeMap = {
    sm: { btn: "h-8 pl-2 pr-3 text-sm", bubble: "h-6 w-6", icon: "h-3.5 w-3.5" },
    md: { btn: "h-9 pl-2 pr-3",         bubble: "h-6 w-6", icon: "h-3.5 w-3.5" },
    lg: { btn: "h-10 pl-2.5 pr-3.5",    bubble: "h-7 w-7", icon: "h-4 w-4" },
  } as const;

  const sz = sizeMap[size ?? "md"];

  const coreBtnCls =
    "group rounded-full border border-slate-200 bg-white shadow-sm " +
    "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-slate-300/70 transition-all " +
    sz.btn;

  const bubbleCls =
    `${gradient.base} ${gradient.hover} inline-flex ${sz.bubble} items-center justify-center ` +
    "rounded-full ring-1 ring-inset ring-slate-200 transition-colors";

  const content = (
    <Button
      variant={variant}
      size={size}
      onPress={goBack}
      className={[coreBtnCls, className].filter(Boolean).join(" ")}
      startContent={
        <span className={bubbleCls}>
          <ArrowLeft className={sz.icon} />
        </span>
      }
      aria-label={iconOnly ? label : undefined}
    >
      {iconOnly ? <span className="sr-only">{label}</span> : (
        <span className="text-slate-700 group-hover:text-slate-900">{label}</span>
      )}
    </Button>
  );

  // Tooltip opsional (cocok untuk iconOnly)
  return tooltip || iconOnly ? <Tooltip content={tooltip ?? label}>{content}</Tooltip> : content;
}

/* ==================== Utils ==================== */

function getToneGradient(tone: Tone) {
  switch (tone) {
    case "indigo":
      return { base: "bg-gradient-to-br from-indigo-100 to-violet-100", hover: "group-hover:from-indigo-200 group-hover:to-violet-200" };
    case "violet":
      return { base: "bg-gradient-to-br from-violet-100 to-fuchsia-100", hover: "group-hover:from-violet-200 group-hover:to-fuchsia-200" };
    case "emerald":
      return { base: "bg-gradient-to-br from-emerald-100 to-teal-100", hover: "group-hover:from-emerald-200 group-hover:to-teal-200" };
    case "amber":
      return { base: "bg-gradient-to-br from-amber-100 to-orange-100", hover: "group-hover:from-amber-200 group-hover:to-orange-200" };
    case "rose":
      return { base: "bg-gradient-to-br from-rose-100 to-pink-100", hover: "group-hover:from-rose-200 group-hover:to-pink-200" };
    case "slate":
      return { base: "bg-gradient-to-br from-slate-100 to-zinc-100", hover: "group-hover:from-slate-200 group-hover:to-zinc-200" };
    case "sky":
    default:
      return { base: "bg-gradient-to-br from-sky-100 to-indigo-100", hover: "group-hover:from-sky-200 group-hover:to-indigo-200" };
  }
}
