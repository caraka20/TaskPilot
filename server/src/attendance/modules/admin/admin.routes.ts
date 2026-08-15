import { Router } from "express";
import { adminAuditRouter } from "./audit.routes";
import { adminCalendarRouter } from "./calendar.routes";
import { adminDashboardRouter } from "./dashboard.routes";
import { adminNotesRouter } from "./notes.routes";
import { adminPayrollRouter } from "./payroll.routes";
import { adminProductsRouter } from "./products.routes";
import { adminTasksRouter } from "./tasks.routes";
import { adminUsersRouter } from "./users.routes";
import { adminWorkEntriesRouter } from "./work-entries.routes";

export const adminRouter = Router();

adminRouter.use(adminDashboardRouter);
adminRouter.use(adminCalendarRouter);
adminRouter.use(adminUsersRouter);
adminRouter.use(adminProductsRouter);
adminRouter.use(adminWorkEntriesRouter);
adminRouter.use(adminPayrollRouter);
adminRouter.use(adminTasksRouter);
adminRouter.use(adminNotesRouter);
adminRouter.use(adminAuditRouter);
