import express from 'express'
import { Role } from '../generated/prisma'
import { authMiddleware } from '../middleware/auth-middleware'
import { requireRole } from '../middleware/require-role'
import { UserController } from '../app/user/user.controller'
import { GajiController } from '../app/gaji/gaji.controller'
import { JamKerjaController } from '../app/jam-kerja/jam-kerja.controller'
import { KonfigurasiController } from '../app/konfigurasi/konfigurasi.controller'
import DashboardController from '../app/dashboard/dashboard.controller'
import { CustomerController } from '../app/customer/customer.controller'
import TutonController from '../app/tuton/tuton.controller'
import { KarilController } from '../app/karil/karil.controller'
import TutonItemController from '../app/tuton-item/tuton-item.controller'

export const route = express.Router()

// HEALTH
route.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }))

// USER
route.post('/api/users/register',authMiddleware, requireRole(Role.OWNER), UserController.register)
route.post('/api/users/login', UserController.login)
route.get('/api/users', authMiddleware, requireRole(Role.OWNER), UserController.getAllUsers)
route.get('/api/users/:username', authMiddleware, UserController.getUserDetail)
route.post('/api/users/logout', authMiddleware, UserController.logout)
route.patch('/api/users/:username/jeda-otomatis', authMiddleware, requireRole(Role.OWNER), UserController.setJedaOtomatisUser)

// GAJI
route.post('/api/gaji', authMiddleware, requireRole(Role.OWNER), GajiController.createGaji)
route.get('/api/gaji', authMiddleware, requireRole(Role.OWNER), GajiController.getAllGaji)
route.patch('/api/gaji/:id', authMiddleware, requireRole(Role.OWNER), GajiController.updateGaji)
route.delete('/api/gaji/:id', authMiddleware, requireRole(Role.OWNER), GajiController.deleteGaji)
route.get('/api/gaji/me', authMiddleware, requireRole(Role.USER), GajiController.getMyGaji)
route.get('/api/gaji/me/summary', authMiddleware,requireRole(Role.USER), GajiController.getMySummary)

// ✅ NEW: Ringkasan gaji untuk OWNER
route.get('/api/gaji/summary', authMiddleware, requireRole(Role.OWNER), GajiController.getSummary)


// JAM KERJA
route.post('/api/jam-kerja/start', authMiddleware, requireRole(Role.USER, Role.OWNER), JamKerjaController.start)
route.patch('/api/jam-kerja/:id/end', authMiddleware, requireRole(Role.USER, Role.OWNER), JamKerjaController.end)
route.get('/api/jam-kerja', authMiddleware, requireRole(Role.OWNER, Role.USER), JamKerjaController.getHistory)
route.get('/api/jam-kerja/rekap', authMiddleware, requireRole(Role.OWNER, Role.USER), JamKerjaController.rekap)
route.get('/api/jam-kerja/aktif', authMiddleware, requireRole(Role.OWNER, Role.USER), JamKerjaController.getActive)
route.post('/api/jam-kerja/:id/pause',  authMiddleware, requireRole(Role.USER), JamKerjaController.pause)
route.post('/api/jam-kerja/:id/resume', authMiddleware, requireRole(Role.USER), JamKerjaController.resume)
// ⬇️ ADD: OWNER summary semua user (opsional filter username)
route.get(
  "/api/jam-kerja/summary",
  authMiddleware,
  requireRole(Role.OWNER, Role.USER),
  JamKerjaController.ownerSummary
);

// (opsional) ringkasan per-user, bisa untuk OWNER atau USER dirinya sendiri
route.get(
  "/api/jam-kerja/user-summary",
  authMiddleware,
  requireRole(Role.OWNER, Role.USER),
  JamKerjaController.userSummary
);


// KONFIGURASI
route.get('/api/konfigurasi', authMiddleware, requireRole(Role.OWNER), KonfigurasiController.get)
route.put('/api/konfigurasi', authMiddleware, requireRole(Role.OWNER), KonfigurasiController.update)
route.get('/api/konfigurasi/effective', authMiddleware, requireRole(Role.OWNER, Role.USER), KonfigurasiController.getEffective)
route.put('/api/konfigurasi/override/:username', authMiddleware, requireRole(Role.OWNER), KonfigurasiController.putOverride)
route.delete('/api/konfigurasi/override/:username', authMiddleware, requireRole(Role.OWNER), KonfigurasiController.deleteOverride)

// DASHBOARD
route.get('/api/dashboard/summary', authMiddleware, requireRole(Role.OWNER), DashboardController.summary)

// CUSTOMER (MVP CRUD)
route.post('/api/customers', authMiddleware, requireRole(Role.OWNER, Role.USER), CustomerController.create)
route.get('/api/customers/:id', authMiddleware, requireRole(Role.OWNER, Role.USER), CustomerController.detail)
// Tambah pembayaran customer (OWNER only)
route.post('/api/customers/:id/payments',authMiddleware, requireRole(Role.OWNER), CustomerController.addPayment)
// Update total tagihan/invoice (OWNER only)
route.patch('/api/customers/:id/invoice',authMiddleware, requireRole(Role.OWNER),CustomerController.updateInvoice )
// List histori pembayaran customer (OWNER only; ubah jika mau buka untuk USER)
route.get('/api/customers/:id/payments',authMiddleware, requireRole(Role.OWNER),CustomerController.listPayments )
route.delete('/api/customers/:id', authMiddleware, requireRole(Role.OWNER, Role.USER), CustomerController.remove)
route.get('/api/customers', authMiddleware, requireRole(Role.OWNER, Role.USER), CustomerController.list)


// TUTON (MVP: tambah/hapus matkul + auto seed 19 item)
route.post('/api/customers/:id/tuton-courses', authMiddleware, requireRole(Role.OWNER, Role.USER), TutonController.addCourse)
route.delete('/api/tuton-courses/:courseId', authMiddleware, requireRole(Role.OWNER, Role.USER), TutonController.deleteCourse)

// KARIL (MVP: upsert 1x)
route.put('/api/customers/:id/karil', authMiddleware, requireRole(Role.OWNER), KarilController.upsert)

// TUTON ITEMS
route.get('/api/tuton-courses/:courseId/items', authMiddleware, requireRole(Role.OWNER, Role.USER), TutonItemController.listByCourse)
route.patch('/api/tuton-items/:itemId', authMiddleware, requireRole(Role.OWNER, Role.USER), TutonItemController.update)              // update status/nilai/deskripsi sekaligus
route.patch('/api/tuton-items/:itemId/status', authMiddleware, requireRole(Role.OWNER, Role.USER), TutonItemController.updateStatus) // opsional: khusus status
route.patch('/api/tuton-items/:itemId/nilai', authMiddleware, requireRole(Role.OWNER, Role.USER), TutonItemController.updateNilai)   // opsional: khusus nilai
route.post('/api/tuton-courses/:courseId/items/init', authMiddleware, requireRole(Role.OWNER, Role.USER), TutonItemController.initForCourse)
route.post('/api/tuton-courses/:courseId/items/bulk-status', authMiddleware, requireRole(Role.OWNER, Role.USER), TutonItemController.bulkUpdateStatus)
route.post('/api/tuton-courses/:courseId/items/bulk-nilai', authMiddleware, requireRole(Role.OWNER, Role.USER), TutonItemController.bulkUpdateNilai)
route.get('/api/tuton-courses/:courseId/summary', authMiddleware, requireRole(Role.OWNER, Role.USER), TutonController.summary)

// // CONFLICTS (matkul duplikat lintas customer)
route.get('/api/tuton-courses/conflicts', authMiddleware, requireRole(Role.OWNER, Role.USER), TutonController.getConflicts)
route.get('/api/tuton-courses/conflicts/:matkul', authMiddleware, requireRole(Role.OWNER, Role.USER), TutonController.getConflictByMatkul)

// // CUSTOMER TUTON SUMMARY
route.get('/api/customers/:id/tuton-summary', authMiddleware, requireRole(Role.OWNER, Role.USER), CustomerController.getTutonSummary)

