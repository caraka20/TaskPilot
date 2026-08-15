import path from "node:path";
import { mkdirSync } from "node:fs";

export const uploadRoot = path.resolve(
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"),
);
export const avatarUploadDir = path.join(uploadRoot, "avatars");

mkdirSync(avatarUploadDir, { recursive: true });

export function avatarDiskPath(avatarUrl: string | null | undefined) {
  if (!avatarUrl?.startsWith("/uploads/avatars/")) return null;
  const filename = path.basename(avatarUrl);
  const target = path.join(avatarUploadDir, filename);
  return target.startsWith(`${avatarUploadDir}${path.sep}`) ? target : null;
}
