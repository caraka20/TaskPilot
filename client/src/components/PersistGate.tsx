import { usePersistReady } from "../hooks/usePersistReady";
import { Spinner } from "@heroui/react";

export default function PersistGate({ children }: { children: React.ReactNode }) {
  const ready = usePersistReady();
  if (!ready) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Spinner label="Memuat konfigurasi..." />
      </div>
    );
  }
  return <>{children}</>;
}