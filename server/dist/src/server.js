"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const socket_io_1 = require("socket.io");
const node_cron_1 = __importDefault(require("node-cron"));
const auto_end_jam_kerja_1 = require("./utils/auto-end-jam-kerja");
// Setup HTTP Server
const server = http_1.default.createServer(app_1.default);
// Setup Socket.IO (export supaya bisa digunakan di service)
exports.io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
    }
});
// Jalankan CRON hanya saat bukan environment test
if (process.env.NODE_ENV !== 'test') {
    node_cron_1.default.schedule('0 * * * *', auto_end_jam_kerja_1.autoEndJamKerjaOverdue);
}
// Jalankan server hanya jika bukan import (misal: saat npx ts-node src/server.ts)
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
}
