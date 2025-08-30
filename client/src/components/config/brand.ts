// src/config/brand.ts
export const BRAND = {
  // bisa diganti via env: VITE_APP_NAME, VITE_APP_TAGLINE, VITE_BRAND_COLOR
  name: (import.meta.env.VITE_APP_NAME ?? "ARTECTH JOKI").trim(),
  tagline: (import.meta.env.VITE_APP_TAGLINE ?? "").trim(),

  // path ke file logo di public/
  logo: {
    light: "/brand/logo-light.png",
    dark: "/brand/logo-dark.png",
    square: "/brand/logo-square.png",
  },

  // warna aksen brand (untuk gradient/pill)
  color: (import.meta.env.VITE_BRAND_COLOR ?? "#ff7a00").trim(),
} as const;

export type BrandConfig = typeof BRAND;
