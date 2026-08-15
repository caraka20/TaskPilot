import { prismaClient } from "../../config/database";

// Attendance and the original TaskPilot modules intentionally share one
// Prisma client and therefore one transaction pool/database.
export const prisma = prismaClient;
