// src/hero.ts
import { heroui } from "@heroui/react";

/** Plugin HeroUI untuk Tailwind v4.
 *  Dipanggil dari @plugin "./hero.ts" di index.css
 */
export default heroui({
  themes: {
    light: {},
    dark: {},
  },
});
