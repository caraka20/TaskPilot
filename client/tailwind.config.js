/** @type {import('tailwindcss').Config} */
// Pakai HeroUI (sesuai paket yang kamu pakai sekarang)
import { heroui } from "@heroui/react";

// Jika masih pakai NextUI lama, ganti ke:
// import { nextui } from "@nextui-org/react";

export default {
  darkMode: "class", // ⬅️ Wajib. Toggle <html class="dark">
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",

    // Pastikan path tema HeroUI discan Tailwind:
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",

    // (Opsional) Kalau paket nextui masih terpasang:
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#4F46E5" },
        success: { DEFAULT: "#10B981" },
        warning: { DEFAULT: "#F59E0B" },
        danger:  { DEFAULT: "#F43F5E" },
      },
      borderRadius: { "2xl": "1rem" },
      transitionTimingFunction: {
        "spring-out": "cubic-bezier(.2,.8,.2,1)",
      },
    },
  },
  plugins: [heroui()], // atau: [nextui()]
};

