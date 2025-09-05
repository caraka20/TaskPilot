"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.route = void 0;
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../generated/prisma");
const auth_middleware_1 = require("../middleware/auth-middleware");
const require_role_1 = require("../middleware/require-role");
const user_controller_1 = require("../app/user/user.controller");
const gaji_controller_1 = require("../app/gaji/gaji.controller");
const jam_kerja_controller_1 = require("../app/jam-kerja/jam-kerja.controller");
const konfigurasi_controller_1 = require("../app/konfigurasi/konfigurasi.controller");
const dashboard_controller_1 = __importDefault(require("../app/dashboard/dashboard.controller"));
const customer_controller_1 = require("../app/customer/customer.controller");
const tuton_controller_1 = __importDefault(require("../app/tuton/tuton.controller"));
const karil_controller_1 = require("../app/karil/karil.controller");
const tuton_item_controller_1 = __importDefault(require("../app/tuton-item/tuton-item.controller"));
exports.route = express_1.default.Router();
// HEALTH
exports.route.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
// USER
exports.route.post("/api/users/login", user_controller_1.UserController.login);
exports.route.post("/api/users/register", auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER), user_controller_1.UserController.register);
exports.route.get("/api/users", auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER), user_controller_1.UserController.getAllUsers);
exports.route.get("/api/users/:username/everything", auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), user_controller_1.UserController.getUserEverything);
exports.route.get("/api/users/:username", auth_middleware_1.authMiddleware, user_controller_1.UserController.getUserDetail);
exports.route.patch("/api/users/:username/jeda-otomatis", auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER), user_controller_1.UserController.setJedaOtomatisUser);
exports.route.post("/api/users/logout", auth_middleware_1.authMiddleware, user_controller_1.UserController.logout);
// GAJI
exports.route.post('/api/gaji', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER), gaji_controller_1.GajiController.createGaji);
exports.route.get('/api/gaji', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER), gaji_controller_1.GajiController.getAllGaji);
exports.route.patch('/api/gaji/:id', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER), gaji_controller_1.GajiController.updateGaji);
exports.route.delete('/api/gaji/:id', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER), gaji_controller_1.GajiController.deleteGaji);
exports.route.get('/api/gaji/me', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.USER), gaji_controller_1.GajiController.getMyGaji);
exports.route.get('/api/gaji/me/summary', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.USER), gaji_controller_1.GajiController.getMySummary);
// ✅ NEW: Ringkasan gaji untuk OWNER
exports.route.get('/api/gaji/summary', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER), gaji_controller_1.GajiController.getSummary);
// JAM KERJA
exports.route.post('/api/jam-kerja/start', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.USER, prisma_1.Role.OWNER), jam_kerja_controller_1.JamKerjaController.start);
exports.route.patch('/api/jam-kerja/:id/end', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.USER, prisma_1.Role.OWNER), jam_kerja_controller_1.JamKerjaController.end);
exports.route.post('/api/jam-kerja/:id/pause', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.USER, prisma_1.Role.OWNER), jam_kerja_controller_1.JamKerjaController.pause);
exports.route.post('/api/jam-kerja/:id/resume', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.USER, prisma_1.Role.OWNER), jam_kerja_controller_1.JamKerjaController.resume);
exports.route.get('/api/jam-kerja', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), jam_kerja_controller_1.JamKerjaController.getHistory);
exports.route.get('/api/jam-kerja/rekap', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), jam_kerja_controller_1.JamKerjaController.rekap);
exports.route.get('/api/jam-kerja/aktif', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), jam_kerja_controller_1.JamKerjaController.getActive);
exports.route.get('/api/jam-kerja/summary', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), jam_kerja_controller_1.JamKerjaController.ownerSummary);
exports.route.get('/api/jam-kerja/user-summary', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), jam_kerja_controller_1.JamKerjaController.userSummary);
// KONFIGURASI
exports.route.get('/api/konfigurasi', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER), konfigurasi_controller_1.KonfigurasiController.get);
exports.route.put('/api/konfigurasi', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER), konfigurasi_controller_1.KonfigurasiController.update);
exports.route.get('/api/konfigurasi/effective', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), konfigurasi_controller_1.KonfigurasiController.getEffective);
exports.route.put('/api/konfigurasi/override/:username', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER), konfigurasi_controller_1.KonfigurasiController.putOverride);
exports.route.delete('/api/konfigurasi/override/:username', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER), konfigurasi_controller_1.KonfigurasiController.deleteOverride);
// DASHBOARD
exports.route.get('/api/dashboard/summary', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER), dashboard_controller_1.default.summary);
// CUSTOMER (MVP CRUD)
exports.route.post('/api/customers', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), customer_controller_1.CustomerController.create);
exports.route.get('/api/customers/:id', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), customer_controller_1.CustomerController.detail);
// Tambah pembayaran customer (OWNER only)
exports.route.post('/api/customers/:id/payments', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER), customer_controller_1.CustomerController.addPayment);
// Update total tagihan/invoice (OWNER only)
exports.route.patch('/api/customers/:id/invoice', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER), customer_controller_1.CustomerController.updateInvoice);
// List histori pembayaran customer (OWNER only; ubah jika mau buka untuk USER)
exports.route.get('/api/customers/:id/payments', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER), customer_controller_1.CustomerController.listPayments);
exports.route.delete('/api/customers/:id', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), customer_controller_1.CustomerController.remove);
exports.route.get('/api/customers', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), customer_controller_1.CustomerController.list);
// TUTON (MVP: tambah/hapus matkul + auto seed 19 item)
exports.route.post('/api/customers/:id/tuton-courses', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), tuton_controller_1.default.addCourse);
exports.route.delete('/api/tuton-courses/:courseId', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), tuton_controller_1.default.deleteCourse);
// OWNER mengelola KARIL
exports.route.put("/api/customers/:id/karil", auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), karil_controller_1.KarilController.upsert);
// GET detail KARIL by customerId (OWNER; ubah jika mau expose ke USER)
exports.route.get("/api/customers/:id/karil", auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), karil_controller_1.KarilController.detail);
// GET semua KARIL (OWNER)
exports.route.get("/api/karil", auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), karil_controller_1.KarilController.list);
// TUTON ITEMS
exports.route.get('/api/tuton-courses/:courseId/items', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), tuton_item_controller_1.default.listByCourse);
exports.route.patch('/api/tuton-items/:itemId', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), tuton_item_controller_1.default.update);
exports.route.patch('/api/tuton-items/:itemId/status', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), tuton_item_controller_1.default.updateStatus);
exports.route.patch('/api/tuton-items/:itemId/nilai', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), tuton_item_controller_1.default.updateNilai);
exports.route.patch('/api/tuton-items/:itemId/copas', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), tuton_item_controller_1.default.updateCopas); // opsional
exports.route.post('/api/tuton-courses/:courseId/items/init', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), tuton_item_controller_1.default.initForCourse);
exports.route.post('/api/tuton-courses/:courseId/items/bulk-status', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), tuton_item_controller_1.default.bulkUpdateStatus);
exports.route.post('/api/tuton-courses/:courseId/items/bulk-nilai', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), tuton_item_controller_1.default.bulkUpdateNilai);
// SUMMARY & CONFLICTS
exports.route.get('/api/tuton-courses/:courseId/summary', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), tuton_controller_1.default.summary);
exports.route.get('/api/tuton-courses/conflicts', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), tuton_controller_1.default.getConflicts);
exports.route.get('/api/tuton-courses/conflicts/:matkul', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), tuton_controller_1.default.getConflictByMatkul);
exports.route.get('/api/tuton/subjects', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), tuton_controller_1.default.listSubjects);
exports.route.get('/api/tuton/scan', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), tuton_controller_1.default.scan);
// // CONFLICTS (matkul duplikat lintas customer)
exports.route.get('/api/tuton-courses/conflicts', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), tuton_controller_1.default.getConflicts);
exports.route.get('/api/tuton-courses/conflicts/:matkul', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), tuton_controller_1.default.getConflictByMatkul);
// // CUSTOMER TUTON SUMMARY
exports.route.get('/api/customers/:id/tuton-summary', auth_middleware_1.authMiddleware, (0, require_role_1.requireRole)(prisma_1.Role.OWNER, prisma_1.Role.USER), customer_controller_1.CustomerController.getTutonSummary);
