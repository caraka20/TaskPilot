import bcrypt from "bcrypt";
import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { unlink } from "node:fs/promises";
import { z } from "zod";
import { asyncRoute } from "../lib/http";
import { prisma } from "../lib/prisma";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../lib/password-policy";
import { avatarDiskPath, avatarUploadDir } from "../../config/uploads";

const router = Router();
const allowedAvatarMimeTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);
const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: avatarUploadDir,
    filename: (request, file, callback) => {
      const extension = allowedAvatarMimeTypes.get(file.mimetype) || ".bin";
      callback(null, `${request.auth!.sub}-${Date.now()}${extension}`);
    },
  }),
  limits: { files: 1, fileSize: 2 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (allowedAvatarMimeTypes.has(file.mimetype)) return callback(null, true);
    const error = new Error("Foto profil harus berformat JPG, PNG, atau WebP.") as Error & { statusCode?: number };
    error.statusCode = 422;
    callback(error);
  },
});

async function removeAvatar(avatarUrl: string | null | undefined) {
  const target = avatarDiskPath(avatarUrl);
  if (target) await unlink(target).catch(() => undefined);
}

router.get(
  "/auth/me",
  asyncRoute(async (request, response) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: request.auth!.sub },
      select: {
        id: true,
        name: true,
        namaLengkap: true,
        username: true,
        role: true,
        avatarUrl: true,
        dailyRate: true,
        canEditTutonWithoutWork: true,
        isActive: true,
        createdAt: true,
      },
    });
    response.json({ user: { ...user, name: user.name || user.namaLengkap } });
  }),
);

router.post(
  "/auth/avatar",
  avatarUpload.single("avatar"),
  asyncRoute(async (request, response) => {
    if (!request.file) {
      response.status(422).json({ message: "Pilih file foto profil terlebih dahulu." });
      return;
    }
    const before = await prisma.user.findUniqueOrThrow({ where: { id: request.auth!.sub } });
    const avatarUrl = `/uploads/avatars/${path.basename(request.file.filename)}`;
    try {
      const user = await prisma.user.update({
        where: { id: before.id },
        data: { avatarUrl },
        select: { id: true, username: true, name: true, namaLengkap: true, avatarUrl: true },
      });
      await removeAvatar(before.avatarUrl);
      response.json({ user: { ...user, name: user.name || user.namaLengkap } });
    } catch (error) {
      await removeAvatar(avatarUrl);
      throw error;
    }
  }),
);

router.delete(
  "/auth/avatar",
  asyncRoute(async (request, response) => {
    const before = await prisma.user.findUniqueOrThrow({ where: { id: request.auth!.sub } });
    await prisma.user.update({ where: { id: before.id }, data: { avatarUrl: null } });
    await removeAvatar(before.avatarUrl);
    response.status(204).send();
  }),
);

router.patch(
  "/auth/change-password",
  asyncRoute(async (request, response) => {
    const input = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
    }).parse(request.body);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: request.auth!.sub } });
    if (!(await bcrypt.compare(input.currentPassword, user.password))) {
      response.status(422).json({ message: "Password saat ini tidak sesuai." });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(input.newPassword, 12),
        token: null,
      },
    });
    response.json({ message: "Password baru berhasil disimpan." });
  }),
);

export const attendanceAccountRouter = router;
