import http from 'http'
import app from './app'
import { Server } from 'socket.io'
import cron from 'node-cron'
import { autoEndJamKerjaOverdue } from './utils/auto-end-jam-kerja'

// Setup HTTP Server
const server = http.createServer(app)

// Setup Socket.IO (export supaya bisa digunakan di service)
export const io = new Server(server, {
  cors: {
    origin: '*',
  }
})

// Jalankan CRON hanya saat bukan environment test
if (process.env.NODE_ENV !== 'test') {
  cron.schedule('0 * * * *', autoEndJamKerjaOverdue)
}

// Jalankan server hanya jika bukan import (misal: saat npx ts-node src/server.ts)
if (require.main === module) {
  const PORT = process.env.PORT || 3000
  server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`)
  })
}
