import { existsSync } from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

const envFileName = process.env.NODE_ENV === 'test' ? '.env.test' : '.env'

const envCandidates = [
  path.resolve(process.cwd(), envFileName),
  path.resolve(__dirname, '..', '..', envFileName),
  path.resolve(__dirname, '..', '..', '..', envFileName),
]

for (const envPath of new Set(envCandidates)) {
  if (!existsSync(envPath)) continue

  loadEnv({
    path: envPath,
    override: false,
    quiet: true,
  })
  break
}

const REQUIRED_ENV_KEYS = ['DATABASE_URL', 'JWT_SECRET_KEY'] as const

export function assertRuntimeEnv(): void {
  const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !process.env[key]?.trim())

  if (missingKeys.length > 0) {
    throw new Error(
      `Konfigurasi server belum lengkap: ${missingKeys.join(', ')}. ` +
        'Salin .env.example menjadi .env lalu isi nilainya.',
    )
  }
}

export function getRequiredEnv(key: (typeof REQUIRED_ENV_KEYS)[number]): string {
  const value = process.env[key]?.trim()

  if (!value) {
    throw new Error(
      `${key} belum diatur. Salin .env.example menjadi .env lalu isi nilainya.`,
    )
  }

  return value
}
