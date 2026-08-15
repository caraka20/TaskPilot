import { usePersistReady } from "../hooks/usePersistReady";
import AppLoadingScreen from "./common/AppLoadingScreen";

export default function PersistGate({ children }: { children: React.ReactNode }) {
  const ready = usePersistReady();
  if (!ready) {
    return <AppLoadingScreen fullScreen label="Menyiapkan preferensi" description="Menerapkan sesi, tema, dan konfigurasi lokal Anda." />;
  }
  return <>{children}</>;
}
