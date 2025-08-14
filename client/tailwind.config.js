/** @type {import('tailwindcss').Config} */
import { nextui } from "@nextui-org/theme";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#4F46E5" },
        success: { DEFAULT: "#10B981" },
        warning: { DEFAULT: "#F59E0B" },
        danger: { DEFAULT: "#F43F5E" },
      },
      borderRadius: { "2xl": "1rem" },
    },
  },
  darkMode: "class",
  plugins: [nextui()],
};
