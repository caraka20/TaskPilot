import { Router } from "express";
import { Role } from "../generated/prisma";
import { authMiddleware } from "../middleware/auth-middleware";
import { requireRole } from "../middleware/require-role";
import { adminRouter } from "./modules/admin/admin.routes";
import { attendanceAccountRouter } from "./modules/account.routes";
import { employeeRouter } from "./modules/employee/employee.routes";
import { asyncRoute } from "./lib/http";
import { runAttendanceAutomation } from "./services/automation.service";

export const attendanceRouter = Router();

attendanceRouter.use(authMiddleware);
attendanceRouter.use(attendanceAccountRouter);
// Endpoint employee utama dipasang langsung di /api/attendance agar sesuai
// dengan kontrak yang digunakan frontend, misalnya:
//   /api/attendance/dashboard/me
//   /api/attendance/products
// Prefix /employee tetap dipertahankan sebagai alias untuk kompatibilitas
// dengan client lama atau integrasi eksternal yang sudah menggunakannya.
attendanceRouter.use(employeeRouter);
attendanceRouter.use("/employee", employeeRouter);
attendanceRouter.use("/admin", requireRole(Role.OWNER), adminRouter);
attendanceRouter.post(
  "/admin/automation/run",
  requireRole(Role.OWNER),
  asyncRoute(async (_request, response) => {
    response.json(await runAttendanceAutomation());
  }),
);
