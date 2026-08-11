import './config/env'
import http from 'http'
import app from './app'
import { Server } from 'socket.io'
import cron from 'node-cron'
import { autoEndJamKerjaOverdue } from './utils/auto-end-jam-kerja'
import { assertRuntimeEnv } from './config/env'
import { prismaClient } from './config/database'

// Setup HTTP Server
const server = http.createServer(app)

// Setup Socket.IO (export supaya bisa digunakan di service)
export const io = new Server(server, {
  cors: {
    origin: '*',
  }
})

let cronTask: ReturnType<typeof cron.schedule> | undefined

export async function startServer(): Promise<void> {
  assertRuntimeEnv()

  // Jangan tampilkan server sebagai "aktif" sebelum database benar-benar siap.
  await prismaClient.$connect()

  if (process.env.NODE_ENV !== 'test') {
    cronTask = cron.schedule('0 * * * *', autoEndJamKerjaOverdue)
  }

  const port = Number(process.env.PORT || 3000)

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('PORT harus berupa angka antara 1 dan 65535')
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://localhost:${port}`)
    console.log('✅ Database connected')
  })
}

async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} diterima, server dihentikan...`)
  cronTask?.stop()

  if (server.listening) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }

  await prismaClient.$disconnect()
}

// Jalankan server hanya jika bukan import (misal: saat npx ts-node src/server.ts)
if (require.main === module) {
  startServer().catch(async (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`❌ Server gagal dimulai: ${message}`)
    await prismaClient.$disconnect().catch(() => undefined)
    process.exitCode = 1
  })

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      shutdown(signal)
        .then(() => process.exit(0))
        .catch((error: unknown) => {
          console.error('❌ Gagal menghentikan server:', error)
          process.exit(1)
        })
    })
  }
}
