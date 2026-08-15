import type { NextFunction, Response } from "express";
import { Role } from "../src/generated/prisma";
import { prismaClient } from "../src/config/database";
import { requireTutonWorkAccess } from "../src/middleware/require-tuton-work-access";
import type { UserRequest } from "../src/types/user-request";

jest.mock("../src/config/database", () => ({
  prismaClient: {
    jamKerja: {
      findFirst: jest.fn(),
    },
  },
}));

const findActiveWork = prismaClient.jamKerja.findFirst as jest.Mock;

function requestFor(options: {
  role?: Role;
  exempt?: boolean;
} = {}): UserRequest {
  return {
    user: {
      id: "user-id",
      username: "user-a",
      namaLengkap: "User A",
      name: "User A",
      password: "hash",
      role: options.role ?? Role.USER,
      token: null,
      avatarUrl: null,
      totalJamKerja: 0,
      totalGaji: 0,
      jedaOtomatis: true,
      canViewCustomerBilling: false,
      canEditTutonWithoutWork: options.exempt ?? false,
      dailyRate: {} as never,
      isActive: true,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  } as unknown as UserRequest;
}

describe("requireTutonWorkAccess", () => {
  beforeEach(() => {
    findActiveWork.mockReset();
  });

  it("mengizinkan OWNER tanpa memeriksa jam kerja", async () => {
    const next = jest.fn() as NextFunction;
    await requireTutonWorkAccess(
      requestFor({ role: Role.OWNER }),
      {} as Response,
      next,
    );

    expect(findActiveWork).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it("mengizinkan USER yang dikecualikan OWNER", async () => {
    const next = jest.fn() as NextFunction;
    await requireTutonWorkAccess(
      requestFor({ exempt: true }),
      {} as Response,
      next,
    );

    expect(findActiveWork).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it("mengizinkan USER biasa saat sesi kerja aktif", async () => {
    findActiveWork.mockResolvedValue({ id: 17 });
    const next = jest.fn() as NextFunction;
    await requireTutonWorkAccess(requestFor(), {} as Response, next);

    expect(findActiveWork).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ username: "user-a", isOpen: true }),
    }));
    expect(next).toHaveBeenCalledWith();
  });

  it("menolak USER biasa tanpa sesi kerja aktif", async () => {
    findActiveWork.mockResolvedValue(null);
    const next = jest.fn() as NextFunction;
    await requireTutonWorkAccess(requestFor(), {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 403,
      message: expect.stringContaining("Mulai atau lanjutkan jam kerja"),
    }));
  });
});
