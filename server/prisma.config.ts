// prisma.config.ts
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "@prisma/config"; // <- ini yang stabil untuk tipe TS

// Paksa load .env dari root project saat file ini dieksekusi oleh Prisma CLI,
// baik dari ts-node, tsx, atau transpiled:
loadEnv({ path: path.resolve(process.cwd(), ".env") });
// fallback: kalau dijalankan dari folder yang beda
if (!process.env.DATABASE_URL) {
  loadEnv({ path: path.resolve(__dirname, ".env") });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  // @ts-expect-error: properti seed belum ditype resmi
  seed: {
    run: async () => {
      await import("./prisma/seed");
    },
  },
});
