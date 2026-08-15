import { prismaClient } from "../../config/database"

/**
 * Query khusus export. Password customer dan data autentikasi sengaja tidak
 * dipilih supaya tidak pernah ikut masuk ke file Excel.
 */
export class CustomerExportRepository {
  static async findAllWithDetails() {
    return prismaClient.customer.findMany({
      orderBy: [
        { namaCustomer: "asc" },
        { id: "asc" },
      ],
      select: {
        id: true,
        namaCustomer: true,
        noWa: true,
        nim: true,
        jurusan: true,
        jenis: true,
        layananTuton: true,
        layananKaril: true,
        layananMetodePenelitian: true,
        totalBayar: true,
        sudahBayar: true,
        sisaBayar: true,
        createdAt: true,
        updatedAt: true,
        payments: {
          orderBy: [
            { tanggalBayar: "asc" },
            { id: "asc" },
          ],
          select: {
            id: true,
            amount: true,
            tanggalBayar: true,
            catatan: true,
            createdAt: true,
          },
        },
        karil: {
          select: {
            id: true,
            judul: true,
            tugas1: true,
            tugas2: true,
            tugas3: true,
            tugas4: true,
            keterangan: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        metodePenelitian: {
          select: {
            id: true,
            judul: true,
            tugas1: true,
            tugas2: true,
            tugas3: true,
            tugas4: true,
            keterangan: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        tutonCourses: {
          orderBy: [
            { matkul: "asc" },
            { id: "asc" },
          ],
          select: {
            id: true,
            matkul: true,
            totalItems: true,
            completedItems: true,
            createdAt: true,
            updatedAt: true,
            items: {
              orderBy: [
                { sesi: "asc" },
                { jenis: "asc" },
                { id: "asc" },
              ],
              select: {
                id: true,
                jenis: true,
                sesi: true,
                status: true,
                nilai: true,
                username: true,
                deskripsi: true,
                selesaiAt: true,
                copasSoal: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    })
  }
}

export type CustomerExportRow = Awaited<
  ReturnType<typeof CustomerExportRepository.findAllWithDetails>
>[number]
