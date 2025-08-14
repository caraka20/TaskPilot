import { defineConfig } from '@prisma/config';

export default defineConfig({
  // @ts-expect-error karena `seed` belum resmi di type
  seed: {
    run: async () => {
      await import('./prisma/seed'); // sesuaikan path seed.ts
    },
  },
});
