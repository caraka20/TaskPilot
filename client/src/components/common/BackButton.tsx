import { Button } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import type { To } from "react-router-dom";
import { useNavigate } from "react-router-dom";

type Props = {
  to?: To | number;                   // default: -1 (kembali ke halaman sebelumnya)
  label?: string;                     // default: "Kembali"
  className?: string;
  variant?: "light" | "flat" | "ghost" | "faded" | "solid" | "bordered";
};

export default function BackButton({
  to = -1,
  label = "Kembali",
  className,
  variant = "light",
}: Props) {
  const navigate = useNavigate();
  const goBack = () => {
    if (typeof to === "number") navigate(to);
    else navigate(to);
  };
  return (
    <Button
      variant={variant}
      startContent={<ArrowLeft className="w-4 h-4" />}
      onPress={goBack}
      className={className}
    >
      {label}
    </Button>
  );
}
