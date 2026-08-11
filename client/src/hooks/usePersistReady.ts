import { useEffect, useState } from "react";
import { useAuthStore } from "../store/auth.store";

/**
 * Hook untuk mengetahui kapan Zustand Persist SELESAI hydrate dari storage.
 * Menggunakan API `.persist.hasHydrated()` dan `.persist.onFinishHydration()`.
 */
export function usePersistReady() {
  const [ready, setReady] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (ready) return;
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setReady(true);
    });
    return () => {
      unsub?.();
    };
  }, [ready]);

  return ready;
}