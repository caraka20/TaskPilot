// src/AppProviders.tsx
import React, { useEffect } from "react";
import { HeroUIProvider } from "@heroui/react"; // penting untuk komponen HeroUI
import { useThemeStore } from "./store/theme.store";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const { dark } = useThemeStore();   // boolean: true = dark, false = light

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", !!dark);               // <html class="dark">
    root.setAttribute("data-theme", dark ? "dark" : "light"); // beberapa lib baca ini

    // animasi halus (opsional)
    root.classList.add("theme-transition");
    const t = setTimeout(() => root.classList.remove("theme-transition"), 280);
    return () => clearTimeout(t);
  }, [dark]);

  return (
    <HeroUIProvider>       {/* Provider HeroUI */}
      <div className="theme-transition min-h-screen">
        {children}
      </div>
    </HeroUIProvider>
  );
}
