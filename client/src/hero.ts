// src/hero.ts
import { heroui } from "@heroui/react";

/** Plugin HeroUI untuk Tailwind v4.
 *  Dipanggil dari @plugin "./hero.ts" di index.css
 */
export default heroui({
  layout: {
    radius: {
      small: "0.625rem",
      medium: "0.875rem",
      large: "1rem",
    },
    borderWidth: {
      small: "1px",
      medium: "1px",
      large: "2px",
    },
    disabledOpacity: "0.48",
    hoverOpacity: "0.92",
  },
  themes: {
    light: {
      colors: {
        background: "#f7f8fc",
        foreground: "#172033",
        divider: "#dce2ec",
        focus: "#5b5ce2",
        content1: "#ffffff",
        content2: "#f1f3f9",
        content3: "#e8ecf5",
        content4: "#dde3ef",
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#5b5ce2",
          600: "#4f46d2",
          700: "#4338b8",
          800: "#373095",
          900: "#302e76",
          DEFAULT: "#5b5ce2",
          foreground: "#ffffff",
        },
        secondary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          DEFAULT: "#8b5cf6",
          foreground: "#ffffff",
        },
        success: { DEFAULT: "#0f9f7f", foreground: "#ffffff" },
        warning: { DEFAULT: "#d98207", foreground: "#231505" },
        danger: { DEFAULT: "#e54868", foreground: "#ffffff" },
      },
    },
    dark: {
      colors: {
        background: "#080d19",
        foreground: "#e8edf7",
        divider: "#263247",
        focus: "#8b9aff",
        content1: "#101827",
        content2: "#162033",
        content3: "#202b3e",
        content4: "#2a374b",
        primary: {
          50: "#171936",
          100: "#20234d",
          200: "#2d3267",
          300: "#434a8b",
          400: "#626bd0",
          500: "#818cf8",
          600: "#9aa5ff",
          700: "#b4bcff",
          800: "#cdd2ff",
          900: "#e3e6ff",
          DEFAULT: "#818cf8",
          foreground: "#080d19",
        },
        secondary: { DEFAULT: "#a78bfa", foreground: "#0b0e19" },
        success: { DEFAULT: "#34d399", foreground: "#071813" },
        warning: { DEFAULT: "#fbbf24", foreground: "#211502" },
        danger: { DEFAULT: "#fb7185", foreground: "#25070e" },
      },
    },
  },
});
