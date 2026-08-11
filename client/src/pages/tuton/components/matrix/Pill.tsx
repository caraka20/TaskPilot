import { Button } from "@heroui/react";
import clsx from "clsx";

type Props = {
  active?: boolean;
  asGhost?: boolean;
  disabled?: boolean;
  title?: string;
  className?: string;
  children: React.ReactNode;
  /** Support BOTH — biar kompatibel */
  onPress?: () => void;
  onClick?: () => void;
};

export default function Pill({
  active = false,
  asGhost = false,
  disabled = false,
  title,
  className,
  children,
  onPress,
  onClick,
}: Props) {
  return (
    <Button
      size="sm"
      radius="full"
      title={title}
      isDisabled={disabled}
      variant={asGhost ? "flat" : "solid"}
      /** penting: dukung keduanya */
      onPress={onPress ?? onClick}
      className={clsx(
        "text-[12px] px-3 h-7",
        active
          ? "bg-blue-600 text-white"
          : "bg-default-200 text-foreground-700",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      {children}
    </Button>
  );
}
