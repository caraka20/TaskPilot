"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaClient = void 0;
const prisma_1 = require("../generated/prisma");
exports.prismaClient = new prisma_1.PrismaClient({
    log: [
        { emit: "event", level: "query" },
        { emit: "event", level: "info" },
        { emit: "event", level: "warn" },
        { emit: "event", level: "error" }
    ]
});
