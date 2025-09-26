// client/src/pages/customers/components/LoadingScreen.tsx
import { Spinner } from "@heroui/react";

export default function LoadingScreen({ label = "Memuat..." }: { label?: string }) {
  return (
    <div className="mx-auto flex h-[60vh] max-w-6xl items-center justify-center px-3 md:px-6">
      <Spinner label={label} />
    </div>
  );
}
